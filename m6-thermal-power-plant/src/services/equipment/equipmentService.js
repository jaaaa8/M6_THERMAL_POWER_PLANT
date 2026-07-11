import apiClient from "../apiClient";

const EQUIPMENT_URL = "/api/v1/equipments";

const TYPE_URL = "/api/v1/types";


export const getAll = (params = {}) =>
  apiClient.get(EQUIPMENT_URL, {
    params,
  });


export const findAll = (params) =>
  apiClient.get(EQUIPMENT_URL, { params });

export const getEquipmentTypes = () =>
  apiClient.get(TYPE_URL);

export const getBySystem = (systemId, params = {}) =>
  apiClient.get(`${EQUIPMENT_URL}/${systemId}`, {
    params,
  });
