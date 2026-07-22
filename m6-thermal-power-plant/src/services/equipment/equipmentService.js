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
  apiClient.get(`${EQUIPMENT_URL}/system/${systemId}`, {
    params,
  });

export const addEquipment = (systemId, formData) =>
  apiClient.post(
    `${EQUIPMENT_URL}/${systemId}/add`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
export const getById = (id) =>
  apiClient.get(`${EQUIPMENT_URL}/${id}`);

export const deleteById = (id) =>
  apiClient.delete(`${EQUIPMENT_URL}/${id}`);

export const update = (id, formData) =>
  apiClient.put(
    `${EQUIPMENT_URL}/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );