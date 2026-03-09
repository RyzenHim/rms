import api, { withAuth } from "./api";

const customerService = {
    async getCustomers(token, params = {}) {
        const { data } = await api.get("/customers", { ...withAuth(token), params });
        return data;
    },

    async getCustomerById(token, id) {
        const { data } = await api.get(`/customers/${id}`, withAuth(token));
        return data;
    },

    async updateCustomer(token, id, payload) {
        const { data } = await api.put(`/customers/${id}`, payload, withAuth(token));
        return data;
    },

    async toggleCustomerStatus(token, id, isActive) {
        const { data } = await api.patch(`/customers/${id}/status`, { isActive }, withAuth(token));
        return data;
    },

    async deleteCustomer(token, id) {
        const { data } = await api.delete(`/customers/${id}`, withAuth(token));
        return data;
    },

    async getCustomerStats(token) {
        const { data } = await api.get("/customers/stats", withAuth(token));
        return data;
    },
};

export default customerService;

