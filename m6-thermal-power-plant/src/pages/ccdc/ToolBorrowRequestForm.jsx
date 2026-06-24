import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsClipboardPlus, BsSave, BsXCircle } from 'react-icons/bs';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toolBorrowLogService, toolService } from '../../services/toolService';
import { SAMPLE_TOOLS } from './sampleData';
import './CcdcForm.css';

const validationSchema = Yup.object({
  accountId: Yup.number().typeError('Mã người mượn phải là số').required('Vui lòng nhập mã người mượn'),
  toolId: Yup.string().required('Vui lòng chọn CCDC'),
  quantity: Yup.number()
    .typeError('Số lượng phải là số')
    .integer('Số lượng phải là số nguyên')
    .min(1, 'Số lượng mượn phải lớn hơn 0')
    .required('Số lượng không được để trống'),
  dueDate: Yup.string().required('Vui lòng chọn hạn trả'),
  borrowPurpose: Yup.string().max(500, 'Mục đích mượn quá dài'),
});

/**
 * ToolBorrowRequestForm — Trang lập phiếu mượn CCDC cho nhân viên (thủ kho lập hộ).
 * Route: /ccdc/muon-tra/lap-phieu
 */
export default function ToolBorrowRequestForm() {
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    toolService.search({})
      .then((res) => {
        if (!active) return;
        if (typeof res.data !== 'object') {
          throw new Error('API trả về dữ liệu không hợp lệ (có thể chưa kết nối backend)');
        }
        const page = res.data?.data;
        setTools(page?.content ?? page ?? []);
      })
      .catch(() => {
        if (!active) return;
        setTools(SAMPLE_TOOLS);
        toast.info('Chưa kết nối được API — đang dùng dữ liệu mẫu');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const goBack = () => navigate('/ccdc/muon-tra');

  if (loading) {
    return <LoadingSpinner text="Đang tải dữ liệu..." fullPage />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Lập phiếu mượn CCDC"
        subtitle="Tạo phiếu mượn công cụ dụng cụ cho nhân viên"
        icon={<BsClipboardPlus />}
      />

      <Formik
        initialValues={{ accountId: '', toolId: '', quantity: 1, dueDate: '', borrowPurpose: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await toolBorrowLogService.createBorrowRequest(Number(values.accountId), {
              toolId: Number(values.toolId),
              quantity: Number(values.quantity),
              borrowPurpose: values.borrowPurpose,
              dueDate: values.dueDate,
            });
            toast.success('Tạo phiếu mượn thành công');
            goBack();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form noValidate>
            <div className="ccdc-form-card">
              <div className="ccdc-form-header">
                <div className="ccdc-form-header-icon"><BsClipboardPlus /></div>
                <div className="ccdc-form-header-text">
                  <h2>Thông tin phiếu mượn</h2>
                  <p>Phiếu sẽ ở trạng thái chờ duyệt sau khi tạo</p>
                </div>
              </div>

              <div className="ccdc-form-body">
                <div className="mb-3">
                  <label htmlFor="borrow-accountId" className="form-label">
                    Mã người mượn <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="borrow-accountId"
                    name="accountId"
                    type="number"
                    placeholder="VD: 12"
                    className={`form-control ${touched.accountId && errors.accountId ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="accountId" component="div" className="invalid-feedback" />
                </div>

                <div className="mb-3">
                  <label htmlFor="borrow-toolId" className="form-label">
                    CCDC <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    as="select"
                    id="borrow-toolId"
                    name="toolId"
                    className={`form-select ${touched.toolId && errors.toolId ? 'is-invalid' : ''}`}
                  >
                    <option value="">— Chọn CCDC —</option>
                    {tools.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.quantityAvailable <= 0}>
                        {t.toolCode} · {t.name} (khả dụng: {t.quantityAvailable})
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="toolId" component="div" className="invalid-feedback" />
                </div>

                <div className="mb-3">
                  <label htmlFor="borrow-quantity" className="form-label">
                    Số lượng mượn <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="borrow-quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    className={`form-control ${touched.quantity && errors.quantity ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
                </div>

                <div className="mb-3">
                  <label htmlFor="borrow-dueDate" className="form-label">
                    Hạn trả <span className="required-asterisk">*</span>
                  </label>
                  <Field
                    id="borrow-dueDate"
                    name="dueDate"
                    type="datetime-local"
                    className={`form-control ${touched.dueDate && errors.dueDate ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="dueDate" component="div" className="invalid-feedback" />
                </div>

                <div className="mb-1">
                  <label htmlFor="borrow-borrowPurpose" className="form-label">Mục đích mượn</label>
                  <Field as="textarea" id="borrow-borrowPurpose" name="borrowPurpose" rows={3} className="form-control" placeholder="VD: Sửa chữa bơm cấp nước thô" />
                </div>
              </div>

              <div className="ccdc-form-footer">
                <Button variant="outline-secondary" type="button" onClick={goBack} disabled={isSubmitting}>
                  <BsXCircle /> Huỷ bỏ
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  <BsSave /> {isSubmitting ? 'Đang lưu...' : 'Tạo phiếu mượn'}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
