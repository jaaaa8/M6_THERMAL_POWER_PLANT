import apiClient from "./apiClient";

const BASE_URL = "/api/v1/spare-parts-issue";

const sparePartIssueService = {
    // Lấy danh sách phiếu xuất vật tư
    getAll: async () => {
        const response = await apiClient.get(BASE_URL);
        return response.data;
    },

    // Lấy chi tiết phiếu
    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/update/${id}`);
        return response.data;
    },

    // Thêm phiếu xuất vật tư
    create: async (data) => {
        const response = await apiClient.post(
            `${BASE_URL}/add`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    },

    // Cập nhật phiếu
    update: async (data) => {
        const response = await apiClient.post(
            `${BASE_URL}/update`,
            data,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    },
};

export default sparePartIssueService;