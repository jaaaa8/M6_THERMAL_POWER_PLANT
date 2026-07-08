import {useEffect, useMemo, useState} from 'react'; // Thêm useMemo ở đây
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { BsTags, BsInfoCircle, BsImage } from 'react-icons/bs';
import { toast } from 'react-toastify';
import * as unitService from '../../services/unitService.js'

const validationSchema = Yup.object().shape({
    code: Yup.string().nullable(),
    name: Yup.string()
        .required('Tên vật tư không được để trống')
        .max(255, 'Tên vật tư không vượt quá 255 ký tự'),
    price: Yup.number()
        .required('Đơn giá không được để trống')
        .min(0, 'Đơn giá không được âm')
        .max(99999999.99, 'Đơn giá vượt quá giới hạn cho phép'),
    manufacturer: Yup.string()
        .max(100, 'Tên nhà sản xuất không quá 100 ký tự')
        .nullable(),
    imgPath: Yup.string()
        .required('Ảnh minh họa là bắt buộc'),
    unitId: Yup.string()
        .required('Đơn vị tính là bắt buộc'),
    status: Yup.string()
        .required('Trạng thái là bắt buộc')
});

export default function SparePartFormModal({ show, onHide, editingItem, onSubmit }) {

    const [units, setUnits] = useState([]);

    useEffect(() => {
        if(show){
            const fetchUnits = async () => {
                try{
                    const response = await unitService.getAll();
                    setUnits(response.data?.content || []);
                }catch (err){
                    console.error('Lỗi khi tải đơn vị: ', err);
                }
            };
            fetchUnits();
        }
    }, [show])



    const getInitialValues = () => {
        if (editingItem) {
            return {
                code: editingItem.sparePartCode || '',
                name: editingItem.name || '',
                price: editingItem.price || 0,
                manufacturer: editingItem.manufacturer || '',
                imgPath: editingItem.imgPath || '',
                unitId: editingItem.unitId ? String(editingItem.unitId) : '',
                status: editingItem.status || 'ACTIVE'
            };
        }
        return {
            code: '',
            name: '',
            price: 0,
            manufacturer: '',
            imgPath: '',
            unitId: '',
            status: 'ACTIVE'
        };
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Formik
                initialValues={getInitialValues()}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={onSubmit}
            >
                {({ touched, errors, isSubmitting, values, setFieldValue }) => (
                    <Form noValidate>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                                <BsTags className="me-2" style={{ color: 'var(--color-primary-500)' }} />
                                {editingItem ? 'Cập nhật danh mục' : 'Thêm mới danh mục'} vật tư thay thế
                            </Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <div className="alert alert-info py-2 px-3 d-flex align-items-center mb-3" style={{ fontSize: 'var(--text-xs)' }}>
                                <BsInfoCircle className="me-2 flex-shrink-0" style={{ fontSize: '1rem' }} />
                                <div>
                                    Đơn vị tính liên kết trực tiếp với bảng <code>units</code> của DB. Do backend chưa thiết kế API đơn vị, vui lòng chọn một trong các đơn vị mẫu đã cài sẵn.
                                </div>
                            </div>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <label className="form-label">
                                        Mã vật tư
                                    </label>
                                    <Field
                                        name="code"
                                        type="text"
                                        className={`form-control font-mono ${touched.code && errors.code ? 'is-invalid' : ''}`}
                                        placeholder="Mã tự động sinh"
                                        disabled={true}
                                    />
                                    <ErrorMessage name="code" component="div" className="invalid-feedback" />
                                </Col>
                                <Col md={6}>
                                    <label className="form-label">
                                        Tên vật tư <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                        name="name"
                                        type="text"
                                        className={`form-control ${touched.name && errors.name ? 'is-invalid' : ''}`}
                                        placeholder="VD: Vòng bi SKF..."
                                    />
                                    <ErrorMessage name="name" component="div" className="invalid-feedback" />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <label className="form-label">
                                        Đơn giá (VND) <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                        name="price"
                                        type="number"
                                        className={`form-control ${touched.price && errors.price ? 'is-invalid' : ''}`}
                                    />
                                    <ErrorMessage name="price" component="div" className="invalid-feedback" />
                                </Col>
                                <Col md={6}>
                                    <label className="form-label">
                                        Đơn vị tính <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                        as="select"
                                        name="unitId"
                                        className={`form-select ${touched.unitId && errors.unitId ? 'is-invalid' : ''}`}
                                    >
                                        <option value="">— Chọn đơn vị tính mẫu —</option>
                                        {units.map(u => (
                                            <option key={u.id} value={String(u.id)}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="unitId" component="div" className="invalid-feedback" />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <label className="form-label">Nhà sản xuất</label>
                                    <Field
                                        name="manufacturer"
                                        type="text"
                                        className={`form-control ${touched.manufacturer && errors.manufacturer ? 'is-invalid' : ''}`}
                                        placeholder="VD: SKF, Schneider..."
                                    />
                                    <ErrorMessage name="manufacturer" component="div" className="invalid-feedback" />
                                </Col>
                                <Col md={6}>
                                    <label className="form-label">
                                        Trạng thái hoạt động <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                        as="select"
                                        name="status"
                                        className={`form-select ${touched.status && errors.status ? 'is-invalid' : ''}`}
                                    >
                                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                                        <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                                    </Field>
                                    <ErrorMessage name="status" component="div" className="invalid-feedback" />
                                </Col>
                            </Row>

                            <div className="mb-3">
                                <label className="form-label">
                                    Ảnh vật tư (Tối đa 3 ảnh) <span className="text-danger">*</span>
                                </label>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {(values.imgPath ? values.imgPath.split('|').filter(Boolean) : []).map((img, index) => (
                                        <div key={index} className="position-relative border rounded p-1" style={{ width: '100px', height: '100px', backgroundColor: '#f8f9fa' }}>
                                            <img
                                                src={img}
                                                alt={`Preview ${index + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute d-flex align-items-center justify-content-center"
                                                style={{ top: '-8px', right: '-8px', borderRadius: '50%', width: '20px', height: '20px', padding: 0, fontSize: '12px', lineHeight: 1 }}
                                                onClick={() => {
                                                    const currentImgs = values.imgPath ? values.imgPath.split('|').filter(Boolean) : [];
                                                    const updatedList = currentImgs.filter((_, i) => i !== index);
                                                    setFieldValue('imgPath', updatedList.join('|'));
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}

                                    {(values.imgPath ? values.imgPath.split('|').filter(Boolean) : []).length < 3 && (
                                        <div
                                            className="border rounded d-flex flex-column align-items-center justify-content-center bg-light cursor-pointer"
                                            style={{ width: '100px', height: '100px', borderStyle: 'dashed', borderColor: errors.imgPath && touched.imgPath ? 'var(--color-danger-500)' : '#dee2e6' }}
                                            onClick={() => document.getElementById('sparepart-image-upload').click()}
                                        >
                                            <BsImage style={{ fontSize: '1.2rem', color: '#6c757d' }} />
                                            <span style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px' }}>Thêm ảnh</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="sparepart-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={(event) => {
                                        const file = event.currentTarget.files[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) {
                                                toast.error("Kích thước ảnh không vượt quá 2MB");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const currentImgs = values.imgPath ? values.imgPath.split('|').filter(Boolean) : [];
                                                const updatedList = [...currentImgs, reader.result];
                                                setFieldValue('imgPath', updatedList.join('|'));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                        event.target.value = '';
                                    }}
                                />
                                {errors.imgPath && touched.imgPath && (
                                    <div className="text-danger small mt-1">{errors.imgPath}</div>
                                )}
                            </div>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="outline-secondary" size="sm" type="button" onClick={onHide} disabled={isSubmitting}>
                                Hủy bỏ
                            </Button>
                            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
                            </Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
