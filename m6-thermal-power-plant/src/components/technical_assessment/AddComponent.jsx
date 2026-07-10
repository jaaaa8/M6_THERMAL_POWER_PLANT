import { useState, useEffect } from "react";

import { getAllSystems } from "../../services/equipment/systemService.js";
import { getAll as getAllEquipments, getBySystem} from "../../services/equipment/equipmentService.js";
import { accountService } from "../../services/hr/accountService.js";
import { BsFileEarmarkPdf } from "react-icons/bs";
import {
    createTechnicalAssessment,
} from "../../services/technicalAssessmentService";
import { pdf } from "@react-pdf/renderer";
import TechnicalAssessmentPDF from "../../pdf/TechnicalAssessmentPDF";
import {
  Row,
  Col,
  Button,
  Form,
} from "react-bootstrap";

import { toast } from "react-toastify";

import {
  BsClipboard2Check,
  BsFileEarmarkText,
  BsTools,
  BsImages,
  BsXCircle,
  BsArrowClockwise,
} from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";



export default function TechnicalAssessmentForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        assessor: {
            username: "",
            email: "",
            name: ""
        },
        workOrderId: "1",
        assessorId: "2",

        systemId: "1",
        equipmentId: "1",

        result:
            "Động cơ bơm nước làm mát bị mòn vòng bi, phát sinh rung động lớn.",

        description:
            "Đề xuất thay thế vòng bi SKF 6205 và kiểm tra lại độ đồng tâm trục.",

        status: "PENDING",
    });

    const [imageFiles, setImageFiles] = useState([]);      // File[]
    const [imagePreviews, setImagePreviews] = useState([]); // base64
    const [systems, setSystems] = useState([]);
    const [equipments, setEquipments] = useState([]);
    const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [assessors, setAssessors] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                systemsRes,
                equipmentsRes,
                assessorsRes
            ] = await Promise.all([
                getAllSystems("", "", 0, 1000),
                getAllEquipments(),
                accountService.getAll()
            ]);

            console.log("ASSESSORS RESPONSE", assessorsRes.data);

            const systemData =
                systemsRes.data?.content ||
                systemsRes.data?.data ||
                systemsRes.data ||
                [];

            const equipmentData =
                equipmentsRes.data?.content ||
                equipmentsRes.data?.data ||
                equipmentsRes.data ||
                [];

            const assessorData =
                assessorsRes.data?.content ||
                assessorsRes.data?.data ||
                assessorsRes.data ||
                [];

            console.log("ASSESSORS", assessorData);

            setSystems(systemData);
            setEquipments(equipmentData);
            const activeAssessors =
                assessorData.filter(
                    item => item.status === "ACTIVE"
                );

            setAssessors(activeAssessors);

            if (assessorData.length > 0) {
                const firstAssessor = assessorData[0];

                setFormData(prev => ({
                    ...prev,
                    assessor: {
                        username: firstAssessor.username,
                        email:
                            firstAssessor.employee?.gmail ||
                            firstAssessor.email ||
                            "",
                        name:
                            firstAssessor.employee?.fullName ||
                            firstAssessor.username
                    }
                }));
            }


            if (systemData.length > 0) {
                const firstSystemId = systemData[0].id;

                const equipmentRes = await getBySystem(firstSystemId);

                const equipmentOfSystem =
                    equipmentRes.data?.content ||
                    equipmentRes.data?.data ||
                    equipmentRes.data ||
                    [];

                setFilteredEquipments(equipmentOfSystem);

                setFormData(prev => ({
                    ...prev,
                    systemId: firstSystemId.toString(),
                    equipmentId:
                        equipmentOfSystem.length > 0
                            ? equipmentOfSystem[0].id.toString()
                            : ""
                }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải dữ liệu");
        }
    };

    const handleSystemChange = async (e) => {
        try {
            const systemId = e.target.value;

            const res = await getBySystem(systemId);

            const equipmentOfSystem =
                res.data?.content ||
                res.data?.data ||
                res.data ||
                [];

            setFilteredEquipments(equipmentOfSystem);

            setFormData(prev => ({
                ...prev,
                systemId,
                equipmentId:
                    equipmentOfSystem.length > 0
                        ? equipmentOfSystem[0].id.toString()
                        : ""
            }));
        } catch (error) {
            console.error(error);
            toast.error("Không tải được danh sách thiết bị");
        }
    };

    const handleImageUpload = async (e) => {
        try {
            const files = Array.from(e.target.files);

            setImageFiles(files);

            const previews = await Promise.all(
                files.map((file) => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();

                        reader.onload = () => {
                            resolve(reader.result);
                        };

                        reader.readAsDataURL(file);
                    });
                })
            );

            setImagePreviews(previews);

            toast.success(
                `Đã tải lên ${files.length} ảnh`
            );

        } catch (error) {

            toast.error(
                "Không thể tải ảnh lên"
            );
        }
    };





  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };
    systems.find(
        s => s.id.toString() === formData.systemId
    );
    equipments.find(
        e => e.id.toString() === formData.equipmentId
    );

    const generatePdfFile = async (technicalCode) => {

        const blob = await pdf(
            <TechnicalAssessmentPDF
                data={{
                    ...formData,
                    technicalCode
                }}
                systems={systems}
                equipments={equipments}
                images={imageFiles}
            />
        ).toBlob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${technicalCode}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return blob;
    };

    const handleSaveAndExport = async () => {
        try {

            const payload = {
                assessor: formData.assessor,
                result: formData.result,
                description: formData.description,
                status: formData.status
            };

            const response =
                await createTechnicalAssessment(
                    payload,
                    imageFiles
                );

            console.log("RESPONSE =", response.data);

            const technicalCode =
                response.data.technicalCode;
            console.log(technicalCode);

            if (!technicalCode) {
                throw new Error("Backend không trả về technicalCode");
            }

            // ✅ update lại state để dùng cho PDF
            setFormData(prev => ({
                ...prev,
                technicalCode: technicalCode,
            }));

            // đảm bảo state update xong trước khi export
            await generatePdfFile(technicalCode);

            toast.success("Lưu phiếu và xuất PDF thành công");

            setTimeout(() => {
                navigate("/repair/technical-assessment");
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Có lỗi xảy ra khi lưu phiếu"
            );
        }
    };
    return (
        <div className="technical-form-card">

            {/* HEADER */}
            <div className="technical-form-header">
                <div className="technical-form-header-icon">
                    <BsClipboard2Check />
                </div>

                <div className="technical-form-header-text">
                    <h2>Phiếu Đánh Giá Kỹ Thuật</h2>
                    <p>
                        Lập biên bản đánh giá kỹ thuật thiết bị cần sửa chữa
                        hoặc thay thế vật tư.
                    </p>
                </div>
            </div>

            {/* BODY */}
            <div className="technical-form-body">

                {/* THÔNG TIN PHIẾU */}
                <div className="form-section-title">
                    <BsFileEarmarkText />
                    <span>Thông tin phiếu đánh giá</span>
                </div>

                {/* Dòng 1 */}
                <Row className="mb-4">

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Người đánh giá</Form.Label>

                            <Form.Select
                                value={formData.assessor.username}
                                onChange={(e) => {

                                    const selected = assessors.find(
                                        item => item.username === e.target.value
                                    );

                                    setFormData(prev => ({
                                        ...prev,
                                        assessor: {
                                            username: selected.username,
                                            email:
                                                selected.employee?.gmail ||
                                                selected.email ||
                                                "",
                                            name:
                                                selected.employee?.fullName ||
                                                selected.username
                                        }
                                    }));
                                }}
                            >
                                <option value="">
                                    Chọn người đánh giá
                                </option>

                                {assessors.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.username}
                                    >
                                        {item.employee?.fullName || item.username}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                </Row>

                {/* Dòng 2 */}
                <Row className="mb-4">

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Hệ thống</Form.Label>

                            <Form.Select
                                name="systemId"
                                value={formData.systemId}
                                onChange={handleSystemChange}
                            >
                                <option value="">
                                    Chọn hệ thống
                                </option>

                                {systems.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label>Thiết bị</Form.Label>

                            <Form.Select
                                name="equipmentId"
                                value={formData.equipmentId}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Chọn thiết bị
                                </option>

                                {filteredEquipments.map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.kksCode} - {item.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>



                </Row>

                {/* NỘI DUNG ĐÁNH GIÁ */}
                <div className="form-section-title">
                    <BsTools />
                    <span>Nội dung đánh giá</span>
                </div>

                <Row className="mb-4">
                    <Col md={12}>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Kết quả đánh giá
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="result"
                                value={formData.result}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>
                                Mô tả chi tiết
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                rows={5}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* PDF */}
                {/*<div className="form-section-title">*/}
                {/*    <BsFilePdf />*/}
                {/*    <span>Biên bản PDF</span>*/}
                {/*</div>*/}

                {/*<div className="pdf-upload-zone mb-4">*/}
                {/*    <BsFilePdf className="pdf-upload-icon" />*/}

                {/*    <div className="pdf-upload-title">*/}
                {/*        Tải lên biên bản đánh giá*/}
                {/*    </div>*/}

                {/*    <div className="pdf-upload-subtitle">*/}
                {/*        Chỉ hỗ trợ file PDF*/}
                {/*    </div>*/}

                {/*    <Form.Control*/}
                {/*        className="mt-3"*/}
                {/*        type="file"*/}
                {/*        accept=".pdf"*/}
                {/*    />*/}
                {/*</div>*/}

                {/* HÌNH ẢNH */}
                <div className="form-section-title">
                    <BsImages />
                    <span>Ảnh minh chứng</span>
                </div>

                <div className="image-upload-zone">
                    <BsImages className="image-upload-icon" />

                    <div className="image-upload-title">
                        Tải lên hình ảnh hiện trạng
                    </div>

                    <div className="image-upload-subtitle">
                        Có thể chọn nhiều ảnh JPG, PNG
                    </div>

                    <Form.Control
                        className="mt-3"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>

                {/* PREVIEW ẢNH */}
                <div className="image-preview-grid">
                    {imagePreviews.map((img, index) => (
                        <div
                            key={index}
                            className="image-preview-item"
                        >
                            <img
                                src={img}
                                alt={`preview-${index}`}
                            />
                        </div>
                    ))}
                </div>

                {/* TRẠNG THÁI */}
                {/*<div className="mt-4">*/}
                {/*    <div className="form-section-title">*/}
                {/*        Trạng thái xử lý*/}
                {/*    </div>*/}

                {/*    <div className="status-radio-group">*/}

                {/*        <div className="status-radio-pill">*/}
                {/*            <input*/}
                {/*                type="radio"*/}
                {/*                id="pending"*/}
                {/*                name="status"*/}
                {/*                value="PENDING"*/}
                {/*                checked={formData.status === "PENDING"}*/}
                {/*                onChange={handleChange}*/}
                {/*            />*/}
                {/*            <label htmlFor="pending">*/}
                {/*                <span className="status-dot pending"></span>*/}
                {/*                Chờ xử lý*/}
                {/*            </label>*/}
                {/*        </div>*/}

                {/*        <div className="status-radio-pill">*/}
                {/*            <input*/}
                {/*                type="radio"*/}
                {/*                id="progress"*/}
                {/*                name="status"*/}
                {/*                value="IN_PROGRESS"*/}
                {/*                checked={formData.status === "IN_PROGRESS"}*/}
                {/*                onChange={handleChange}*/}
                {/*            />*/}
                {/*            <label htmlFor="progress">*/}
                {/*                <span className="status-dot progress"></span>*/}
                {/*                Đang xử lý*/}
                {/*            </label>*/}
                {/*        </div>*/}

                {/*        <div className="status-radio-pill">*/}
                {/*            <input*/}
                {/*                type="radio"*/}
                {/*                id="completed"*/}
                {/*                name="status"*/}
                {/*                value="COMPLETED"*/}
                {/*                checked={formData.status === "COMPLETED"}*/}
                {/*                onChange={handleChange}*/}
                {/*            />*/}
                {/*            <label htmlFor="completed">*/}
                {/*                <span className="status-dot completed"></span>*/}
                {/*                Hoàn thành*/}
                {/*            </label>*/}
                {/*        </div>*/}

                {/*        <div className="status-radio-pill">*/}
                {/*            <input*/}
                {/*                type="radio"*/}
                {/*                id="rejected"*/}
                {/*                name="status"*/}
                {/*                value="REJECTED"*/}
                {/*                checked={formData.status === "REJECTED"}*/}
                {/*                onChange={handleChange}*/}
                {/*            />*/}
                {/*            <label htmlFor="rejected">*/}
                {/*                <span className="status-dot rejected"></span>*/}
                {/*                Từ chối*/}
                {/*            </label>*/}
                {/*        </div>*/}

                {/*    </div>*/}
                {/*</div>*/}

            </div>

            {/* FOOTER */}
            <div className="technical-form-footer">

                <Button variant="outline-secondary">
                    <BsArrowClockwise />
                    Đặt lại
                </Button>

                <Link to="/repair/technical-assessment">
                    <Button variant="outline-danger">
                        <BsXCircle />
                        Huỷ bỏ
                    </Button>
                </Link>

                <Button
                    variant="outline-primary"
                    onClick={handleSaveAndExport}
                >
                    <BsFileEarmarkPdf />
                    Xuất PDF & Lưu Phiếu
                </Button>

                {/*<Button variant="primary">*/}
                {/*    <BsSave />*/}
                {/*    Lưu phiếu*/}
                {/*</Button>*/}

            </div>

        </div>
  );
}
