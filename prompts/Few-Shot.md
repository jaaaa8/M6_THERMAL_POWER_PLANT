# Tiêu chuẩn Code An toàn (Few-Shot Examples)

Dưới đây là các ví dụ (Few-Shot) BẮT BUỘC phải tuân theo khi phát triển dự án SCMS (React + Vite Frontend / Spring Boot REST API Backend) để đảm bảo hiệu suất, khả năng mở rộng và bảo mật.

---

## FRONTEND (React + Vite)

### 1. Tách biệt Logic: Component chỉ hiển thị, API call nằm trong Service

❌ **BAD PRACTICE (Component gọi API trực tiếp, khó test, phình to):**
```jsx
function HeThongList() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Gọi trực tiếp axios trong component — khó tái sử dụng
    axios.get('http://localhost:8080/api/he-thong')
      .then(res => setData(res.data))
      .catch(err => console.log(err)); // Log lỗi thô
  }, []);
  
  return <ul>{data.map(ht => <li key={ht.id}>{ht.ten}</li>)}</ul>;
}
```

✅ **GOOD PRACTICE (Tách API service, xử lý loading/error):**
```jsx
// === services/heThongService.js ===
import axios from 'axios';

const API_URL = '/api/he-thong';

export const heThongService = {
  getAll: () => axios.get(API_URL),
  getById: (id) => axios.get(`${API_URL}/${id}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  remove: (id) => axios.delete(`${API_URL}/${id}`),
};

// === components/HeThongList.jsx ===
import { useState, useEffect } from 'react';
import { heThongService } from '../services/heThongService';
import { toast } from 'react-toastify';

function HeThongList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    heThongService.getAll()
      .then(res => setData(res.data))
      .catch(err => {
        setError('Không thể tải danh sách hệ thống');
        toast.error('Lỗi kết nối server');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (data.length === 0) return <p>Chưa có hệ thống nào.</p>;

  return (
    <ul>
      {data.map(ht => <li key={ht.id}>{ht.tenHeThong}</li>)}
    </ul>
  );
}
```

### 2. Validation Form bằng Formik + Yup

❌ **BAD PRACTICE (Không validate, gửi raw data):**
```jsx
function CreateThietBi() {
  const [ten, setTen] = useState('');
  
  const handleSubmit = () => {
    // Không kiểm tra gì cả, gửi thẳng
    axios.post('/api/thiet-bi', { ten });
  };
  
  return <input value={ten} onChange={e => setTen(e.target.value)} />;
}
```

✅ **GOOD PRACTICE (Dùng Formik + Yup Schema Validation):**
```jsx
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { thietBiService } from '../services/thietBiService';
import { toast } from 'react-toastify';

const validationSchema = Yup.object({
  tenThietBi: Yup.string()
    .required('Tên thiết bị không được để trống')
    .max(200, 'Tên không quá 200 ký tự'),
  maKKS: Yup.string()
    .required('Mã KKS bắt buộc nhập')
    .matches(/^[A-Z0-9]+$/, 'Mã KKS chỉ gồm chữ in hoa và số'),
  maHeThong: Yup.number()
    .required('Vui lòng chọn hệ thống'),
});

function CreateThietBi({ onSuccess }) {
  return (
    <Formik
      initialValues={{ tenThietBi: '', maKKS: '', maHeThong: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await thietBiService.create(values);
          toast.success('Thêm thiết bị thành công!');
          resetForm();
          onSuccess?.();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form>
          <div className="mb-3">
            <label>Tên thiết bị</label>
            <Field name="tenThietBi" className="form-control" />
            <ErrorMessage name="tenThietBi" component="div" className="text-danger" />
          </div>
          <div className="mb-3">
            <label>Mã KKS</label>
            <Field name="maKKS" className="form-control" />
            <ErrorMessage name="maKKS" component="div" className="text-danger" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Đang lưu...' : 'Thêm mới'}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

### 3. Protected Route theo Role

```jsx
// === components/ProtectedRoute.jsx ===
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles, userRole }) {
  if (!userRole) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// === Sử dụng trong App.jsx ===
<Route 
  path="/admin/nhan-su" 
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'NHAN_SU']} userRole={currentUser?.role}>
      <NhanSuPage />
    </ProtectedRoute>
  } 
/>
```

---

## BACKEND (Spring Boot REST API)

### 4. Tách biệt Logic giữa Controller REST và Service

❌ **BAD PRACTICE (Controller làm quá nhiều việc):**
```java
@PostMapping("/api/phieu-yeu-cau")
public ResponseEntity<?> createRequest(@RequestBody PhieuYeuCau phieu) {
    ThietBi tb = thietBiRepository.findById(phieu.getThietBiId()).orElse(null);
    if (tb == null) return ResponseEntity.badRequest().body("Không tìm thấy thiết bị");
    phieu.setNgayTao(LocalDateTime.now());
    phieuRepository.save(phieu);
    return ResponseEntity.ok(phieu);
}
```

✅ **GOOD PRACTICE (Logic nằm ở Service, Controller chỉ điều hướng):**
```java
// === Controller ===
@RestController
@RequestMapping("/api/phieu-yeu-cau")
@RequiredArgsConstructor
public class PhieuYeuCauController {
    private final PhieuYeuCauService phieuYeuCauService;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PhieuYeuCauDTO dto) {
        return ResponseEntity.ok(phieuYeuCauService.create(dto));
    }
}

// === Service ===
@Service
@RequiredArgsConstructor
public class PhieuYeuCauService {
    private final PhieuYeuCauRepository phieuYeuCauRepository;
    private final ThietBiRepository thietBiRepository;

    @Transactional
    public PhieuYeuCauResponseDTO create(PhieuYeuCauDTO dto) {
        ThietBi thietBi = thietBiRepository.findById(dto.getThietBiId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thiết bị"));
        
        PhieuYeuCau phieu = new PhieuYeuCau();
        phieu.setThietBi(thietBi);
        phieu.setMoTaSuCo(dto.getMoTaSuCo());
        phieu.setMucDoUuTien(dto.getMucDoUuTien());
        phieu.setTrangThai(TrangThai.CHO_XU_LY);
        phieu.setNgayTao(LocalDateTime.now());
        
        PhieuYeuCau saved = phieuYeuCauRepository.save(phieu);
        return PhieuYeuCauResponseDTO.from(saved);
    }
}
```

### 5. Validation DTO Backend

```java
@Data
public class PhieuYeuCauDTO {
    @NotNull(message = "Thiết bị không được để trống")
    private Long thietBiId;

    @NotBlank(message = "Mô tả sự cố bắt buộc nhập")
    @Size(max = 1000, message = "Mô tả không quá 1000 ký tự")
    private String moTaSuCo;

    @NotNull(message = "Mức độ ưu tiên bắt buộc chọn")
    private MucDoUuTien mucDoUuTien;
}
```

---

Tuân thủ các ví dụ trên sẽ giúp hệ thống SCMS dễ bảo trì, dễ test và đảm bảo tính nhất quán giữa Frontend (React) và Backend (Spring Boot REST API).
