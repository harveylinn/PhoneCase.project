document.addEventListener('DOMContentLoaded', loadProduct);

async function loadProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const variantId = params.get('variantId');

    if (!productId) {
        showError('網址缺少商品編號');
        return;
    }

    try {
        const product = await ProductAPI.getProductById(productId);
        renderProduct(product, variantId);
        document.querySelector('#loadingState').classList.add('is-hidden');
        document.querySelector('#productDetail').classList.remove('is-hidden');
    } catch (error) {
        showError('商品資料載入失敗');
        console.error('商品詳細載入失敗:', error);
    }
}

function renderProduct(product, variantId) {
    const detail = document.querySelector('#productDetail');
    const variants = product.variants ?? [];

    if (!variants.length) {
        showError('此商品尚未設定可用型號');
        return;
    }

    const selectedVariant = variants.find(variant =>
        String(variant.id) === String(variantId)
    ) ?? variants[0];

    const primaryImage = getPrimaryImage(selectedVariant);
    const imageHtml = primaryImage
        ? `<img id="detailImage" src="${primaryImage.imageUrl}" alt="${product.name}" class="detail-image">`
        : `<div class="product-image-placeholder">尚無商品圖片</div>`;

    const optionsHtml = variants.map(variant => `
        <option value="${variant.id}" ${variant.id === selectedVariant.id ? 'selected' : ''}>
            ${getVariantName(variant)}｜${variant.color}
        </option>
    `).join('');

    detail.innerHTML = `
        <section class="detail-media">
            <div class="detail-image-frame">${imageHtml}</div>
            <div id="detailThumbnails" class="detail-thumbnails"></div>
        </section>
        <section class="detail-copy">
            <p class="detail-category">${getStyleLabel(product.name)}</p>
            <h1>${getStyleLabel(product.name)}</h1>
            <p class="detail-description">${product.description ?? ''}</p>
            <div class="detail-info">
                <label for="variantSelect"><strong>選擇手機型號</strong></label>
                <select id="variantSelect">${optionsHtml}</select>
                <div class="detail-price-row"><strong>價格</strong><span id="detailPrice"></span></div>
                <div><strong>顏色</strong><span id="detailColor"></span></div>
            </div>
            <div class="detail-benefits">
                <div><strong>日常防護</strong><span>安心保護手機外觀</span></div>
                <div><strong>精準開孔</strong><span>貼合手機按鍵與鏡頭</span></div>
                <div><strong>舒適手感</strong><span>適合長時間日常使用</span></div>
            </div>
            <div class="detail-note">
                <strong>商品提醒</strong>
                <p>圖片為商品款式示意，實際規格依所選手機型號與顏色為準。</p>
            </div>
            <a href="products.html" class="button button-outline">返回商品列表</a>
        </section>
    `;

    updateVariantDisplay(selectedVariant);
    document.querySelector('#variantSelect').addEventListener('change', event => {
        const variant = variants.find(item => String(item.id) === event.target.value);
        if (variant) updateVariantDisplay(variant);
    });
}

function getPrimaryImage(variant) {
    return variant.images?.find(image => image.isPrimary) ?? variant.images?.[0];
}

function getVariantName(variant) {
    return variant.model.startsWith(variant.brand)
        ? variant.model
        : `${variant.brand} ${variant.model}`;
}

function updateVariantDisplay(variant) {
    const primaryImage = getPrimaryImage(variant);
    const imageElement = document.querySelector('#detailImage');

    if (primaryImage && imageElement) {
        imageElement.src = primaryImage.imageUrl;
        imageElement.alt = getVariantName(variant);
    }

    const thumbnails = document.querySelector('#detailThumbnails');
    if (thumbnails) {
        thumbnails.innerHTML = (variant.images ?? []).map((image, index) => `
            <button class="detail-thumbnail ${index === 0 ? 'is-active' : ''}" type="button">
                <img src="${image.imageUrl}" alt="商品圖片 ${index + 1}">
            </button>
        `).join('');

        thumbnails.querySelectorAll('.detail-thumbnail').forEach((button, index) => {
            button.addEventListener('click', () => {
                const image = variant.images[index];
                if (imageElement) {
                    imageElement.src = image.imageUrl;
                    imageElement.alt = `商品圖片 ${index + 1}`;
                }
                thumbnails.querySelectorAll('.detail-thumbnail').forEach(item =>
                    item.classList.remove('is-active')
                );
                button.classList.add('is-active');
            });
        });
    }

    document.querySelector('#detailColor').textContent = variant.color;
    document.querySelector('#detailPrice').textContent = `NT$ ${variant.price}`;
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

function showError(message) {
    document.querySelector('#loadingState').classList.add('is-hidden');
    document.querySelector('#errorState').classList.remove('is-hidden');
    document.querySelector('#errorMessage').textContent = message;
}
