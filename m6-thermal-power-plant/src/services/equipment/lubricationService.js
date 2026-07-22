import apiClient from "../apiClient";

const LUBRICATION_URL = "/api/v1/lubrication";
export const getByEquipment = (equipmentId) => {
    return apiClient.get(
        `${LUBRICATION_URL}/equipment/${equipmentId}`
    );
};