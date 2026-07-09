import apiClient from "./apiClient";

const BASE_URL = "/api/v1/spare-parts-issue";

const sparePartIssueService = {
    getAll: async () => {
        const response = await apiClient.get(BASE_URL);
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`${BASE_URL}/update/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await apiClient.post(
            `${BASE_URL}/add`,
            data
        );

        return response.data;
    },

    update: async (data) => {
        const response = await apiClient.post(
            `${BASE_URL}/update`,
            data
        );

        return response.data;
    },

    uploadPdf: async (id, file) => {
        const formData = new FormData();

        formData.append("id", id);
        formData.append("pdf", file);

        const response = await apiClient.post(
            `${BASE_URL}/upload-spare-parts-issue`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    },
    getDetail: async (id) => {
        const response = await apiClient.get(
            `${BASE_URL}/detail/${id}`
        );

        return response.data;
    },
};

export default sparePartIssueService;