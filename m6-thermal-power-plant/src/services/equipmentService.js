import apiClient from "./apiClient";

const EQUIPMENT_URL = "/api/v1/equipments";

export const getAll = (params = {}) =>
  apiClient.get(EQUIPMENT_URL, {
    params,
  });

const TYPE_URL = "/api/v1/types";

export const findAll = (params) =>
  apiClient.get(EQUIPMENT_URL, { params });

export const getEquipmentTypes = () =>
  apiClient.get(TYPE_URL);