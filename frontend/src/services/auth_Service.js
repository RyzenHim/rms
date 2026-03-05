import api, { withAuth } from "./api";

const authService = {
  async signup(payload) {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  },

  async login(payload) {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  async me(token) {
    const { data } = await api.get("/auth/me", withAuth(token));
    return data;
  },

  async updateProfile(token, payload) {
    const { data } = await api.patch("/auth/profile", payload, withAuth(token));
    return data;
  },

  async getAddresses(token) {
    const { data } = await api.get("/auth/profile/addresses", withAuth(token));
    return data;
  },

  async addAddress(token, payload) {
    const { data } = await api.post("/auth/profile/addresses", payload, withAuth(token));
    return data;
  },

  async updateAddress(token, id, payload) {
    const { data } = await api.patch(`/auth/profile/addresses/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteAddress(token, id) {
    const { data } = await api.delete(`/auth/profile/addresses/${id}`, withAuth(token));
    return data;
  },

  async setDefaultAddress(token, id) {
    const { data } = await api.patch(`/auth/profile/addresses/${id}/default`, {}, withAuth(token));
    return data;
  },
};

export default authService;
