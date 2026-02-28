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
};

export default authService;
