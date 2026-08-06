import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Formik, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { BsArrowLeft, BsSave, BsShieldLock, BsArrowClockwise, BsFilter, BsCheckCircleFill, BsExclamationTriangleFill, BsExclamationCircleFill } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { accountService } from '../../../services/hr/accountService';
import { employeeService } from '../../../services/hr/employeeService';
import PageHeader from '../../common/PageHeader';
import './style/AddAccount.css';

const AccountSchema = Yup.object().shape({
  username: Yup.string()
    .required('Vui lòng nhập tên đăng nhập')
    .min(8, 'Tên đăng nhập phải chứa từ 8 đến 50 ký tự')
    .max(50, 'Tên đăng nhập phải chứa từ 8 đến 50 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[0-9])[a-z0-9!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+$/,
      'Tên đăng nhập phải chứa chữ thường, chữ số, có thể chứa ký tự đặc biệt và phải có ít nhất 1 chữ cái và 1 chữ số'
    ),
  roleIds: Yup.string()
    .required('Vui lòng chọn vai trò'),
  accountType: Yup.string(),
  employeeId: Yup.string().when('accountType', {
    is: 'INTERNAL',
    then: () => Yup.string().required('Vui lòng chọn nhân viên chưa có tài khoản')
  }),
  email: Yup.string().when('accountType', {
    is: 'EXTERNAL',
    then: () => Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email')
  })
});

export default function AddAccount({ onCancel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  const isEditMode = Boolean(idParam);
  
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [resetting, setResetting] = useState(false);

  // Bộ lọc tìm kiếm nhân viên chưa có tài khoản
  const [empSearchCode, setEmpSearchCode] = useState('');
  const [empSearchName, setEmpSearchName] = useState('');
  const [appliedEmpFilters, setAppliedEmpFilters] = useState({ code: '', name: '' });

  const handleApplyEmpFilter = () => {
    setAppliedEmpFilters({
      code: empSearchCode.trim(),
      name: empSearchName.trim()
    });
  };

  const handleClearEmpFilter = () => {
    setEmpSearchCode('');
    setEmpSearchName('');
    setAppliedEmpFilters({ code: '', name: '' });
  };

  const handleResetPassword = async () => {
    if (!idParam) return;
    if (!window.confirm("Bạn có chắc chắn muốn cấp lại mật khẩu cho tài khoản này không? Mật khẩu mới sẽ được gửi về email đăng ký.")) {
      return;
    }
    setResetting(true);
    try {
      await accountService.resetPassword(idParam);
      toast.success("Cấp lại mật khẩu thành công! Mật khẩu mới đã được gửi tới email của tài khoản.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cấp lại mật khẩu thất bại");
    } finally {
      setResetting(false);
    }
  };

  const [initialValues, setInitialValues] = useState({
    username: '',
    accountType: 'INTERNAL',
    employeeId: '',
    email: '',
    roleIds: ''
  });

  useEffect(() => {
    Promise.all([
        accountService.getRoles(),
        employeeService.getAll()
    ]).then(([rolesRes, empRes]) => {
        setRoles(rolesRes.data?.data || rolesRes.data || []);
        setEmployees(empRes.data?.data || empRes.data || []);
    });

    if (isEditMode) {
      if (location.state?.initialData) {
        const data = location.state.initialData;
        setInitialValues({
          username: data.username || '',
          accountType: data.employee ? 'INTERNAL' : 'EXTERNAL',
          employeeId: data.employee?.id || '',
          email: data.email || '',
          roleIds: data.roles?.[0]?.id || ''
        });
      } else {
        setLoading(true);
        accountService.getById(idParam)
          .then((res) => {
            const data = res.data?.data || res.data;
            if (data) {
              setInitialValues({
                username: data.username || '',
                accountType: data.employee ? 'INTERNAL' : 'EXTERNAL',
                employeeId: data.employee?.id || '',
                email: data.email || '',
                roleIds: data.roles?.[0]?.id || ''
              });
            }
          })
          .catch(() => toast.error('Không tải được thông tin tài khoản'))
          .finally(() => setLoading(false));
      }
    }
  }, [idParam, isEditMode, location.state]);

  // Lọc chỉ hiển thị nhân viên CHƯA CÓ tài khoản
  const availableEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees.filter(emp => {
      const hasAccount = Boolean(emp.account);
      const isCurrentSelected = isEditMode && initialValues.employeeId && String(emp.id) === String(initialValues.employeeId);
      if (hasAccount && !isCurrentSelected) return false;

      const codeMatch = !appliedEmpFilters.code || (emp.employeeCode || '').toLowerCase().includes(appliedEmpFilters.code.toLowerCase());
      const nameMatch = !appliedEmpFilters.name || (emp.fullName || '').toLowerCase().includes(appliedEmpFilters.name.toLowerCase());
      return codeMatch && nameMatch;
    });
  }, [employees, appliedEmpFilters, isEditMode, initialValues.employeeId]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const payload = {
        username: values.username,
        roleIds: [parseInt(values.roleIds)]
      };

      if (values.accountType === 'INTERNAL') {
          payload.employeeId = parseInt(values.employeeId);
      } else {
          payload.email = values.email;
      }

      if (isEditMode) {
        await accountService.update(idParam, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await accountService.create(payload);
        toast.success('Thêm tài khoản mới thành công');
      }
      
      if (onCancel) {
        onCancel();
      } else {
        navigate('/hr/accounts');
      }
    } catch (error) {
      let rawMsg = error.response?.data?.message || error.response?.data?.errors || error.response?.data || error.message || 'Có lỗi xảy ra, vui lòng thử lại';
      if (Array.isArray(rawMsg)) {
        rawMsg = rawMsg.join('; ');
      } else if (typeof rawMsg === 'object' && rawMsg !== null) {
        rawMsg = rawMsg.message || JSON.stringify(rawMsg);
      }

      let message = String(rawMsg);
      const cleanMessage = message.replace(/^([a-zA-Z_]+:\s*)+/, '');
      const lower = message.toLowerCase();

      if (lower.includes('tên đăng nhập') || lower.includes('username')) {
        setFieldError('username', cleanMessage);
      } else if (lower.includes('email') || lower.includes('gmail')) {
        setFieldError('email', cleanMessage);
      } else if (lower.includes('nhân viên') || lower.includes('employee')) {
        setFieldError('employeeId', cleanMessage);
      } else if (lower.includes('vai trò') || lower.includes('role')) {
        setFieldError('roleIds', cleanMessage);
      }

      toast.error(cleanMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/hr/accounts');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="add-account-container animate-fade-in">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button 
          variant="light" 
          className="btn-icon-only rounded-circle"
          onClick={handleCancelClick}
        >
          <BsArrowLeft />
        </Button>
        <PageHeader 
          title={isEditMode ? 'Cập nhật Tài khoản' : 'Thêm Tài khoản mới'} 
          subtitle={isEditMode ? 'Chỉnh sửa quyền và thông tin đăng nhập' : 'Tạo mới tài khoản cho nhân sự hoặc đối tác'}
          className="mb-0"
        />
      </div>

      <div className="surface-card p-4">
        <div className="form-section-title mb-4 pb-2 border-bottom">
          <BsShieldLock className="me-2 text-primary" />
          Thông tin bảo mật
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={AccountSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            isSubmitting,
            submitCount,
            isValid
          }) => (
            <FormikForm onSubmit={handleSubmit} className="account-form" noValidate>
              {!isValid && submitCount > 0 && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 fs-7 py-2.5 px-3 rounded-3 shadow-sm border-danger">
                  <BsExclamationTriangleFill className="fs-5 flex-shrink-0 text-danger" />
                  <div>
                    <strong>Vui lòng kiểm tra lại dữ liệu:</strong> Một số trường thông tin tài khoản chưa hợp lệ hoặc bị thiếu.
                  </div>
                </div>
              )}
              <Row className="mb-4">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="required">Loại tài khoản</Form.Label>
                        <div>
                            <Form.Check 
                                inline
                                type="radio"
                                label="Tài khoản nội bộ (Chọn nhân sự)"
                                name="accountType"
                                value="INTERNAL"
                                checked={values.accountType === 'INTERNAL'}
                                onChange={handleChange}
                                disabled={isEditMode}
                            />
                            <Form.Check 
                                inline
                                type="radio"
                                label="Tài khoản ngoài (Nhập Email)"
                                name="accountType"
                                value="EXTERNAL"
                                checked={values.accountType === 'EXTERNAL'}
                                onChange={handleChange}
                                disabled={isEditMode}
                            />
                        </div>
                    </Form.Group>
                </Col>
              </Row>

              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="username" className="required">
                      Tên đăng nhập
                    </Form.Label>
                    <Form.Control
                      id="username"
                      name="username"
                      type="text"
                      placeholder="VD: annguyen26"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={(touched.username || submitCount > 0) && !!errors.username}
                      disabled={isEditMode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                    {isEditMode && <Form.Text className="text-muted">Không thể thay đổi tên đăng nhập sau khi tạo.</Form.Text>}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label htmlFor="roleIds" className="required">
                      Vai trò
                    </Form.Label>
                    <Form.Select
                      id="roleIds"
                      name="roleIds"
                      value={values.roleIds}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={(touched.roleIds || submitCount > 0) && !!errors.roleIds}
                    >
                        <option value="">— Chọn vai trò —</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.roleIds}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                {values.accountType === 'INTERNAL' && (
                  <Col md={12}>
                    <div className="border rounded p-3 bg-light">
                      <Form.Label className="required fw-bold mb-2">
                        Nhân viên <span className="text-muted fw-normal fs-7">(chỉ hiển thị nhân viên chưa có tài khoản)</span>
                      </Form.Label>

                      {/* Tìm kiếm nhân viên */}
                      <Row className="g-2 mb-3 align-items-end">
                        <Col md={4} sm={6}>
                          <Form.Group>
                            <Form.Label className="fs-7 text-secondary mb-1">Mã nhân viên</Form.Label>
                            <Form.Control
                              type="text"
                              size="sm"
                              placeholder="Nhập mã nhân viên..."
                              value={empSearchCode}
                              onChange={(e) => setEmpSearchCode(e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} sm={6}>
                          <Form.Group>
                            <Form.Label className="fs-7 text-secondary mb-1">Tên nhân viên</Form.Label>
                            <Form.Control
                              type="text"
                              size="sm"
                              placeholder="Nhập tên nhân viên..."
                              value={empSearchName}
                              onChange={(e) => setEmpSearchName(e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} sm={12} className="d-flex gap-2 align-items-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            className="d-inline-flex align-items-center gap-1 px-3"
                            onClick={handleApplyEmpFilter}
                          >
                            <BsFilter /> Lọc
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            type="button"
                            className="d-inline-flex align-items-center gap-1 px-3"
                            onClick={handleClearEmpFilter}
                          >
                            <BsArrowClockwise /> Bỏ lọc
                          </Button>
                        </Col>
                      </Row>

                      {/* Hiển thị nhân viên đang chọn */}
                      {values.employeeId && (
                        <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between fs-7">
                          <div>
                            <BsCheckCircleFill className="me-2 text-success" />
                            <strong>Đã chọn nhân viên:</strong>{' '}
                            {employees.find(e => String(e.id) === String(values.employeeId))?.fullName} (
                            {employees.find(e => String(e.id) === String(values.employeeId))?.employeeCode})
                          </div>
                          {!isEditMode && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-decoration-none text-danger ms-2"
                              onClick={() => setFieldValue('employeeId', '')}
                            >
                              Bỏ chọn
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Bảng chọn nhân viên 3 cột */}
                      <div className="table-responsive bg-white rounded border" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="table table-hover align-middle mb-0 text-center fs-7">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th style={{ width: '30%' }}>MÃ NHÂN VIÊN</th>
                              <th style={{ width: '45%' }}>TÊN NHÂN VIÊN</th>
                              <th style={{ width: '25%' }}>CHỌN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableEmployees.length > 0 ? (
                              availableEmployees.map((emp) => {
                                const isSelected = String(values.employeeId) === String(emp.id);
                                return (
                                  <tr key={emp.id} className={isSelected ? 'table-primary fw-medium' : ''}>
                                    <td>{emp.employeeCode}</td>
                                    <td className="text-start">{emp.fullName}</td>
                                    <td>
                                      <Button
                                        variant={isSelected ? 'success' : 'outline-primary'}
                                        size="sm"
                                        type="button"
                                        disabled={isEditMode}
                                        className="px-3 d-inline-flex align-items-center gap-1"
                                        onClick={() => setFieldValue('employeeId', String(emp.id))}
                                      >
                                        {isSelected ? (
                                          <>
                                            <BsCheckCircleFill /> Đã chọn
                                          </>
                                        ) : (
                                          'Chọn'
                                        )}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="3" className="text-muted py-3">
                                  Không tìm thấy nhân viên chưa có tài khoản nào.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {(touched.employeeId || submitCount > 0) && errors.employeeId && (
                        <div className="text-danger fw-semibold fs-7 mt-2 d-flex align-items-center gap-1">
                          <BsExclamationCircleFill /> {errors.employeeId}
                        </div>
                      )}
                    </div>
                  </Col>
                )}

                {values.accountType === 'EXTERNAL' && (
                    <Col md={6}>
                    <Form.Group>
                        <Form.Label htmlFor="email" className="required">
                        Email
                        </Form.Label>
                        <Form.Control
                        id="email"
                        name="email"
                        type="email"
                        placeholder="VD: email@example.com"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={(touched.email || submitCount > 0) && !!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                        {errors.email}
                        </Form.Control.Feedback>
                    </Form.Group>
                    </Col>
                )}
              </Row>

              <hr className="my-5 opacity-25" />

              <div className="d-flex justify-content-end gap-3 mt-4">
                {isEditMode && (
                  <Button
                    variant="outline-warning"
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSubmitting || resetting}
                    className="me-auto d-inline-flex align-items-center gap-2"
                  >
                    {resetting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        Đang cấp lại...
                      </>
                    ) : (
                      <>
                        <BsArrowClockwise />
                        Cấp lại mật khẩu
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="light" 
                  onClick={handleCancelClick}
                  disabled={isSubmitting || resetting}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isSubmitting}
                  className="d-inline-flex align-items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <BsSave />
                      Lưu thông tin
                    </>
                  )}
                </Button>
              </div>
            </FormikForm>
          )}
        </Formik>
      </div>
    </div>
  );
}
