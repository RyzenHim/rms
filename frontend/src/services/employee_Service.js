import api, { withAuth } from "./api";

const employeeService = {
  async getEmployees(token, params = {}) {
    const { data } = await api.get("/employees", {
      ...withAuth(token),
      params,
    });
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

  async updateEmployeeStatus(token, id, isActive) {
    const { data } = await api.patch(`/employees/${id}/status`, { isActive }, withAuth(token));
    return data;
  },

  async restoreEmployee(token, id) {
    const { data } = await api.patch(`/employees/${id}/restore`, {}, withAuth(token));
    return data;
  },
};

export default employeeService;
