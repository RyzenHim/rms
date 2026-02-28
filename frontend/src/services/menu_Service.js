import api, { withAuth } from "./api";

const menuService = {
  async getPublicMenu() {
    const { data } = await api.get("/menu/public");
    return data;
  },

  async createCategory(token, payload) {
    const { data } = await api.post("/menu/categories", payload, withAuth(token));
    return data;
  },

  async createMenuItem(token, payload) {
    const { data } = await api.post("/menu/items", payload, withAuth(token));
    return data;
  },
};

export default menuService;
