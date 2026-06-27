import axios from "axios";

const SPARE_PART_URL = '/api/v1/spare-parts';

export const getAll = () => {
    return axios.get(SPARE_PART_URL);
}

export const getById = (id) => {
    return axios.get(`${SPARE_PART_URL}/${id}`);
}

export const create = (data) => {
    return axios.post(SPARE_PART_URL, data);
}

export const update = (id, data) => {
    return axios.put(`${SPARE_PART_URL}/${id}`, data);
}

export const remove = (id) => {
    return axios.delete(`${SPARE_PART_URL}/${id}`);
}
export { remove as delete };

export const search = (params) => {
    return axios.get(SPARE_PART_URL, { params });
}
