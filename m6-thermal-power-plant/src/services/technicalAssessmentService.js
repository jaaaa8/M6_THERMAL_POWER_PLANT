const API_URL =
    "http://localhost:8080/api/v1/technical-assessment";

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImFjY291bnRJZCI6MSwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNzgyNzI4MzIzLCJleHAiOjE3ODI3MjkyMjN9.T2iQ8FPTqQ-y_1eiU0XyIJUYXWWU3xtqITM-HXngDKY";

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
};

export const getAllTechnicalAssessments = async () => {
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });

    console.log("Status:", response.status);

    const text = await response.text();

    console.log("Response:", text);

    if (!response.ok) {
        throw new Error(text);
    }

    return JSON.parse(text);
};

export const uploadPdf = async (item, file) => {
    if (!file) {
        throw new Error("File PDF không được null");
    }

    const formData = new FormData();

    formData.append("id", String(item.id));
    formData.append("pdfFile", file);

    const response = await fetch(`${API_URL}/edit`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.log("Status:", response.status);
        console.log("Error:", errorText);
        throw new Error(errorText);
    }

    return response.json();
};

export const createTechnicalAssessment = async (data) => {
    const response = await fetch(
        `${API_URL}/add`,
        {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error("Lưu phiếu thất bại");
    }

    return response.json();
};