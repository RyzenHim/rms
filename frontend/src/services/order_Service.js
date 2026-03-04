import api, { withAuth } from "./api";

const orderService = {
  async getOrders(token, params = {}) {
    const { data } = await api.get("/orders", { ...withAuth(token), params });
    return data;
  },

  async createOrder(token, payload) {
    const { data } = await api.post("/orders", payload, withAuth(token));
    return data;
  },

  async updateOrderStatus(token, id, status) {
    const { data } = await api.patch(`/orders/${id}/status`, { status }, withAuth(token));
    return data;
  },

  async updatePaymentStatus(token, id, payload) {
    const { data } = await api.patch(`/orders/${id}/payment`, payload, withAuth(token));
    return data;
  },

  async cancelMyOrder(token, id) {
    const { data } = await api.patch(`/orders/${id}/cancel`, {}, withAuth(token));
    return data;
  },
};

export default orderService;
