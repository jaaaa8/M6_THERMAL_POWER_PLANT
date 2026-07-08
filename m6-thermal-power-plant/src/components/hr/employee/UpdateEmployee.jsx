import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employeeService } from '../../../services/hr/employeeService';
import AddEmployee from './AddEmployee';

export default function UpdateEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      employeeService.getById(id)
        .then(res => {
          const employeeData = res.data?.data || res.data;
          if (employeeData) {
            setEmployee(employeeData);
          } else {
            toast.error("Không tìm thấy thông tin nhân viên");
            navigate('/hr/employees');
          }
        })
        .catch(err => {
          console.error(err);
          toast.error("Không thể tải thông tin nhân viên");
          navigate('/hr/employees');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <AddEmployee 
      isEdit={true} 
      initialData={employee} 
      onSuccess={() => navigate('/hr/employees')} 
      onCancel={() => navigate('/hr/employees')} 
    />
  );
}
