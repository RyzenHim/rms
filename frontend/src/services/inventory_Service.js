import api, { withAuth } from "./api";

const inventoryService = {
  async getInventory(token, params = {}) {
    const { data } = await api.get("/inventory", { ...withAuth(token), params });
    return data;
  },

  async getMetadata(token) {
    const { data } = await api.get("/inventory/metadata", withAuth(token));
    return data;
  },

  async getTransactions(token, params = {}) {
    const { data } = await api.get("/inventory/transactions", { ...withAuth(token), params });
    return data;
  },

  async createItem(token, payload) {
    const { data } = await api.post("/inventory", payload, withAuth(token));
    return data;
  },

  async updateItem(token, id, payload) {
    const { data } = await api.put(`/inventory/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteItem(token, id) {
    const { data } = await api.delete(`/inventory/${id}`, withAuth(token));
    return data;
  },

  async updateStock(token, id, payload) {
    const { data } = await api.patch(`/inventory/${id}/stock`, payload, withAuth(token));
    return data;
  },

  async createCategory(token, payload) {
    const { data } = await api.post("/inventory/categories", payload, withAuth(token));
    return data;
  },

  async updateCategory(token, id, payload) {
    const { data } = await api.put(`/inventory/categories/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteCategory(token, id) {
    const { data } = await api.delete(`/inventory/categories/${id}`, withAuth(token));
    return data;
  },

  async createUnit(token, payload) {
    const { data } = await api.post("/inventory/units", payload, withAuth(token));
    return data;
  },

  async updateUnit(token, id, payload) {
    const { data } = await api.put(`/inventory/units/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteUnit(token, id) {
    const { data } = await api.delete(`/inventory/units/${id}`, withAuth(token));
    return data;
  },
};

export default inventoryService;
