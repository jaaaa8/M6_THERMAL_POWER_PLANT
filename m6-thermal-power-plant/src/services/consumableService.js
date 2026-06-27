import axios from "axios";

const CONSUMABLE_URL = '/api/v1/consumables';

export const getAll = () => {
    return axios.get(CONSUMABLE_URL);
}

export const getById = (id) => {
    return axios.get(`${CONSUMABLE_URL}/${id}`);
}

export const create = (data) => {
    return axios.post(CONSUMABLE_URL, data);
}

export const update = (id, data) => {
    return axios.put(`${CONSUMABLE_URL}/${id}`, data);
}

export const remove = (id) => {
    return axios.delete(`${CONSUMABLE_URL}/${id}`);
}
export { remove as delete };

export const search = (params) => {
    return axios.get(CONSUMABLE_URL, { params });
}

