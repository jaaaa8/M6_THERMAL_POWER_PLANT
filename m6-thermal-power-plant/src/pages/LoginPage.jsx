import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import { BsBoxArrowInRight, BsEye, BsEyeSlash } from 'react-icons/bs';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Gọi API đăng nhập thực
    setTimeout(() => {
      toast.success('Đăng nhập thành công!');
      navigate('/');
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <h2>Đăng nhập</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Tên đăng nhập</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nhập tên đăng nhập"
            required
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Mật khẩu</Form.Label>
          <div style={{ position: 'relative' }}>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
              aria-label="Toggle password"
            >
              {showPassword ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>
        </Form.Group>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            'Đang đăng nhập...'
          ) : (
            <>
              <BsBoxArrowInRight className="me-2" />
              Đăng nhập
            </>
          )}
        </Button>
      </Form>
    </>
  );
}
