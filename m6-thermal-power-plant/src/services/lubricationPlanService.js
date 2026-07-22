import apiClient from "./apiClient";


const BASE_URL = "/api/v1/lubrication-plan";


const lubricationPlanService = {


    // lấy danh sách có phân trang
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


    // thêm mới kế hoạch bôi trơn
    create: async (data) => {

        const response = await apiClient.post(
            `${BASE_URL}/add`,
            data
        );

        return response.data;
    },


    // cập nhật (sau này dùng)
    update: async (
        id,
        data
    ) => {

        const response = await apiClient.put(
            `${BASE_URL}/${id}`,
            data
        );

        return response.data;
    },


    // lấy chi tiết
    getById: async (
        id
    ) => {

        const response = await apiClient.get(
            `${BASE_URL}/${id}`
        );

        return response.data;
    },


    // xóa
    // xóa
    remove: async (id) => {
        const response = await apiClient.delete(
            `${BASE_URL}/delete/${id}`
        );

        return response.data;
    }

};


export default lubricationPlanService;