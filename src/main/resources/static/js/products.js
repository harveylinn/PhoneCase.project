document.addEventListener('DOMContentLoaded', loadProducts);

let catalogItems = [];
let selectedBrand = '';
let selectedModel = '';
let selectedStyle = '';
const favoriteKey = 'caselab-favorites';

async function loadProducts() {
    try {
        const products = await ProductAPI.getAllProducts();
        catalogItems = products.flatMap(product =>
            (product.variants ?? []).map(variant => ({ product, variant }))
        );

        setupBrandPicker();
        setupControls();
        setupStyleTabs();
        setupFavorites();
        renderCatalog();

        document.querySelector('#loadingState').classList.add('is-hidden');
    } catch (error) {
        document.querySelector('#loadingState').classList.add('is-hidden');
        document.querySelector('#errorState').classList.remove('is-hidden');
        console.error('商品載入失敗:', error);
    }
}

function setupBrandPicker() {
    const brands = [...new Set(catalogItems.map(item => item.variant.brand))];
    const container = document.querySelector('#brandButtons');

    container.innerHTML = brands.map(brand => `
        <button class="brand-button" type="button" data-brand="${brand}">
            ${brand}
        </button>
    `).join('');

    container.addEventListener('click', event => {
        const button = event.target.closest('[data-brand]');
        if (!button) return;

        selectedBrand = button.dataset.brand;
        selectedModel = '';
        updateBrandButtons();
        updateModelOptions();
        renderCatalog();
    });
}

function setupControls() {
    document.querySelector('#modelSelect').addEventListener('change', event => {
        selectedModel = event.target.value;
        renderCatalog();
    });

    document.querySelector('#applyFilters').addEventListener('click', renderCatalog);
    document.querySelector('#sort').addEventListener('change', renderCatalog);

    document.querySelector('#clearFilters').addEventListener('click', clearAllFilters);
    document.querySelector('#clearAdvanced').addEventListener('click', clearAdvancedFilters);
    document.querySelector('#retryButton').addEventListener('click', loadProducts);

    document.querySelector('#headerSearchForm').addEventListener('submit', event => {
        event.preventDefault();
        document.querySelector('#keyword').value =
            document.querySelector('#headerKeyword').value;
        renderCatalog();
    });

    const minRange = document.querySelector('#minRange');
    const maxRange = document.querySelector('#maxRange');
    minRange.addEventListener('input', () => {
        document.querySelector('#minPrice').value = minRange.value;
        updatePriceDisplay();
    });
    maxRange.addEventListener('input', () => {
        document.querySelector('#maxPrice').value = maxRange.value;
        updatePriceDisplay();
    });
}

function setupStyleTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedStyle = tab.dataset.style ?? '';
            document.querySelectorAll('.category-tab').forEach(item => {
                item.classList.toggle('is-active', item === tab);
            });
            renderCatalog();
        });
    });
}

function updateModelOptions() {
    const select = document.querySelector('#modelSelect');
    const models = [...new Set(catalogItems
        .filter(item => !selectedBrand || item.variant.brand === selectedBrand)
        .map(item => item.variant.model))];

    select.disabled = !selectedBrand;
    select.innerHTML = `<option value="">${selectedBrand ? '全部型號' : '請先選擇品牌'}</option>`
        + models.map(model => `<option value="${model}">${model}</option>`).join('');
    select.value = selectedModel;
}

function updateBrandButtons() {
    document.querySelectorAll('.brand-button').forEach(button => {
        button.classList.toggle('is-selected', button.dataset.brand === selectedBrand);
    });
}

function getFilteredItems() {
    const keyword = document.querySelector('#keyword').value.trim().toLowerCase();
    const category = document.querySelector('#category').value.trim().toLowerCase();
    const minPrice = Number(document.querySelector('#minPrice').value || 0);
    const maxInput = document.querySelector('#maxPrice').value;
    const maxPrice = maxInput ? Number(maxInput) : Infinity;

    return catalogItems.filter(({ product, variant }) => {
        const searchable = [
            product.name, product.description, variant.brand,
            variant.model, variant.color
        ].join(' ').toLowerCase();

        return (!keyword || searchable.includes(keyword))
            && (!category || product.category.toLowerCase().includes(category)
                || product.name.toLowerCase().includes(category))
            && (!selectedBrand || variant.brand === selectedBrand)
            && (!selectedModel || variant.model === selectedModel)
            && (!selectedStyle || product.name === selectedStyle)
            && variant.price >= minPrice
            && variant.price <= maxPrice;
    });
}

function sortItems(items) {
    const sort = document.querySelector('#sort').value;
    return [...items].sort((a, b) => {
        if (sort === 'price-asc') return a.variant.price - b.variant.price;
        if (sort === 'price-desc') return b.variant.price - a.variant.price;
        if (sort === 'name') return getVariantName(a.variant).localeCompare(getVariantName(b.variant));
        return b.variant.id - a.variant.id;
    });
}

function renderCatalog() {
    const items = sortItems(getFilteredItems());
    const grid = document.querySelector('#productGrid');

    grid.innerHTML = items.map(renderCard).join('');
    document.querySelector('#resultSummary').textContent = `找到 ${items.length} 件商品`;
    document.querySelector('#emptyState').classList.toggle('is-hidden', items.length > 0);
    document.querySelector('#activeFilters').innerHTML = getActiveFilters();
    updatePriceDisplay();
}

function renderCard({ product, variant }) {
    const image = variant.images?.find(item => item.isPrimary) ?? variant.images?.[0];
    const name = getVariantName(variant);

    return `
        <article class="product-card">
            <div class="product-image-wrap">
                ${image
                    ? `<img src="${image.imageUrl}" alt="${product.name}｜${name}" class="product-image">`
                    : '<div class="product-image-placeholder">尚無商品圖片</div>'}
                <button class="favorite-button ${isFavorite(variant.id) ? 'is-favorite' : ''}"
                        type="button" data-variant-id="${variant.id}" aria-label="加入收藏">
                    ${isFavorite(variant.id) ? '♥' : '♡'}
                </button>
            </div>
            <div class="product-card-body">
                <span class="product-category">${getStyleLabel(product.name)}</span>
                <h3>${name}</h3>
                <div class="product-tags">
                    <span>${variant.color}</span>
                    <span>${variant.stock > 0 ? '現貨' : '缺貨'}</span>
                </div>
                <div class="product-card-footer">
                    <strong class="product-price">NT$ ${variant.price.toLocaleString()}</strong>
                    <a href="product.html?id=${product.id}&variantId=${variant.id}">查看商品 →</a>
                </div>
            </div>
        </article>
    `;
}

function setupFavorites() {
    document.querySelector('#productGrid').addEventListener('click', event => {
        const button = event.target.closest('[data-variant-id]');
        if (!button) return;

        const variantId = button.dataset.variantId;
        const favorites = getFavorites();
        const index = favorites.indexOf(variantId);

        if (index >= 0) {
            favorites.splice(index, 1);
        } else {
            favorites.push(variantId);
        }

        localStorage.setItem(favoriteKey, JSON.stringify(favorites));
        renderCatalog();
    });
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(favoriteKey) ?? '[]');
    } catch {
        return [];
    }
}

function isFavorite(variantId) {
    return getFavorites().includes(String(variantId));
}

function getVariantName(variant) {
    return variant.model.startsWith(variant.brand)
        ? variant.model
        : `${variant.brand} ${variant.model}`;
}

function getStyleLabel(styleName) {
    const labels = {
        'AirX': '輕量防摔',
        'SolidX / SolidSuit': '經典防摔',
        'Clear': '透明防摔',
        'Mod NX': '模組化防摔',
        'Bumper': '邊框防摔',
        'ClearX': '透明輕薄'
    };

    return labels[styleName] ?? styleName;
}

function getActiveFilters() {
    const filters = [];
    if (selectedBrand) filters.push(selectedBrand);
    if (selectedModel) filters.push(selectedModel);
    if (selectedStyle) filters.push(getStyleLabel(selectedStyle));
    return filters.map(filter => `<span class="filter-chip">${filter}</span>`).join('');
}

function updatePriceDisplay() {
    const min = document.querySelector('#minPrice').value || 0;
    const max = document.querySelector('#maxPrice').value || 2000;
    document.querySelector('#priceDisplay').textContent = `NT$ ${min} – NT$ ${max}`;
}

function clearAdvancedFilters() {
    document.querySelector('#keyword').value = '';
    document.querySelector('#category').value = '';
    document.querySelector('#minPrice').value = '';
    document.querySelector('#maxPrice').value = '';
    document.querySelector('#minRange').value = 0;
    document.querySelector('#maxRange').value = 2000;
    renderCatalog();
}

function clearAllFilters() {
    selectedBrand = '';
    selectedModel = '';
    selectedStyle = '';
    clearAdvancedFilters();
    updateBrandButtons();
    updateModelOptions();
    document.querySelector('#headerKeyword').value = '';
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('is-active', !tab.dataset.style);
    });
}
