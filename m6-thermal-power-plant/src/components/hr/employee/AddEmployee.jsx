import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  BsPersonPlusFill,
  BsPersonBadge,
  BsBriefcase,
  BsSave,
  BsXCircle,
  BsArrowClockwise,
  BsCamera,
} from 'react-icons/bs';
import { employeeService } from '../../../services/hr/employeeService';
import './style/AddEmployee.css';

/* ============================================================
   VALIDATION SCHEMA — Formik + Yup
   ============================================================ */
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

const validationSchema = Yup.object({
  fullName: Yup.string()
    .required('Họ và tên không được để trống')
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên không quá 100 ký tự'),

  gmail: Yup.string()
    .required('Email không được để trống')
    .email('Email không đúng định dạng')
    .max(150, 'Email không quá 150 ký tự'),

  phone: Yup.string()
    .required('Số điện thoại không được để trống')
    .matches(PHONE_REGEX, 'Số điện thoại không hợp lệ (VD: 0912345678)'),

  departmentId: Yup.string()
    .required('Vui lòng chọn phòng ban'),

  expertiseId: Yup.string()
    .required('Vui lòng chọn chuyên môn'),

  positionId: Yup.string()
    .required('Vui lòng chọn chức vụ'),

});

const INITIAL_VALUES = {
  fullName: '',
  gmail: '',
  imgPath: '',
  phone: '',
  departmentId: '',
  expertiseId: '',
  positionId: '',
};

export default function AddEmployee({
  onSuccess,
  onCancel,
  initialData = null,
  isEdit = false,
}) {
  const [departments, setDepartments] = useState([]);
  const [expertises, setExpertises] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    Promise.all([
      employeeService.getDepartments(),
      employeeService.getExpertises(),
      employeeService.getPositions()
    ]).then(([depRes, expRes, posRes]) => {
      setDepartments(depRes.data?.data || depRes.data || []);
      setExpertises(expRes.data?.data || expRes.data || []);
      setPositions(posRes.data?.data || posRes.data || []);
    }).catch(() => {
      toast.error('Không thể tải dữ liệu phòng ban, chuyên môn, hoặc chức vụ');
    }).finally(() => {
      setLoadingOptions(false);
    });
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        fullName: values.fullName,
        gmail: values.gmail,
        imgPath: values.imgPath || '',
        phone: values.phone,
        departmentId: parseInt(values.departmentId),
        expertiseId: parseInt(values.expertiseId),
        positionId: parseInt(values.positionId)
      };

      if (isEdit && initialData?.id) {
        await employeeService.update(initialData.id, payload);
        toast.success('Cập nhật nhân sự thành công!');
      } else {
        await employeeService.create(payload);
        toast.success('Thêm mới nhân sự thành công!');
      }

      resetForm();
      onSuccess?.();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const mergedInitialValues = initialData
    ? {
        fullName: initialData.fullName || '',
        gmail: initialData.gmail || '',
        imgPath: initialData.imgPath || '',
        phone: initialData.phone || '',
        departmentId: initialData.department?.id || '',
        expertiseId: initialData.expertise?.id || '',
        positionId: initialData.position?.id || '',
      }
    : INITIAL_VALUES;

  return (
    <div className="employee-form-card nhansu-form-card animate-fade-in">
      <div className="employee-form-header nhansu-form-header">
        <div className="employee-form-header-icon nhansu-form-header-icon">
          <BsPersonPlusFill />
        </div>
        <div className="employee-form-header-text nhansu-form-header-text">
          <h2>{isEdit ? 'Cập nhật Nhân sự' : 'Thêm mới Nhân sự'}</h2>
          <p>
            {isEdit
              ? 'Chỉnh sửa thông tin nhân viên trong hệ thống'
              : 'Điền đầy đủ thông tin để đăng ký nhân viên mới'}
          </p>
        </div>
      </div>

      <Formik
        initialValues={mergedInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, touched, errors, resetForm, setFieldValue, values }) => (
          <Form noValidate>
            <div className="employee-form-body nhansu-form-body">
              <div className="form-section-title">
                <BsPersonBadge />
                Thông tin cơ bản
              </div>

              {/* Avatar Upload Zone */}
              <div className="avatar-upload-zone" onClick={() => document.getElementById('employee-avatar-upload').click()}>
                <div className={`avatar-upload-circle ${values.imgPath ? 'has-image' : ''}`}>
                  {values.imgPath ? (
                    <>
                      <img src={values.imgPath} alt="Avatar Preview" className="avatar-preview-img" />
                      <div className="avatar-overlay">
                        <BsCamera className="avatar-overlay-icon" />
                        <span className="avatar-overlay-text">Thay đổi</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <BsCamera className="avatar-upload-icon" />
                      <span className="avatar-upload-hint">Tải ảnh<br />đại diện</span>
                    </>
                  )}
                </div>
                <input
                  id="employee-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="avatar-upload-input"
                  onChange={(event) => {
                    const file = event.currentTarget.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Kích thước ảnh không vượt quá 2MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFieldValue('imgPath', reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {errors.imgPath && touched.imgPath && (
                  <div className="avatar-error">{errors.imgPath}</div>
                )}
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="fullName" className="form-label">
                    Họ và tên <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className={`form-control ${
                      touched.fullName && errors.fullName ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="fullName"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>

                <Col md={6}>
                  <label htmlFor="gmail" className="form-label">
                    Email <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="gmail"
                    name="gmail"
                    type="email"
                    placeholder="nguyenvana@gmail.com"
                    className={`form-control ${
                      touched.gmail && errors.gmail ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="gmail"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <label htmlFor="phone" className="form-label">
                    Số điện thoại <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0912345678"
                    className={`form-control ${
                      touched.phone && errors.phone ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="phone"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              <div className="form-section-title mt-4">
                <BsBriefcase />
                Công việc & Chuyên môn
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="departmentId" className="form-label">
                    Phòng ban <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="departmentId"
                    name="departmentId"
                    className={`form-select ${
                      touched.departmentId && errors.departmentId ? 'is-invalid' : ''
                    }`}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn phòng ban —'}
                    </option>
                    {departments.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="departmentId"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>

                <Col md={6}>
                  <label htmlFor="expertiseId" className="form-label">
                    Chuyên môn <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="expertiseId"
                    name="expertiseId"
                    className={`form-select ${
                      touched.expertiseId && errors.expertiseId ? 'is-invalid' : ''
                    }`}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn chuyên môn —'}
                    </option>
                    {expertises.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="expertiseId"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="positionId" className="form-label">
                    Chức vụ <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="positionId"
                    name="positionId"
                    className={`form-select ${
                      touched.positionId && errors.positionId ? 'is-invalid' : ''
                    }`}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn chức vụ —'}
                    </option>
                    {positions.map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="positionId"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

            </div>

            <div className="employee-form-footer nhansu-form-footer">
              {onCancel && (
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <BsXCircle />
                  Huỷ bỏ
                </Button>
              )}

              <Button
                variant="outline-secondary"
                type="button"
                disabled={isSubmitting}
                onClick={() => resetForm()}
              >
                <BsArrowClockwise />
                Đặt lại
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                <BsSave />
                {isSubmitting
                  ? 'Đang lưu...'
                  : isEdit
                  ? 'Cập nhật'
                  : 'Thêm mới'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
