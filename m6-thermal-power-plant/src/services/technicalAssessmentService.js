import apiClient from "./apiClient";

const API_URL = "/api/v1/technical-assessment";

export const getAllTechnicalAssessments = async () => {
    const response = await apiClient.get(API_URL);
    return response.data;
};

export const createTechnicalAssessment = async (
    data,
    imageFiles
) => {

    const formData = new FormData();

    formData.append(
        "data",
        new Blob(
            [JSON.stringify(data)],
            { type: "application/json" }
        )
    );

    imageFiles.forEach(file => {
        formData.append(
            "imageFiles",
            file
        );
    });

    for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }

    return apiClient.post(
        "/api/v1/technical-assessment/add",
        formData
    );
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