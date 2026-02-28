import api, { withAuth } from "./api";

const themeService = {
  async getActiveTheme() {
    const { data } = await api.get("/theme/active");
    return data;
  },

  async updateTheme(token, payload) {
    const { data } = await api.put("/theme/active", payload, withAuth(token));
    return data;
  },
};

export default themeService;
