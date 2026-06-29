import axios from "axios";

const SPARE_PART_URL = '/api/v1/spare-parts';
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzM5Nzg4LCJleHAiOjE3ODI3NDA2ODh9.vBvm1UV1oV4O5ACB-nYTONWFPwVx2c14wbIOTm1hlq8"

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
