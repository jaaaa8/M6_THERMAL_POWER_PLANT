import { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  BsPersonPlusFill,
  BsPersonBadge,
  BsBriefcase,
  BsCameraFill,
  BsSave,
  BsXCircle,
  BsArrowClockwise,
} from 'react-icons/bs';
import { nhanSuService } from '../../../services/nhanSuService';
import './style/AddEmployee.css';

/* ============================================================
   VALIDATION SCHEMA — Formik + Yup
   ============================================================ */
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

const validationSchema = Yup.object({
  hoVaTen: Yup.string()
    .required('Họ và tên không được để trống')
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(100, 'Họ tên không quá 100 ký tự'),

  email: Yup.string()
    .required('Email không được để trống')
    .email('Email không đúng định dạng')
    .max(150, 'Email không quá 150 ký tự'),

  soDienThoai: Yup.string()
    .required('Số điện thoại không được để trống')
    .matches(PHONE_REGEX, 'Số điện thoại không hợp lệ (VD: 0912345678)'),

  maPhongBan: Yup.string()
    .required('Vui lòng chọn phòng ban'),

  chucVu: Yup.string()
    .required('Chức vụ không được để trống')
    .max(100, 'Chức vụ không quá 100 ký tự'),

  chuyenMon: Yup.string()
    .required('Chuyên môn không được để trống')
    .max(200, 'Chuyên môn không quá 200 ký tự'),

  trangThai: Yup.string()
    .required('Vui lòng chọn trạng thái')
    .oneOf(['DANG_LAM_VIEC', 'NGHI_VIEC', 'NGHI_PHEP'], 'Trạng thái không hợp lệ'),
});

/* ============================================================
   CONSTANTS
   ============================================================ */
const TRANG_THAI_OPTIONS = [
  { value: 'DANG_LAM_VIEC', label: 'Đang làm việc', dotClass: 'active' },
  { value: 'NGHI_PHEP', label: 'Nghỉ phép', dotClass: 'on-leave' },
  { value: 'NGHI_VIEC', label: 'Nghỉ việc', dotClass: 'inactive' },
];

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const INITIAL_VALUES = {
  hoVaTen: '',
  email: '',
  soDienThoai: '',
  maPhongBan: '',
  chucVu: '',
  chuyenMon: '',
  trangThai: 'DANG_LAM_VIEC',
};

/* ============================================================
   COMPONENT: NhanSuForm
   ============================================================ */

/**
 * AddEmployee — Form thêm mới nhân sự với avatar upload.
 *
 * @param {Function} [props.onSuccess] - Callback sau khi thêm thành công
 * @param {Function} [props.onCancel] - Callback khi bấm Huỷ
 * @param {object} [props.initialData] - Dữ liệu ban đầu (dùng cho chế độ sửa)
 * @param {boolean} [props.isEdit] - Chế độ sửa
 */
export default function AddEmployee({
  onSuccess,
  onCancel,
  initialData = null,
  isEdit = false,
}) {
  const [phongBanList, setPhongBanList] = useState([]);
  const [loadingPhongBan, setLoadingPhongBan] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  /* --- Load danh sách phòng ban --- */
  useEffect(() => {
    nhanSuService
      .getPhongBanList()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setPhongBanList(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        toast.error('Không thể tải danh sách phòng ban');
      })
      .finally(() => setLoadingPhongBan(false));
  }, []);

  /* --- Cleanup avatar preview URL khi unmount --- */
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  /* --- Avatar handler --- */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    setAvatarError('');

    if (!file) return;

    // Validate type
    if (!AVATAR_ACCEPTED.includes(file.type)) {
      setAvatarError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP');
      return;
    }

    // Validate size
    if (file.size > AVATAR_MAX_SIZE) {
      setAvatarError('Ảnh không được quá 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  /* --- Submit handler --- */
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();

      // Append text fields
      Object.entries(values).forEach(([key, val]) => {
        formData.append(key, val);
      });

      // Append avatar nếu có
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (isEdit && initialData?.id) {
        await nhanSuService.update(initialData.id, formData);
        toast.success('Cập nhật nhân sự thành công!');
      } else {
        await nhanSuService.create(formData);
        toast.success('Thêm mới nhân sự thành công!');
      }

      // Reset form
      resetForm();
      setAvatarFile(null);
      setAvatarPreview(null);
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

  /* --- Merge initial values (edit mode) --- */
  const mergedInitialValues = initialData
    ? {
        hoVaTen: initialData.hoVaTen || '',
        email: initialData.email || '',
        soDienThoai: initialData.soDienThoai || '',
        maPhongBan: initialData.maPhongBan?.toString() || '',
        chucVu: initialData.chucVu || '',
        chuyenMon: initialData.chuyenMon || '',
        trangThai: initialData.trangThai || 'DANG_LAM_VIEC',
      }
    : INITIAL_VALUES;

  /* --- Set avatar preview nếu edit mode có avatar URL --- */
  useEffect(() => {
    if (initialData?.avatarUrl) {
      setAvatarPreview(initialData.avatarUrl);
    }
  }, [initialData]);

  return (
    <div className="nhansu-form-card animate-fade-in">
      {/* ===== HEADER ===== */}
      <div className="nhansu-form-header">
        <div className="nhansu-form-header-icon">
          <BsPersonPlusFill />
        </div>
        <div className="nhansu-form-header-text">
          <h2>{isEdit ? 'Cập nhật Nhân sự' : 'Thêm mới Nhân sự'}</h2>
          <p>
            {isEdit
              ? 'Chỉnh sửa thông tin nhân viên trong hệ thống'
              : 'Điền đầy đủ thông tin để đăng ký nhân viên mới'}
          </p>
        </div>
      </div>

      {/* ===== FORM BODY ===== */}
      <Formik
        initialValues={mergedInitialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, touched, errors, values, setFieldValue, resetForm }) => (
          <Form noValidate>
            <div className="nhansu-form-body">
              {/* --- Avatar Upload --- */}
              <div
                className="avatar-upload-zone"
                onClick={handleAvatarClick}
                title="Bấm để chọn ảnh đại diện"
              >
                <div
                  className={`avatar-upload-circle ${avatarPreview ? 'has-image' : ''}`}
                >
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="avatar-preview-img"
                      />
                      <div className="avatar-overlay">
                        <BsCameraFill className="avatar-overlay-icon" />
                        <span className="avatar-overlay-text">Đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <BsCameraFill className="avatar-upload-icon" />
                      <span className="avatar-upload-hint">
                        Tải ảnh lên
                        <br />
                        JPG, PNG · Max 2MB
                      </span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="avatar-upload-input"
                  onChange={handleAvatarChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {avatarError && <div className="avatar-error">{avatarError}</div>}

              {/* ===== SECTION: THÔNG TIN CƠ BẢN ===== */}
              <div className="form-section-title">
                <BsPersonBadge />
                Thông tin cơ bản
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="nhansu-hoVaTen" className="form-label">
                    Họ và tên <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="nhansu-hoVaTen"
                    name="hoVaTen"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className={`form-control ${
                      touched.hoVaTen && errors.hoVaTen ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="hoVaTen"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>

                <Col md={6}>
                  <label htmlFor="nhansu-email" className="form-label">
                    Email <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="nhansu-email"
                    name="email"
                    type="email"
                    placeholder="nguyenvana@email.com"
                    className={`form-control ${
                      touched.email && errors.email ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="nhansu-soDienThoai" className="form-label">
                    Số điện thoại <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="nhansu-soDienThoai"
                    name="soDienThoai"
                    type="tel"
                    placeholder="0912345678"
                    className={`form-control ${
                      touched.soDienThoai && errors.soDienThoai ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="soDienThoai"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>

                <Col md={6}>
                  <label htmlFor="nhansu-maPhongBan" className="form-label">
                    Phòng ban <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="nhansu-maPhongBan"
                    name="maPhongBan"
                    className={`form-select ${
                      touched.maPhongBan && errors.maPhongBan ? 'is-invalid' : ''
                    }`}
                    disabled={loadingPhongBan}
                  >
                    <option value="">
                      {loadingPhongBan ? 'Đang tải...' : '— Chọn phòng ban —'}
                    </option>
                    {phongBanList.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.tenPhongBan}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="maPhongBan"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              {/* ===== SECTION: CÔNG VIỆC ===== */}
              <div className="form-section-title mt-4">
                <BsBriefcase />
                Công việc & Chuyên môn
              </div>

              <Row className="mb-3">
                <Col md={6}>
                  <label htmlFor="nhansu-chucVu" className="form-label">
                    Chức vụ <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="nhansu-chucVu"
                    name="chucVu"
                    type="text"
                    placeholder="Trưởng ca, Tổ trưởng, Nhân viên..."
                    className={`form-control ${
                      touched.chucVu && errors.chucVu ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="chucVu"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>

                <Col md={6}>
                  <label htmlFor="nhansu-chuyenMon" className="form-label">
                    Chuyên môn <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="nhansu-chuyenMon"
                    name="chuyenMon"
                    type="text"
                    placeholder="Kỹ sư điện, Kỹ thuật cơ khí..."
                    className={`form-control ${
                      touched.chuyenMon && errors.chuyenMon ? 'is-invalid' : ''
                    }`}
                  />
                  <ErrorMessage
                    name="chuyenMon"
                    component="div"
                    className="invalid-feedback"
                  />
                </Col>
              </Row>

              {/* --- Trạng thái (Radio Pills) --- */}
              <div className="mb-3">
                <label className="form-label">
                  Trạng thái <span className="required-asterisk">*</span>
                </label>
                <div className="status-radio-group" role="radiogroup" aria-label="Trạng thái nhân sự">
                  {TRANG_THAI_OPTIONS.map((opt) => (
                    <div key={opt.value} className="status-radio-pill">
                      <input
                        type="radio"
                        id={`trangThai-${opt.value}`}
                        name="trangThai"
                        value={opt.value}
                        checked={values.trangThai === opt.value}
                        onChange={() => setFieldValue('trangThai', opt.value)}
                      />
                      <label htmlFor={`trangThai-${opt.value}`}>
                        <span className={`status-dot ${opt.dotClass}`} />
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                {touched.trangThai && errors.trangThai && (
                  <div className="invalid-feedback d-block">{errors.trangThai}</div>
                )}
              </div>
            </div>

            {/* ===== FOOTER / ACTIONS ===== */}
            <div className="nhansu-form-footer">
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
                onClick={() => {
                  resetForm();
                  setAvatarFile(null);
                  setAvatarPreview(initialData?.avatarUrl || null);
                  setAvatarError('');
                }}
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
