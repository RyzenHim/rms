import api, { withAuth } from "./api";

const menuService = {
  async getPublicMenu() {
    const { data } = await api.get("/menu/public");
    return data;
  },

  async getAdminMenuData(token) {
    const { data } = await api.get("/menu/admin-data", withAuth(token));
    return data;
  },

  async createCategory(token, payload) {
    const { data } = await api.post("/menu/categories", payload, withAuth(token));
    return data;
  },

  async updateCategory(token, id, payload) {
    const { data } = await api.put(`/menu/categories/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteCategory(token, id) {
    const { data } = await api.delete(`/menu/categories/${id}`, withAuth(token));
    return data;
  },

  async createSubCategory(token, payload) {
    const { data } = await api.post("/menu/sub-categories", payload, withAuth(token));
    return data;
  },

  async updateSubCategory(token, id, payload) {
    const { data } = await api.put(`/menu/sub-categories/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteSubCategory(token, id) {
    const { data } = await api.delete(`/menu/sub-categories/${id}`, withAuth(token));
    return data;
  },

  async updateMenuPdf(token, base64) {
    const { data } = await api.put("/menu/pdf", { base64 }, withAuth(token));
    return data;
  },

  async createMenuItem(token, payload) {
    const { data } = await api.post("/menu/items", payload, withAuth(token));
    return data;
  },

  async updateMenuItem(token, id, payload) {
    const { data } = await api.put(`/menu/items/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteMenuItem(token, id) {
    const { data } = await api.delete(`/menu/items/${id}`, withAuth(token));
    return data;
  },
};

export default menuService;
