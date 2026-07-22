import apiClient from "./apiClient";

const BASE_URL = "/api/v1/consumable-issues";

const consumableIssueService = {
    search: async (params) => {
        const response = await apiClient.get(
            `${BASE_URL}/search`,
            {
                params
            }
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
            `${BASE_URL}/upload-consumable-issue`,
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

export default consumableIssueService;
