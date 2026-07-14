import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsTools, BsSave, BsXCircle, BsInfoCircle, BsImage, BsUpload, BsTrash, BsFileEarmarkExcel } from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ToolImportModal from '../../components/ccdc/ToolImportModal';
import { toolService, toolCategoryService } from '../../services/toolService';
import './CcdcForm.css';

const validationSchema = Yup.object({
    name: Yup.string().required('Tên CCDC không được để trống').max(255, 'Tối đa 255 ký tự'),
    toolCategoryId: Yup.string().required('Vui lòng chọn chủng loại'),
    unit: Yup.string().required('Đơn vị tính không được để trống').max(50, 'Tối đa 50 ký tự'),
    quantity: Yup.number()
        .typeError('Số lượng phải là số')
        .min(0, 'Số lượng không được âm')
        .required('Số lượng không được để trống'),
    note: Yup.string().max(1000, 'Ghi chú quá dài'),
});

/**
 * ToolForm — Trang Thêm mới / Cập nhật CCDC.
 * Route: /ccdc/danh-sach/them-moi (thêm mới) hoặc /ccdc/danh-sach/sua/:id (sửa)
 */
export default function ToolForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [tool, setTool] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nextCode, setNextCode] = useState('...');
    const [showImport, setShowImport] = useState(false);
    const [uploadingImg, setUploadingImg] = useState(false);
    const fileInputRef = useRef(null);

    // Upload ảnh lên Cloudinary rồi lưu URL trả về vào imgPath (thay cho base64 cũ)
    const handleImageUpload = async (file, setFieldValue) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.warning('Vui lòng chọn file ảnh'); return; }
        setUploadingImg(true);
        try {
            const res = await toolService.uploadImage(file);
            setFieldValue('imgPath', res.data?.url || '');
            toast.success('Đã tải ảnh lên');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Tải ảnh thất bại, vui lòng thử lại');
        } finally {
            setUploadingImg(false);
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            toolCategoryService.getAll(),
            isEdit ? toolService.getById(id) : Promise.resolve(null),
            !isEdit ? toolService.getNextCode() : Promise.resolve(null),
        ])
            .then(([categoriesRes, toolRes, nextCodeRes]) => {
                if (!active) return;
                setCategories(categoriesRes.data?.data ?? []);
                if (toolRes) setTool(toolRes.data?.data ?? null);
                if (nextCodeRes) setNextCode(nextCodeRes.data?.data || 'MCCDC-????');
            })
            .catch((err) => {
                if (!active) return;
                toast.error(err.response?.data?.message || 'Không thể tải dữ liệu CCDC');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [id, isEdit]);

    const initialValues = useMemo(
        () => ({
            toolCode: tool?.toolCode || '',
            name: tool?.name || '',
            toolCategoryId: tool?.toolCategoryId?.toString() || '',
            unit: tool?.unit || '',
            quantity: tool?.quantity ?? 0,
            note: tool?.note || '',
            imgPath: tool?.imgPath || '',
        }),
        [tool]
    );

    const goBack = () => navigate('/ccdc/danh-sach');

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const payload = { ...values, toolCategoryId: Number(values.toolCategoryId), quantity: Number(values.quantity) };
            if (isEdit) {
                await toolService.update(tool.id, payload);
                toast.success('Cập nhật CCDC thành công');
            } else {
                await toolService.create(payload);
                toast.success('Tạo CCDC thành công');
            }
            goBack();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Đang tải dữ liệu..." fullPage />;
    }

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={isEdit ? `Cập nhật CCDC — ${tool?.toolCode || ''}` : 'Thêm mới CCDC'}
                subtitle={isEdit ? 'Chỉnh sửa thông tin công cụ dụng cụ trong kho' : 'Khai báo CCDC mới và nhập kho lần đầu'}
                icon={<BsTools />}
            />

            <ToolImportModal
                show={showImport}
                onClose={() => setShowImport(false)}
                onImported={goBack}
            />

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={handleSubmit}
            >
                {({ touched, errors, isSubmitting, values, setFieldValue }) => (
                    <Form noValidate>
                        <div className="ccdc-form-card">
                            <div className="ccdc-form-header">
                                <div className="ccdc-form-header-icon"><BsTools /></div>
                                <div className="ccdc-form-header-text">
                                    <h2>{isEdit ? 'Cập nhật thông tin CCDC' : 'Thông tin CCDC mới'}</h2>
                                    <p>{isEdit ? 'Mã CCDC và số lượng chỉ thay đổi qua chức năng Nhập kho' : 'Điền đầy đủ thông tin để thêm vào danh mục kho'}</p>
                                </div>
                                {!isEdit && (
                                    <Button
                                        type="button"
                                        variant="outline-success"
                                        size="sm"
                                        className="ms-auto"
                                        onClick={() => setShowImport(true)}
                                    >
                                        <BsFileEarmarkExcel className="me-1" /> Nhập từ Excel
                                    </Button>
                                )}
                            </div>

                            <div className="ccdc-form-body">
                                <div className="ccdc-image-row">
                                    <div
                                        className="ccdc-image-preview"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ cursor: 'pointer' }}
                                        title="Nhấn để chọn ảnh"
                                    >
                                        {values.imgPath ? (
                                            <img src={values.imgPath} alt="Ảnh CCDC" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <BsImage className="ccdc-image-preview-placeholder" />
                                        )}
                                    </div>
                                    <div className="ccdc-image-input">
                                        <label className="form-label">Ảnh CCDC</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                handleImageUpload(e.target.files?.[0], setFieldValue);
                                                e.target.value = ''; // cho phép chọn lại cùng file
                                            }}
                                        />
                                        <div className="d-flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={uploadingImg}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <BsUpload className="me-1" /> {uploadingImg ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                                            </Button>
                                            {values.imgPath && !uploadingImg && (
                                                <Button
                                                    type="button"
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => setFieldValue('imgPath', '')}
                                                >
                                                    <BsTrash /> Xoá ảnh
                                                </Button>
                                            )}
                                        </div>
                                        <div className="form-text mt-1">
                                            {uploadingImg
                                                ? 'Đang tải ảnh lên Cloudinary...'
                                                : values.imgPath
                                                    ? 'Ảnh đã tải lên. Nhấn "Chọn ảnh" để đổi ảnh khác.'
                                                    : 'Nhấn để chọn ảnh từ máy tính (JPG, PNG, WEBP).'}
                                        </div>
                                    </div>
                                </div>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <label className="form-label">Mã CCDC</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={isEdit ? (tool?.toolCode || '') : nextCode}
                                            className="form-control font-mono bg-light text-muted"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <label htmlFor="tool-name" className="form-label">
                                            Tên CCDC <span className="required-asterisk">*</span>
                                        </label>
                                        <Field
                                            id="tool-name"
                                            name="name"
                                            type="text"
                                            placeholder="Bộ cờ lê 12 món"
                                            className={`form-control ${touched.name && errors.name ? 'is-invalid' : ''}`}
                                        />
                                        <ErrorMessage name="name" component="div" className="invalid-feedback" />
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={4}>
                                        <label htmlFor="tool-toolCategoryId" className="form-label">
                                            Chủng loại <span className="required-asterisk">*</span>
                                        </label>
                                        <Field
                                            as="select"
                                            id="tool-toolCategoryId"
                                            name="toolCategoryId"
                                            className={`form-select ${touched.toolCategoryId && errors.toolCategoryId ? 'is-invalid' : ''}`}
                                        >
                                            <option value="">— Chọn chủng loại —</option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.categoryName}</option>
                                            ))}
                                        </Field>
                                        <ErrorMessage name="toolCategoryId" component="div" className="invalid-feedback" />
                                    </Col>
                                    <Col md={4}>
                                        <label htmlFor="tool-unit" className="form-label">
                                            Đơn vị tính <span className="required-asterisk">*</span>
                                        </label>
                                        <Field
                                            id="tool-unit"
                                            name="unit"
                                            type="text"
                                            placeholder="Bộ, Cái, Chiếc..."
                                            className={`form-control ${touched.unit && errors.unit ? 'is-invalid' : ''}`}
                                        />
                                        <ErrorMessage name="unit" component="div" className="invalid-feedback" />
                                    </Col>
                                    <Col md={4}>
                                        <label htmlFor="tool-quantity" className="form-label">
                                            Số lượng {isEdit ? '' : 'nhập kho'} <span className="required-asterisk">*</span>
                                        </label>
                                        <Field
                                            id="tool-quantity"
                                            name="quantity"
                                            type="number"
                                            min={0}
                                            disabled={isEdit}
                                            className={`form-control ${touched.quantity && errors.quantity ? 'is-invalid' : ''}`}
                                        />
                                        <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
                                    </Col>
                                </Row>

                                {isEdit && (
                                    <div className="ccdc-form-info-banner">
                                        <BsInfoCircle className="me-2" />
                                        Dùng chức năng <strong>Nhập kho</strong> ở danh sách để thay đổi số lượng.
                                    </div>
                                )}

                                <div className="mb-1">
                                    <label htmlFor="tool-note" className="form-label">Ghi chú</label>
                                    <Field
                                        as="textarea"
                                        id="tool-note"
                                        name="note"
                                        rows={3}
                                        className="form-control"
                                        placeholder="Ghi chú thêm về CCDC (nếu có)"
                                    />
                                </div>
                            </div>

                            <div className="ccdc-form-footer">
                                <Button variant="outline-secondary" type="button" onClick={goBack} disabled={isSubmitting}>
                                    <BsXCircle /> Huỷ bỏ
                                </Button>
                                <Button variant="primary" type="submit" disabled={isSubmitting || uploadingImg}>
                                    <BsSave /> {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}