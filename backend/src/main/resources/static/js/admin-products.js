document.addEventListener('DOMContentLoaded', initAdmin);

let products = [];
let activeProductId = null;

async function initAdmin() {
    bindEvents();
    await loadProducts();
}

function bindEvents() {
    document.querySelector('#newProductButton').addEventListener('click', () => openEditor());
    document.querySelector('#closeEditorButton').addEventListener('click', closeEditor);
    document.querySelector('#cancelButton').addEventListener('click', closeEditor);
    document.querySelector('#refreshButton').addEventListener('click', loadProducts);
    document.querySelector('#retryButton').addEventListener('click', loadProducts);
    document.querySelector('#adminSearch').addEventListener('input', renderTable);
    document.querySelector('#statusFilter').addEventListener('change', renderTable);
    document.querySelector('#productForm').addEventListener('submit', saveProduct);
    document.querySelector('#newVariantButton').addEventListener('click', () => openVariantForm());
    document.querySelector('#cancelVariantButton').addEventListener('click', closeVariantForm);
    document.querySelector('#variantForm').addEventListener('submit', saveVariant);
}

async function loadProducts() {
    setLoading(true);
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('取得商品失敗');
        products = await response.json();
        renderTable();
        showError(false);
    } catch (error) {
        showError(true, error.message);
    } finally {
        setLoading(false);
    }
}

function renderTable() {
    const keyword = document.querySelector('#adminSearch').value.trim().toLowerCase();
    const status = document.querySelector('#statusFilter').value;
    const filtered = products.filter(product => {
        const matchesKeyword = !keyword
            || `${product.name} ${product.category}`.toLowerCase().includes(keyword);
        const matchesStatus = status === 'all'
            || (status === 'available' && product.status === '上架')
            || (status === 'inactive' && product.status === '下架');
        return matchesKeyword && matchesStatus;
    });

    document.querySelector('#productCount').textContent = `共 ${filtered.length} 個商品系列`;
    document.querySelector('#emptyState').classList.toggle('is-hidden', filtered.length > 0);
    document.querySelector('#productTable').innerHTML = filtered.map(renderRow).join('');

    document.querySelectorAll('[data-action="edit"]').forEach(button => {
        button.addEventListener('click', () => openEditor(Number(button.dataset.id)));
    });
    document.querySelectorAll('[data-action="status"]').forEach(button => {
        button.addEventListener('click', () => toggleStatus(Number(button.dataset.id)));
    });
    document.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', () => deleteProduct(Number(button.dataset.id)));
    });
}

function renderRow(product) {
    const variants = product.variants ?? [];
    const firstVariant = variants[0];
    const firstImage = firstVariant?.images?.find(image => image.isPrimary)
        ?? firstVariant?.images?.[0];
    const models = [...new Set(variants.map(variant => variant.model))].join('、') || '尚未設定型號';
    const prices = variants.map(variant => Number(variant.price)).filter(Number.isFinite);
    const priceText = prices.length
        ? `NT$ ${Math.min(...prices).toLocaleString()} 起`
        : '尚未設定價格';
    const nextStatus = product.status === '上架' ? '下架' : '上架';

    return `
        <tr>
            <td>
                <div class="admin-product">
                    ${firstImage ? `<img src="${firstImage.imageUrl}" alt="${product.name}">` : ''}
                    <div><strong>${product.name}</strong><small>${product.category ?? ''}</small></div>
                </div>
            </td>
            <td>${models}</td>
            <td class="price">${priceText}</td>
            <td><span class="status ${product.status === '上架' ? 'available' : 'inactive'}">${product.status}</span></td>
            <td>
                <div class="row-actions">
                    <button class="small-button" data-action="edit" data-id="${product.id}">編輯</button>
                    <button class="small-button" data-action="status" data-id="${product.id}">${nextStatus}</button>
                    <button class="small-button danger" data-action="delete" data-id="${product.id}">刪除</button>
                </div>
            </td>
        </tr>
    `;
}

function openEditor(id = null) {
    const form = document.querySelector('#productForm');
    form.reset();
    document.querySelector('#productId').value = '';
    document.querySelector('#variantId').value = '';
    document.querySelector('#imageId').value = '';
    document.querySelector('#stock').value = 10;
    document.querySelector('#editorTitle').textContent = id ? '編輯商品' : '新增商品';
    activeProductId = id;
    document.querySelector('#variantPanel').classList.toggle('is-hidden', !id);

    if (id) {
        const product = products.find(item => item.id === id);
        const variant = product?.variants?.[0];
        const image = variant?.images?.find(item => item.isPrimary) ?? variant?.images?.[0];
        if (!product) return;

        document.querySelector('#productId').value = product.id;
        document.querySelector('#name').value = product.name ?? '';
        document.querySelector('#category').value = product.category ?? '';
        document.querySelector('#description').value = product.description ?? '';
        document.querySelector('#status').value = product.status ?? '上架';
        if (variant) {
            document.querySelector('#variantId').value = variant.id;
            document.querySelector('#brand').value = variant.brand ?? '';
            document.querySelector('#model').value = variant.model ?? '';
            document.querySelector('#color').value = variant.color ?? '';
            document.querySelector('#price').value = variant.price ?? '';
            document.querySelector('#stock').value = variant.stock ?? 0;
            document.querySelector('#sku').value = variant.sku ?? '';
        }
        if (image) {
            document.querySelector('#imageId').value = image.id;
            document.querySelector('#imageUrl').value = image.imageUrl ?? '';
        }

        openVariantPanel(id);
    }

    document.querySelector('#editorPanel').classList.remove('is-hidden');
    document.querySelector('#editorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveProduct(event) {
    event.preventDefault();
    const productId = document.querySelector('#productId').value;
    const variantId = document.querySelector('#variantId').value;
    const imageId = document.querySelector('#imageId').value;

    const productPayload = {
        name: valueOf('name'),
        category: valueOf('category'),
        description: valueOf('description'),
        status: valueOf('status')
    };

    const variantPayload = {
        brand: valueOf('brand'),
        model: valueOf('model'),
        color: valueOf('color'),
        price: Number(valueOf('price')),
        stock: Number(valueOf('stock')),
        sku: valueOf('sku'),
        status: valueOf('status')
    };

    try {
        const savedProduct = await request(
            productId ? `/api/products/${productId}` : '/api/products',
            productId ? 'PUT' : 'POST',
            productPayload
        );
        const savedProductId = savedProduct.id;
        let savedVariantId = variantId;

        if (variantId) {
            await request(`/api/products/${savedProductId}/variants/${variantId}`, 'PUT', variantPayload);
        } else {
            const savedVariant = await request(`/api/products/${savedProductId}/variants`, 'POST', variantPayload);
            savedVariantId = savedVariant.id;
        }

        const imageUrl = valueOf('imageUrl');
        if (imageUrl) {
            const imagePayload = { imageUrl, sortOrder: 1, isPrimary: true };
            if (imageId) {
                await request(`/api/variants/${savedVariantId}/images/${imageId}`, 'PUT', imagePayload);
            } else {
                await request(`/api/variants/${savedVariantId}/images`, 'POST', imagePayload);
            }
        }

        closeEditor();
        showNotice('商品資料已儲存');
        await loadProducts();
        openVariantPanel(savedProductId);
    } catch (error) {
        showNotice(error.message, true);
    }
}

function openVariantPanel(productId) {
    activeProductId = productId;
    const product = products.find(item => item.id === Number(productId));
    if (!product) return;
    document.querySelector('#variantTitle').textContent = `${product.name}｜商品規格`;
    document.querySelector('#variantPanel').classList.remove('is-hidden');
    closeVariantForm();
    renderVariantTable(product);
}

function renderVariantTable(product) {
    const variants = product.variants ?? [];
    document.querySelector('#variantTable').innerHTML = variants.map(variant => `
        <tr>
            <td>${variant.brand}</td>
            <td>${variant.model}</td>
            <td>${variant.color}</td>
            <td class="price">NT$ ${Number(variant.price).toLocaleString()}</td>
            <td>${variant.stock}</td>
            <td>${variant.sku}</td>
            <td><span class="status ${variant.status === '上架' ? 'available' : 'inactive'}">${variant.status}</span></td>
            <td><div class="row-actions"><button class="small-button" data-variant-action="edit" data-id="${variant.id}">編輯</button><button class="small-button danger" data-variant-action="delete" data-id="${variant.id}">刪除</button></div></td>
        </tr>
    `).join('');

    document.querySelectorAll('[data-variant-action="edit"]').forEach(button => {
        button.addEventListener('click', () => openVariantForm(Number(button.dataset.id)));
    });
    document.querySelectorAll('[data-variant-action="delete"]').forEach(button => {
        button.addEventListener('click', () => deleteVariant(Number(button.dataset.id)));
    });
}

function openVariantForm(variantId = null) {
    const product = products.find(item => item.id === Number(activeProductId));
    if (!product) return;
    const variant = product.variants?.find(item => item.id === variantId);
    const image = variant?.images?.find(item => item.isPrimary) ?? variant?.images?.[0];
    const form = document.querySelector('#variantForm');

    form.reset();
    document.querySelector('#variantFormId').value = variant?.id ?? '';
    document.querySelector('#variantBrand').value = variant?.brand ?? '';
    document.querySelector('#variantModel').value = variant?.model ?? '';
    document.querySelector('#variantColor').value = variant?.color ?? '';
    document.querySelector('#variantPrice').value = variant?.price ?? '';
    document.querySelector('#variantStock').value = variant?.stock ?? 0;
    document.querySelector('#variantSku').value = variant?.sku ?? '';
    document.querySelector('#variantStatus').value = variant?.status ?? '上架';
    document.querySelector('#variantImageUrl').value = image?.imageUrl ?? '';
    form.classList.remove('is-hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function saveVariant(event) {
    event.preventDefault();
    const variantId = document.querySelector('#variantFormId').value;
    const payload = {
        brand: valueOf('variantBrand'),
        model: valueOf('variantModel'),
        color: valueOf('variantColor'),
        price: Number(valueOf('variantPrice')),
        stock: Number(valueOf('variantStock')),
        sku: valueOf('variantSku'),
        status: valueOf('variantStatus')
    };

    try {
        const variant = await request(
            variantId
                ? `/api/products/${activeProductId}/variants/${variantId}`
                : `/api/products/${activeProductId}/variants`,
            variantId ? 'PUT' : 'POST',
            payload
        );
        const imageUrl = valueOf('variantImageUrl');
        if (imageUrl) {
            const current = products.find(item => item.id === Number(activeProductId))
                ?.variants?.find(item => item.id === Number(variantId));
            const image = current?.images?.find(item => item.isPrimary) ?? current?.images?.[0];
            const imagePayload = { imageUrl, sortOrder: 1, isPrimary: true };
            if (image) {
                await request(`/api/variants/${variant.id}/images/${image.id}`, 'PUT', imagePayload);
            } else {
                await request(`/api/variants/${variant.id}/images`, 'POST', imagePayload);
            }
        }

        showNotice('商品規格已儲存');
        closeVariantForm();
        await loadProducts();
        openVariantPanel(activeProductId);
    } catch (error) {
        showNotice(error.message, true);
    }
}

async function deleteVariant(variantId) {
    if (!window.confirm('確定要刪除這筆手機規格嗎？對應圖片也可能一併失效。')) return;
    try {
        await request(`/api/products/${activeProductId}/variants/${variantId}`, 'DELETE');
        showNotice('商品規格已刪除');
        await loadProducts();
        openVariantPanel(activeProductId);
    } catch (error) {
        showNotice(error.message, true);
    }
}

function closeVariantForm() {
    document.querySelector('#variantForm').classList.add('is-hidden');
}

async function toggleStatus(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;
    const status = product.status === '上架' ? '下架' : '上架';

    try {
        await request(`/api/products/${id}/status?status=${encodeURIComponent(status)}`, 'PATCH');
        showNotice(`商品已${status}`);
        await loadProducts();
    } catch (error) {
        showNotice(error.message, true);
    }
}

async function deleteProduct(id) {
    if (!window.confirm('確定要刪除這個商品系列嗎？底下的規格與圖片也會一併刪除。')) return;

    try {
        await request(`/api/products/${id}`, 'DELETE');
        showNotice('商品已刪除');
        await loadProducts();
    } catch (error) {
        showNotice(error.message, true);
    }
}

async function request(url, method, body) {
    const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `操作失敗（${response.status}）`);
    }
    return response.status === 204 ? null : response.json();
}

function valueOf(id) {
    return document.querySelector(`#${id}`).value.trim();
}

function closeEditor() {
    document.querySelector('#editorPanel').classList.add('is-hidden');
}

function showNotice(message, isError = false) {
    const notice = document.querySelector('#notice');
    notice.textContent = message;
    notice.classList.toggle('is-error', isError);
    notice.classList.remove('is-hidden');
    window.setTimeout(() => notice.classList.add('is-hidden'), 4000);
}

function setLoading(isLoading) {
    document.querySelector('#loadingState').classList.toggle('is-hidden', !isLoading);
}

function showError(isError, message = '') {
    const error = document.querySelector('#errorState');
    error.classList.toggle('is-hidden', !isError);
    if (message) document.querySelector('#errorMessage').textContent = message;
}
