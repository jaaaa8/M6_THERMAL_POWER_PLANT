import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL}/api/maintenance`;

const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzM5Nzg4LCJleHAiOjE3ODI3NDA2ODh9.vBvm1UV1oV4O5ACB-nYTONWFPwVx2c14wbIOTm1hlq8"

const authConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export const workOrderService = {
  getPendingRequests: (page = 0, size = 20) =>
      axios.get(
          `${BASE}/repair-requests/pending`,
          {
            ...authConfig,
            params: {
              page,
              size,
              sort: "createdAt,desc",
            },
          }
      ),

  getAll: (search, page = 0, size = 20) =>
      axios.get(
          `${BASE}/work-orders`,
          {
            ...authConfig,
            params: {
              search,
              page,
              size,
            },
          }
      ),

  create: (data) =>
      axios.post(
          `${BASE}/work-orders`,
          data,
          authConfig
      ),

  cancel: (id) =>
      axios.patch(
          `${BASE}/work-orders/${id}/cancel`,
          {},
          authConfig
      ),
};