import apiClient from "./apiClient";

const API_URL = "/api/v1/technical-assessment";

export const getAllTechnicalAssessments = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const createTechnicalAssessment = async (
    data,
    images = []
) => {

    const formData = new FormData();

    formData.append(
        "data",
        new Blob(
            [JSON.stringify(data)],
            {
                type: "application/json",
            }
        )
    );

    images.forEach((image) => {
        formData.append(
            "imageFiles",
            image
        );
    });

    const response = await apiClient.post(
        `${API_URL}/add`,
        formData
    );

    return response.data;
};

export const uploadPdf = async (
    item,
    file
) => {
    const formData = new FormData();

    formData.append("id", String(item.id));
    formData.append("pdfFile", file);

    const response = await apiClient.post(
        `${API_URL}/edit`,
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data",
            },
        }
    );

    return response.data;
};