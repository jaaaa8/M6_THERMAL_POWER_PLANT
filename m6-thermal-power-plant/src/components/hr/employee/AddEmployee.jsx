import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Button, Modal, Form as BsForm } from 'react-bootstrap';
import { toast } from 'react-toastify';

import { useNavigate } from "react-router-dom";
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
import { departmentService } from '../../../services/hr/departmentService';
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

  isActive: Yup.string()
    .required('Vui lòng chọn trạng thái làm việc'),

});

const INITIAL_VALUES = {
  fullName: '',
  gmail: '',
  imgPath: '',
  phone: '',
  departmentId: '',
  expertiseId: '',
  positionId: '',
  isActive: 'ACTIVE',
};

function ImageCropModal({ show, imageSrc, onClose, onCropComplete }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (show) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [imageSrc, show]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCrop = () => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const imgWidth = image.width;
      const imgHeight = image.height;
      const maxDim = Math.max(imgWidth, imgHeight);
      const renderWidth = (imgWidth / maxDim) * size;
      const renderHeight = (imgHeight / maxDim) * size;

      ctx.drawImage(
        image,
        -renderWidth / 2 + offset.x / zoom,
        -renderHeight / 2 + offset.y / zoom,
        renderWidth,
        renderHeight
      );

      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCropComplete(croppedDataUrl);
    };
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-bold text-primary">Căn chỉnh & Cắt ảnh</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column align-items-center px-4">
        <div 
          style={{
            width: '300px',
            height: '300px',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid var(--color-secondary-container)',
            borderRadius: '50%',
            cursor: 'move',
            backgroundColor: 'var(--color-surface-container)',
            boxShadow: 'var(--shadow-md)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <img
            src={imageSrc}
            alt="To Crop"
            draggable="false"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
              maxHeight: '100%',
              maxWidth: '100%',
              pointerEvents: 'none',
              transformOrigin: 'center center'
            }}
          />
        </div>
        <p className="text-muted mt-3 fs-8 text-center">
          Nhấp và kéo chuột (hoặc vuốt màn hình) trên ảnh để di chuyển vị trí.
        </p>

        <div className="w-100 mt-2">
          <BsForm.Group className="mb-3">
            <BsForm.Label className="fs-7 fw-semibold text-secondary d-flex justify-content-between">
              <span>Độ thu phóng (Zoom)</span>
              <span>{Math.round(zoom * 100)}%</span>
            </BsForm.Label>
            <BsForm.Range
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </BsForm.Group>

          <BsForm.Group className="mb-2">
            <BsForm.Label className="fs-7 fw-semibold text-secondary d-flex justify-content-between">
              <span>Góc xoay (Rotate)</span>
              <span>{rotation}°</span>
            </BsForm.Label>
            <BsForm.Range
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
            />
          </BsForm.Group>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={onClose} className="px-4">Hủy</Button>
        <Button variant="primary" onClick={handleCrop} className="px-4">Áp dụng</Button>
      </Modal.Footer>
    </Modal>
  );
}
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const AddDepartmentModal = ({ show, onClose, onSave }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!code.trim()) {
      errs.code = 'Vui lòng nhập mã phòng ban';
    } else if (code.trim().length < 2 || code.trim().length > 20) {
      errs.code = 'Mã phòng ban phải từ 2 đến 20 ký tự';
    } else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) {
      errs.code = 'Mã phòng ban chỉ gồm chữ cái, chữ số, gạch ngang hoặc gạch dưới';
    }

    if (!name.trim()) {
      errs.name = 'Vui lòng nhập tên phòng ban';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = 'Tên phòng ban phải từ 2 đến 100 ký tự';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClose = () => {
    setCode('');
    setName('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await departmentService.create({
        maPhongBan: code.trim(),
        tenPhongBan: name.trim(),
        moTa: description.trim()
      });
      const newDept = res.data?.data || res.data;
      toast.success('Thêm phòng ban thành công');
      onSave(newDept);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi thêm phòng ban';
      if (typeof msg === 'string' && msg.includes('Mã phòng ban')) {
        setErrors(prev => ({ ...prev, code: msg }));
      } else if (typeof msg === 'string' && msg.includes('Tên phòng ban')) {
        setErrors(prev => ({ ...prev, name: msg }));
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Lỗi thêm phòng ban');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-bold text-primary">Thêm phòng ban mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Mã phòng ban <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={code} 
            onChange={e => {
              setCode(e.target.value);
              if (errors.code) setErrors(prev => ({ ...prev, code: null }));
            }} 
            isInvalid={!!errors.code}
            disabled={saving}
            placeholder="VD: OPERATIONS" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.code}
          </BsForm.Control.Feedback>
        </BsForm.Group>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Tên phòng ban <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={name} 
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }} 
            isInvalid={!!errors.name}
            disabled={saving}
            placeholder="VD: Phòng vận hành" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.name}
          </BsForm.Control.Feedback>
        </BsForm.Group>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Mô tả</BsForm.Label>
          <BsForm.Control 
            as="textarea" 
            rows={3} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            disabled={saving}
            placeholder="Nhập mô tả..." 
          />
        </BsForm.Group>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={handleClose} disabled={saving} className="px-4">Hủy</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="px-4">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

const AddExpertiseModal = ({ show, onClose, onSave }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!code.trim()) {
      errs.code = 'Vui lòng nhập mã chuyên môn';
    } else if (code.trim().length < 2 || code.trim().length > 20) {
      errs.code = 'Mã chuyên môn phải từ 2 đến 20 ký tự';
    } else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) {
      errs.code = 'Mã chuyên môn chỉ gồm chữ cái, chữ số, gạch ngang hoặc gạch dưới';
    }

    if (!name.trim()) {
      errs.name = 'Vui lòng nhập tên chuyên môn';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = 'Tên chuyên môn phải từ 2 đến 100 ký tự';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClose = () => {
    setCode('');
    setName('');
    setErrors({});
    onClose();
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await employeeService.createExpertise({
        expertiseCode: code.trim(),
        name: name.trim()
      });
      const newExp = res.data?.data || res.data;
      toast.success('Thêm chuyên môn thành công');
      onSave(newExp);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi thêm chuyên môn';
      if (typeof msg === 'string' && msg.includes('Mã chuyên môn')) {
        setErrors(prev => ({ ...prev, code: msg }));
      } else if (typeof msg === 'string' && msg.includes('Tên chuyên môn')) {
        setErrors(prev => ({ ...prev, name: msg }));
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Lỗi thêm chuyên môn');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-bold text-primary">Thêm chuyên môn mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Mã chuyên môn <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={code} 
            onChange={e => {
              setCode(e.target.value);
              if (errors.code) setErrors(prev => ({ ...prev, code: null }));
            }} 
            isInvalid={!!errors.code}
            disabled={saving}
            placeholder="VD: BOILER_OP" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.code}
          </BsForm.Control.Feedback>
        </BsForm.Group>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Tên chuyên môn <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={name} 
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }} 
            isInvalid={!!errors.name}
            disabled={saving}
            placeholder="VD: Vận hành lò hơi" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.name}
          </BsForm.Control.Feedback>
        </BsForm.Group>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={handleClose} disabled={saving} className="px-4">Hủy</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="px-4">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
      </Modal.Footer>
    </Modal>
  );
};

const AddPositionModal = ({ show, onClose, onSave }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!code.trim()) {
      errs.code = 'Vui lòng nhập mã chức vụ';
    } else if (code.trim().length < 2 || code.trim().length > 20) {
      errs.code = 'Mã chức vụ phải từ 2 đến 20 ký tự';
    } else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) {
      errs.code = 'Mã chức vụ chỉ gồm chữ cái, chữ số, gạch ngang hoặc gạch dưới';
    }

    if (!name.trim()) {
      errs.name = 'Vui lòng nhập tên chức vụ';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = 'Tên chức vụ phải từ 2 đến 100 ký tự';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClose = () => {
    setCode('');
    setName('');
    setErrors({});
    onClose();
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await employeeService.createPosition({
        positionCode: code.trim(),
        name: name.trim()
      });
      const newPos = res.data?.data || res.data;
      toast.success('Thêm chức vụ thành công');
      onSave(newPos);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Lỗi thêm chức vụ';
      if (typeof msg === 'string' && msg.includes('Mã chức vụ')) {
        setErrors(prev => ({ ...prev, code: msg }));
      } else if (typeof msg === 'string' && msg.includes('Tên chức vụ')) {
        setErrors(prev => ({ ...prev, name: msg }));
      } else {
        toast.error(typeof msg === 'string' ? msg : 'Lỗi thêm chức vụ');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5 fw-bold text-primary">Thêm chức vụ mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Mã chức vụ <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={code} 
            onChange={e => {
              setCode(e.target.value);
              if (errors.code) setErrors(prev => ({ ...prev, code: null }));
            }} 
            isInvalid={!!errors.code}
            disabled={saving}
            placeholder="VD: WORKER" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.code}
          </BsForm.Control.Feedback>
        </BsForm.Group>
        <BsForm.Group className="mb-3">
          <BsForm.Label className="fs-7 fw-semibold text-secondary">Tên chức vụ <span className="text-danger">*</span></BsForm.Label>
          <BsForm.Control 
            value={name} 
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: null }));
            }} 
            isInvalid={!!errors.name}
            disabled={saving}
            placeholder="VD: Công nhân" 
          />
          <BsForm.Control.Feedback type="invalid">
            {errors.name}
          </BsForm.Control.Feedback>
        </BsForm.Group>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="outline-secondary" onClick={handleClose} disabled={saving} className="px-4">Hủy</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="px-4">{saving ? 'Đang lưu...' : 'Lưu'}</Button>
      </Modal.Footer>
    </Modal>
  );
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
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [posModalOpen, setPosModalOpen] = useState(false);
  const navigate = useNavigate();

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
      const formData = new FormData();
      
      const employeeData = {
        fullName: values.fullName,
        gmail: values.gmail,
        imgPath: values.imgPath && !values.imgPath.startsWith('data:image/') ? values.imgPath : '',
        phone: values.phone,
        departmentId: parseInt(values.departmentId),
        expertiseId: parseInt(values.expertiseId),
        positionId: parseInt(values.positionId),
        isActive: values.isActive
      };

      formData.append(
        "employee",
        new Blob([JSON.stringify(employeeData)], { type: "application/json" })
      );

      if (values.imgPath && values.imgPath.startsWith('data:image/')) {
        const file = dataURLtoFile(values.imgPath, 'avatar.jpg');
        formData.append("image", file);
      }

      if (isEdit && initialData?.id) {
        await employeeService.update(initialData.id, formData);
        toast.success('Cập nhật nhân sự thành công!');
      } else {
        await employeeService.create(formData);
        toast.success('Thêm mới nhân sự thành công!');
      }

      setTimeout(() => {
        navigate("/hr/employees");
      }, 1500);

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
        isActive: initialData.isActive || 'ACTIVE',
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
                        setSelectedImage(reader.result);
                        setCropModalOpen(true);
                      };
                      reader.readAsDataURL(file);
                      event.target.value = '';
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CREATE_NEW') {
                        setDeptModalOpen(true);
                      } else {
                        setFieldValue('departmentId', val);
                      }
                    }}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn phòng ban —'}
                    </option>
                    <option value="CREATE_NEW" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      + Thêm phòng ban mới
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CREATE_NEW') {
                        setExpModalOpen(true);
                      } else {
                        setFieldValue('expertiseId', val);
                      }
                    }}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn chuyên môn —'}
                    </option>
                    <option value="CREATE_NEW" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      + Thêm chuyên môn mới
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CREATE_NEW') {
                        setPosModalOpen(true);
                      } else {
                        setFieldValue('positionId', val);
                      }
                    }}
                  >
                    <option value="">
                      {loadingOptions ? 'Đang tải...' : '— Chọn chức vụ —'}
                    </option>
                    <option value="CREATE_NEW" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      + Thêm chức vụ mới
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

                <Col md={6}>
                  <label htmlFor="isActive" className="form-label">
                    Trạng thái làm việc <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="isActive"
                    name="isActive"
                    className={`form-select ${
                      touched.isActive && errors.isActive ? 'is-invalid' : ''
                    }`}
                  >
                    <option value="ACTIVE">Đang làm việc</option>
                    <option value="ON_LEAVE">Nghỉ phép</option>
                    <option value="INACTIVE">Nghỉ việc</option>
                  </Field>
                  <ErrorMessage
                    name="isActive"
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

            <ImageCropModal 
              show={cropModalOpen}
              imageSrc={selectedImage}
              onClose={() => {
                setCropModalOpen(false);
                setSelectedImage(null);
              }}
              onCropComplete={(croppedDataUrl) => {
                setFieldValue('imgPath', croppedDataUrl);
                setCropModalOpen(false);
                setSelectedImage(null);
              }}
            />

            <AddDepartmentModal
              show={deptModalOpen}
              onClose={() => setDeptModalOpen(false)}
              onSave={(newDept) => {
                setDepartments(prev => [newDept, ...prev]);
                setFieldValue('departmentId', newDept.id.toString());
              }}
            />

            <AddExpertiseModal
              show={expModalOpen}
              onClose={() => setExpModalOpen(false)}
              onSave={(newExp) => {
                setExpertises(prev => [newExp, ...prev]);
                setFieldValue('expertiseId', newExp.id.toString());
              }}
            />

            <AddPositionModal
              show={posModalOpen}
              onClose={() => setPosModalOpen(false)}
              onSave={(newPos) => {
                setPositions(prev => [newPos, ...prev]);
                setFieldValue('positionId', newPos.id.toString());
              }}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
}
