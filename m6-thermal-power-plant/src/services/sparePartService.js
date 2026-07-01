import axios from "axios";

const SPARE_PART_URL = '/api/v1/spare-parts';
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyODk2MDk5LCJleHAiOjE3ODI4OTY5OTl9.QYnjTU9t5_U4-68yJ6oEBDMlINRXy6lF2uxql4LxxRs"

export const getAll = () => {
    return axios.get(SPARE_PART_URL, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const getById = (id) => {
    return axios.get(`${SPARE_PART_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const create = (data) => {
    return axios.post(SPARE_PART_URL, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const update = (id, data) => {
    return axios.put(`${SPARE_PART_URL}/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const remove = (id) => {
    return axios.delete(`${SPARE_PART_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}
export { remove as delete };

export const search = (params) => {
    return axios.get(SPARE_PART_URL, {
        params,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}
