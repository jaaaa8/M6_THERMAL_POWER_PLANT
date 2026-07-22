import apiClient from "./apiClient";

const API_URL = "/api/v1/technical-assessment";


/**
 * Lấy danh sách đánh giá kỹ thuật
 * GET /api/v1/technical-assessment/search
 */
export const getAllTechnicalAssessments = async (
    params = {}
) => {

    const response = await apiClient.get(
        `${API_URL}/search`,
        {
            params
        }
    );

    return response.data;
};


/**
 * Lấy form thêm mới
 * GET /api/v1/technical-assessment/add
 */
export const getTechnicalAssessmentForm = async () => {

    const response = await apiClient.get(
        `${API_URL}/add`
    );

    return response.data;
};



/**
 * Thêm phiếu đánh giá kỹ thuật
 *
 * POST /api/v1/technical-assessment/add
 *
 * multipart:
 *  data       : TechnicalAssessmentCreateRequestDto
 *  imageFiles : MultipartFile[]
 */
export const createTechnicalAssessment = async (
    data,
    imageFiles = []
) => {

    const formData = new FormData();


    formData.append(
        "data",
        new Blob(
            [
                JSON.stringify(data)
            ],
            {
                type: "application/json"
            }
        )
    );


    imageFiles.forEach(file => {

        formData.append(
            "imageFiles",
            file
        );

    });


    return apiClient.post(
        `${API_URL}/add`,
        formData,
        {
            headers:{
                "Content-Type":
                    "multipart/form-data"
            }
        }
    );
};



/**
 *
 * GET /api/v1/technical-assessment/{technicalCode}
 */
export const getTechnicalAssessmentByCode = async (
    technicalCode
) => {

    const response = await apiClient.get(
        `${API_URL}/${technicalCode}`
    );

    return response.data;
};

export const deletePdf = async (id) => {
    const response = await apiClient.get(
        `${API_URL}/delete-pdf/${id}`
    );

    return response.data;
};



/**
 * Upload PDF sau khi tạo
 *
 * POST /api/v1/technical-assessment/edit
 *
 * multipart:
 * id
 * pdfFile
 */
export const uploadPdf = async (
    id,
    file
) => {

    const formData = new FormData();


    formData.append(
        "id",
        String(id)
    );


    if(file){
        formData.append(
            "pdfFile",
            file
        );
    }


    const response = await apiClient.post(
        `${API_URL}/edit`,
        formData,
        {
            headers:{
                "Content-Type":
                    "multipart/form-data"
            }
        }
    );


    return response.data;
};