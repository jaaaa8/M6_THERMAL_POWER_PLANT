import axios from "axios";

const API_URL = "http://localhost:8080/api/v1/systems";
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzM5Nzg4LCJleHAiOjE3ODI3NDA2ODh9.vBvm1UV1oV4O5ACB-nYTONWFPwVx2c14wbIOTm1hlq8"

export const systemService = {

  getAll(name = "", status = "", page = 0, size = 10) {
    return axios.get(API_URL, {
      params: {
        name,
        status,
        page,
        size
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

  },


  getById(id) {
    return axios.get(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  create(data) {
    return axios.post(API_URL, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  remove(id) {
    return axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

};

export const heThongService = systemService;