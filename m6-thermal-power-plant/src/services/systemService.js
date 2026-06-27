import axios from "axios";

const API_URL = "/api/v1/systems";

export const systemService = {

  getAll(name = "", status = "", page = 0, size = 10) {
    return axios.get(API_URL, {
      params: {
        name,
        status,
        page,
        size
      }
    });

  },


  getById(id) {
    return axios.get(`${API_URL}/${id}`);
  },

  create(data) {
    return axios.post(API_URL, data);
  },

  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data);
  },

  remove(id) {
    return axios.delete(`${API_URL}/${id}`);
  }

};

export const heThongService = systemService;