import { Modal, Button, Row, Col } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { BsBoxSeam, BsInfoCircle } from 'react-icons/bs';

const validationSchema = Yup.object().shape({
    receiptCode: Yup.string().nullable(),
    supplier: Yup.string()
        .max(255, 'Tên nhà cung cấp không vượt quá 255 ký tự')
        .nullable(),
    quantity: Yup.number()
        .required('Số lượng nhập không được để trống')
        .positive('Số lượng nhập phải lớn hơn 0')
        .typeError('Vui lòng nhập một số hợp lệ'),
    receivedAt: Yup.string()
        .required('Ngày giờ nhập kho không được để trống')
});

export default function ConsumableImportModal({ show, onHide, consumableItem, onSubmit }) {
    if (!consumableItem) return null;

    const initialValues = {
        receiptCode: '',
        supplier: consumableItem.manufacturer || '',
        quantity: '',
        receivedAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 16)
    };

    const handleSubmitForm = async (values, actions) => {
        const payload = {
            receiptCode: values.receiptCode,
            consumableId: consumableItem.id,
            quantity: Number(values.quantity),
            supplier: values.supplier,
            receivedAt: values.receivedAt ? `${values.receivedAt}:00` : null
        };
        await onSubmit(payload, actions);
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmitForm}
            >
                {({ touched, errors, isSubmitting }) => (
                    <Form noValidate>
                        <Modal.Header closeButton>
                            <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                                <BsBoxSeam className="me-2" style={{ color: 'var(--color-primary-500)' }} />
                                Nhập kho vật tư tiêu hao
                            </Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <div className="p-3 bg-light rounded mb-3" style={{ fontSize: 'var(--text-xs)' }}>
                                <Row className="mb-1">
                                    <Col xs={4} className="text-muted">Mã vật tư:</Col>
                                    <Col xs={8} className="font-mono fw-semibold">{consumableItem.consumableCode}</Col>
                                </Row>
                                <Row>
                                    <Col xs={4} className="text-muted">Tên vật tư:</Col>
                                    <Col xs={8} className="fw-semibold">{consumableItem.name}</Col>
                                </Row>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Mã hóa đơn / Phiếu nhập kho <span className="text-danger">*</span></label>
                                <Field
                                    name="receiptCode"
                                    type="text"
                                    className={`form-control font-mono ${touched.receiptCode && errors.receiptCode ? 'is-invalid' : ''}`}
                                    placeholder="Mã tự động sinh"
                                    disabled={true}
                                />
                                <ErrorMessage name="receiptCode" component="div" className="invalid-feedback" />
                            </div>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <label className="form-label">Số lượng nhập ({consumableItem.unitName}) <span className="text-danger">*</span></label>
                                    <Field
                                        name="quantity"
                                        type="number"
                                        step="any"
                                        className={`form-control ${touched.quantity && errors.quantity ? 'is-invalid' : ''}`}
                                        placeholder="Số lượng..."
                                    />
                                    <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
                                </Col>
                                <Col md={6}>
                                    <label className="form-label">Ngày nhập kho <span className="text-danger">*</span></label>
                                    <Field
                                        name="receivedAt"
                                        type="datetime-local"
                                        className={`form-control ${touched.receivedAt && errors.receivedAt ? 'is-invalid' : ''}`}
                                    />
                                    <ErrorMessage name="receivedAt" component="div" className="invalid-feedback" />
                                </Col>
                            </Row>

                            <div className="mb-3">
                                <label className="form-label">Nhà cung cấp / Đối tác</label>
                                <Field
                                    name="supplier"
                                    type="text"
                                    className={`form-control ${touched.supplier && errors.supplier ? 'is-invalid' : ''}`}
                                    placeholder="Nhà phân phối hoặc NSX..."
                                />
                                <ErrorMessage name="supplier" component="div" className="invalid-feedback" />
                            </div>
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="outline-secondary" size="sm" type="button" onClick={onHide} disabled={isSubmitting}>
                                Hủy bỏ
                            </Button>
                            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận nhập'}
                            </Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
