import axios from "axios";

const CONSUMABLE_URL = 'http://localhost:8080/api/v1/consumables';
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzM5Nzg4LCJleHAiOjE3ODI3NDA2ODh9.vBvm1UV1oV4O5ACB-nYTONWFPwVx2c14wbIOTm1hlq8"
export const getAll = () => {
    return axios.get(CONSUMABLE_URL,{
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const getById = (id) => {
    return axios.get(`${CONSUMABLE_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export const create = (data) => {
    return axios.post(
        CONSUMABLE_URL,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const update = (id, data) => {
    return axios.put(
        `${CONSUMABLE_URL}/${id}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export const remove = (id) => {
    return axios.delete(`${CONSUMABLE_URL}/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}
export { remove as delete };

export const search = (params) => {
    return axios.get(CONSUMABLE_URL, {
        params,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

