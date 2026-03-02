import api, { withAuth } from "./api";

const employeeService = {
  async getEmployees(token) {
    const { data } = await api.get("/employees", withAuth(token));
    return data;
  },

  async createEmployee(token, payload) {
    const { data } = await api.post("/employees", payload, withAuth(token));
    return data;
  },

  async updateEmployee(token, id, payload) {
    const { data } = await api.put(`/employees/${id}`, payload, withAuth(token));
    return data;
  },

  async deleteEmployee(token, id) {
    const { data } = await api.delete(`/employees/${id}`, withAuth(token));
    return data;
  },
};

export default employeeService;
