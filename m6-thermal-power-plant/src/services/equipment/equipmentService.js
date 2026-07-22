import apiClient from "../apiClient";

const EQUIPMENT_URL = "/api/v1/equipments";
const TYPE_URL = "/api/v1/types";
const UNIT_URL = "/api/v1/units";

export const getAll = (params = {}) =>
  apiClient.get(EQUIPMENT_URL, { params });

export const findAll = (params) =>
  apiClient.get(EQUIPMENT_URL, { params });

export const getById = (id) =>
  apiClient.get(`${EQUIPMENT_URL}/${id}`);

export const create = (data) =>
  apiClient.post(EQUIPMENT_URL, data);

export const update = (id, data) =>
  apiClient.put(`${EQUIPMENT_URL}/${id}`, data);

export const remove = (id) =>
  apiClient.delete(`${EQUIPMENT_URL}/${id}`);

export { remove as delete };

export const getEquipmentTypes = () =>
  apiClient.get(TYPE_URL);

export const getUnits = () =>
  apiClient.get(UNIT_URL);

export const getBySystem = (systemId, params = {}) =>
  apiClient.get(`${EQUIPMENT_URL}/${systemId}`, { params });
