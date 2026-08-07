import apiClient from "./apiClient";

const BASE_URL = "/api/v1/lubrication-plan";

const lubricationPlanService = {

    search: async (
        keyword = "",
        status = "",
        page = 0,
        size = 10
    ) => {

        const response = await apiClient.get(
            BASE_URL,
            {
                params: {
                    keyword,
                    status,
                    page,
                    size
                }
            }
        );

        return response.data;
    },

    create: async (data) => {

        const response = await apiClient.post(
            `${BASE_URL}/add`,
            data
        );

        return response.data;
    },

    update: async (id, data) => {

        const response = await apiClient.put(
            `${BASE_URL}/${id}`,
            data
        );

        return response.data;
    },

    getById: async (id) => {

        const response = await apiClient.get(
            `${BASE_URL}/${id}`
        );

        return response.data;
    },

    remove: async (id) => {

        const response = await apiClient.delete(
            `${BASE_URL}/delete/${id}`
        );

        return response.data;
    },

    checklist: async (
        systemId = null,
        status = null,
        page = 0,
        size = 10
    ) => {

        const params = {
            page,
            size
        };

        if (systemId) {
            params.systemId = systemId;
        }

        if (status) {
            params.status = status;
        }

        const response = await apiClient.get(
            `${BASE_URL}/checklist`,
            {
                params
            }
        );

        return response.data;
    },

    lockedPlanIds: async () => {
        const response = await apiClient.get(`${BASE_URL}/locked-plan-ids`);
        return response.data;
    }

};

export default lubricationPlanService;