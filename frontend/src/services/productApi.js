export async function getProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('商品資料載入失敗');
  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) throw new Error('商品詳細資料載入失敗');
  return response.json();
}
