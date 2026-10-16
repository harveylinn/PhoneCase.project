const ProductAPI = {

  async getAllProducts(){
      const response = await fetch('/api/products');

      if (!response.ok){
        throw new Error('取得商品失敗');
      }

      return response.json();
  },
  async getProductById(id){
    const response = await fetch(`/api/products/${id}`);

    if (!response.ok){
      throw new Error('取得商品詳細資料失敗');
    }

    return response.json();

  },
  async getAvailableProducts(){
    const response = await fetch('/api/products/available');

    if (!response.ok){
      throw new Error('取得商品失敗');
    }

    return response.json();
  },
  async searchProducts(keyword){
    const query = new URLSearchParams({
      keyword: keyword
    });

    const response = await fetch(
        `/api/products/search?${query.toString()}`
    );

    if (!response.ok){
      throw new Error('搜尋商品失敗');
    }

    return response.json();
  },
  async getProductsByCategory(category) {
    const query = new URLSearchParams({
      category: category
    });

    const response = await fetch(
        `/api/products/category?${query.toString()}`
    );

    if (!response.ok) {
      throw new Error('取得分類商品失敗');
    }

    return response.json();
  },
  async getProductsByModel(model){
    const query = new URLSearchParams({
      model: model
    });
    const response = await fetch(`/api/products/model?${query.toString()}`);

    if (!response.ok){
      throw new Error('取得型號商品失敗');
    }

    return response.json();
  },
  async filterProducts(filters) {
    const query = new URLSearchParams();

    if (filters.keyword) {
      query.set('keyword', filters.keyword);
    }
    if (filters.category) {
      query.set('category', filters.category);
    }
    if (filters.model) {
      query.set('model', filters.model);
    }
    if (filters.minPrice !== undefined && filters.minPrice !== '') {
      query.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      query.set('maxPrice', filters.maxPrice);
    }

    const response = await fetch(
        `/api/products/filter?${query.toString()}`
    );

    if (!response.ok) {
      throw new Error('篩選商品失敗');
    }

    return response.json();
  }
};