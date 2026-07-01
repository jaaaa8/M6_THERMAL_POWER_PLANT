import { useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { BsTags, BsSave, BsXCircle } from 'react-icons/bs';
import { toolCategoryService } from '../../services/toolService';

const validationSchema = Yup.object({
  categoryCode: Yup.string().required('Mã chủng loại không được để trống').max(50, 'Tối đa 50 ký tự'),
  categoryName: Yup.string().required('Tên chủng loại không được để trống').max(255, 'Tối đa 255 ký tự'),
  description: Yup.string().max(1000, 'Mô tả quá dài'),
});

/**
 * ToolCategoryFormModal — Thêm mới / cập nhật chủng loại CCDC.
 *
 * @param {boolean} props.show
 * @param {Function} props.onClose
 * @param {Function} props.onSaved - (category) => void
 * @param {object|null} [props.category] - dữ liệu khi sửa (null = thêm mới)
 */
export default function ToolCategoryFormModal({ show, onClose, onSaved, category = null }) {
  const isEdit = !!category;

  const initialValues = useMemo(
    () => ({
      categoryCode: category?.categoryCode || '',
      categoryName: category?.categoryName || '',
      description: category?.description || '',
    }),
    [category]
  );

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const res = isEdit
        ? await toolCategoryService.update(category.id, values)
        : await toolCategoryService.create(values);
      toast.success(isEdit ? 'Cập nhật chủng loại thành công' : 'Tạo chủng loại thành công');
      onSaved?.(res.data?.data);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form noValidate>
            <Modal.Header closeButton>
              <Modal.Title style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)' }}>
                <BsTags className="me-2" style={{ color: 'var(--color-primary-500)' }} />
                {isEdit ? `Cập nhật chủng loại — ${category.categoryCode}` : 'Thêm mới chủng loại'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label htmlFor="cat-categoryCode" className="form-label">
                  Mã chủng loại <span className="required-asterisk">*</span>
                </label>
                <Field
                  id="cat-categoryCode"
                  name="categoryCode"
                  type="text"
                  placeholder="TC001"
                  className={`form-control font-mono ${touched.categoryCode && errors.categoryCode ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="categoryCode" component="div" className="invalid-feedback" />
              </div>
              <div className="mb-3">
                <label htmlFor="cat-categoryName" className="form-label">
                  Tên chủng loại <span className="required-asterisk">*</span>
                </label>
                <Field
                  id="cat-categoryName"
                  name="categoryName"
                  type="text"
                  placeholder="Tháo lắp"
                  className={`form-control ${touched.categoryName && errors.categoryName ? 'is-invalid' : ''}`}
                />
                <ErrorMessage name="categoryName" component="div" className="invalid-feedback" />
              </div>
              <div className="mb-1">
                <label htmlFor="cat-description" className="form-label">Mô tả</label>
                <Field as="textarea" id="cat-description" name="description" rows={3} className="form-control" placeholder="Mô tả nhóm công cụ (nếu có)" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
                <BsXCircle /> Huỷ bỏ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                <BsSave /> {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
