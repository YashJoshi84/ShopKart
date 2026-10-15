import API from './api';

export const getProducts = async (search, category) => {
  const params = {};
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (category && category !== 'All Categories' && category.trim()) {
    params.category = category.trim();
  }

  const res = await API.get('/products/getall', { params });
  const data = res.data;
  return data.products || (Array.isArray(data) ? data : []);
};

export const addProductToWishlist = async (productId) => {
  const res = await API.post(`/customers/wishlist/${productId}`);
  return res.data;
};

export const getWishlist = async () => {
  const res = await API.get('/customers/wishlist');
  return res.data;
};

export const removeProductFromWishlist = async (productId) => {
  const res = await API.delete(`/customers/wishlist/${productId}`);
  return res.data;
};
