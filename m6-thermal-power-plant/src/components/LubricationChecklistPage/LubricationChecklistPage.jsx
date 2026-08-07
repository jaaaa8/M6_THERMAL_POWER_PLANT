  import { useState, useEffect } from "react";
  import {
    Row,
    Col,
    Button,
    Table,
    Form,
    Pagination
  } from "react-bootstrap";
  import {
    BsGearFill,
    BsDropletFill,
    BsSearch,
    BsFileEarmarkCheck,
    BsFileEarmarkPlus,
  } from "react-icons/bs";
  import { toast } from "react-toastify";

  import "../LubricationPlan/LubricationPlanForm.css";
  import * as systemService from "../../services/equipment/systemService";
  import lubricationPlanService from "../../services/lubricationPlanService";
  import { pdf } from "@react-pdf/renderer";
  import LubricationChecklistPDF from "../../pdf/LubricationChecklistPDF";
  import CreateManualWorkOrderModal from "../work_order/CreateManualWorkOrderModal";

  export default function LubricationPlanForm() {

    const [selectedEquipments, setSelectedEquipments] =
      useState([]);

    const [showLubWorkOrder, setShowLubWorkOrder] =
      useState(false);

    const [lockedPlanIds, setLockedPlanIds] =
      useState(new Set());

    const [systems, setSystems] = useState([]);

    const [plans, setPlans] = useState([]);

    const [systemId, setSystemId] = useState("");

    const [status] = useState("");

    const [page, setPage] = useState(0);

    const [size] = useState(10);

    const [totalPages, setTotalPages] = useState(0);

    const [, setTotalElements] = useState(0);

    const loadSystems = async () => {
      try {

        const res = await systemService.getAllSystems(
            "",
            "ACTIVE",
            0,
            100
        );

        setSystems(
            res.data.content || []
        );

      } catch {

        toast.error("Không tải được hệ thống");

      }
    };

    const loadChecklist = async (
        currentPage = 0
    ) => {

      if (!systemId) {
        setPlans([]);
        return;
      }

      try {

        const res =
            await lubricationPlanService.checklist(
                Number(systemId),
                status,
                currentPage,
                size
            );

        setPlans(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.totalElements || 0);
        setPage(currentPage);

      } catch (e) {

        console.error(e);
        toast.error("Không tải được danh sách bảo dưỡng");

      }

    };


    useEffect(() => {

      loadSystems();

    }, []);

    const loadLockedPlanIds = async () => {

      try {

        const data =
            await lubricationPlanService.lockedPlanIds();

        setLockedPlanIds(
            new Set(Array.isArray(data) ? data : [])
        );

      } catch (e) {

        console.error(e);

      }

    };

    useEffect(() => {

      if (showLubWorkOrder) {

        loadLockedPlanIds();

      }

    }, [showLubWorkOrder]);

    useEffect(() => {

      loadLockedPlanIds();

    }, []);


    const handleSearch = () => {

      if (!systemId) {
        toast.warning("Vui lòng chọn hệ thống");
        return;
      }

      loadChecklist(0);

    };

    const handleSelectEquipment = (
        plan,
        checked
    ) => {

      if (checked) {

        const existed =
            selectedEquipments.some(
                item => item.id === plan.id
            );

        if (!existed) {

          setSelectedEquipments(prev => [
            ...prev,
            plan
          ]);

        }

      } else {

        setSelectedEquipments(prev =>
            prev.filter(
                item => item.id !== plan.id
            )
        );

      }

    };

    const handleExportChecklist = async () => {

      try {

        const blob = await pdf(
            <LubricationChecklistPDF
                equipments={selectedEquipments}
            />
        ).toBlob();

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `Checklist_Bao_Duong_${
                new Date()
                    .toISOString()
                    .split("T")[0]
            }.pdf`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        toast.success(
            "Xuất checklist thành công"
        );

      } catch (error) {

        console.error(error);

        toast.error(
            "Không thể xuất file PDF"
        );

      }
    };

    return (
      <div className="nhansu-form-card">
        {/* HEADER */}
        <div className="nhansu-form-header">
          <div className="nhansu-form-header-icon">
            <BsDropletFill />
          </div>

          <div className="nhansu-form-header-text">
            <h2>
              Lập Checklist Bảo Dưỡng Dầu Mỡ
            </h2>

            <p>
              Chọn nhiều thiết bị để lập checklist
              bảo dưỡng dầu mỡ.
            </p>
          </div>
        </div>

        <div className="nhansu-form-body">
          {/* TÌM KIẾM */}
          <div className="form-section-title">
            <BsSearch />
            Tìm kiếm thiết bị
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <label className="form-label">
                Hệ thống
              </label>

              <Form.Select
                  value={systemId}
                  onChange={(e) => {
                    setSystemId(e.target.value);
                  }}
              >
                <option value="">
                  -- Chọn hệ thống --
                </option>

                {systems.map(item => (
                    <option
                        key={item.id}
                        value={item.id}
                    >
                      {item.systemCode} - {item.name}
                    </option>
                ))}
              </Form.Select>
            </Col>

            <Col
              md={2}
              className="d-flex align-items-end"
            >
              <Button
                variant="primary"
                onClick={handleSearch}
              >
                <BsSearch className="me-1" />
                Tìm kiếm
              </Button>
            </Col>
          </Row>

          {/* TABLE KẾT QUẢ */}
          <div className="form-section-title">
            <BsGearFill />
            Kết quả tìm kiếm thiết bị
          </div>

          {
            !systemId ? (

                <div className="alert alert-info">
                  Vui lòng chọn hệ thống để xem danh sách thiết bị cần bảo dưỡng.
                </div>

            ) : (

                <div className="table-responsive mb-4">
                  <Table bordered hover>
                    <thead>
                    <tr>
                      <th width="60">Chọn</th>
                      <th>Mã KHBD</th>
                      <th>Mã thiết bị</th>
                      <th>Tên thiết bị</th>
                      <th>Mã hệ thống</th>
                      <th>Tên hệ thống</th>
                      <th>Chu kỳ</th>
                      <th>Ngày bảo dưỡng</th>
                      <th>Trạng thái</th>
                    </tr>
                    </thead>

                    <tbody>
                    {
                      plans.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center">
                              Không có dữ liệu
                            </td>
                          </tr>
                      ) : (
                          plans.map(item => {

                            const checked =
                                selectedEquipments.some(
                                    e => e.id === item.id
                                );

                            return (
                                <tr key={item.id}>

                                  <td className="text-center">
                                    <Form.Check
                                        type="checkbox"
                                        checked={checked}
                                        disabled={lockedPlanIds.has(item.id)}
                                        onChange={(e) =>
                                            handleSelectEquipment(
                                                item,
                                                e.target.checked
                                            )
                                        }
                                    />
                                  </td>

                                  <td>{item.lubricationCode}</td>

                                  <td>
                                    {item.equipment?.equipmentCode}
                                  </td>

                                  <td>
                                    {item.equipment?.name}
                                  </td>

                                  <td>
                                    {item.equipment?.system?.systemCode}
                                  </td>

                                  <td>
                                    {item.equipment?.system?.name}
                                  </td>

                                  <td>
                                    {item.cycleDays} ngày
                                  </td>

                                  <td>
                                    {item.nextDueDate}
                                  </td>

                                  <td>
                                    {item.status}
                                  </td>

                                </tr>
                            );
                          })
                      )
                    }
                    </tbody>
                  </Table>
                  <Pagination className="justify-content-center">

                    <Pagination.First
                        disabled={!systemId || page === 0}
                        onClick={() => loadChecklist(0)}
                    />

                    <Pagination.Prev
                        disabled={page === 0}
                        onClick={() => loadChecklist(page - 1)}
                    />

                    {Array.from(
                        { length: totalPages },
                        (_, index) => (
                            <Pagination.Item
                                key={index}
                                active={page === index}
                                onClick={() =>
                                    loadChecklist(index)
                                }
                            >
                              {index + 1}
                            </Pagination.Item>
                        )
                    )}

                    <Pagination.Next
                        disabled={page >= totalPages - 1}
                        onClick={() =>
                            loadChecklist(page + 1)
                        }
                    />

                    <Pagination.Last
                        disabled={page >= totalPages - 1}
                        onClick={() =>
                            loadChecklist(totalPages - 1)
                        }
                    />

                  </Pagination>
                </div>

            )
          }

          {/* TABLE THIẾT BỊ ĐƯỢC CHỌN */}
          <div className="form-section-title">
            <BsDropletFill />
            Thiết bị được chọn
          </div>
          <div className="d-flex justify-content-between mb-2">
            <strong>
              Đã chọn:
              {selectedEquipments.length} thiết bị
            </strong>
          </div>

          <div className="table-responsive">
            <Table bordered hover>

              <thead>
              <tr>
                <th>Mã KHBD</th>
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Hệ thống</th>
                <th>Vật tư</th>
                <th>Số lượng</th>
                <th>Ngày bảo dưỡng</th>
              </tr>
              </thead>

              <tbody>

              {selectedEquipments.length === 0 ? (

                  <tr>
                    <td
                        colSpan={7}
                        className="text-center"
                    >
                      Chưa chọn thiết bị
                    </td>
                  </tr>

              ) : (

                  selectedEquipments.map(item => (

                      <tr key={item.id}>

                        <td>
                          {item.lubricationCode}
                        </td>

                        <td>
                          {item.equipment?.equipmentCode}
                        </td>

                        <td>
                          {item.equipment?.name}
                        </td>

                        <td>
                          {item.equipment?.system?.name}
                        </td>

                        <td>
                          {item.consumable?.name}
                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          {item.nextDueDate}
                        </td>

                      </tr>

                  ))

              )}

              </tbody>

            </Table>
          </div>

          {/* XUẤT CHECKLIST */}
          <div className="mt-3 d-flex justify-content-end">
            <Button
              variant="primary"
              className="me-2"
              onClick={() => setShowLubWorkOrder(true)}
              disabled={selectedEquipments.length === 0}
            >
              <BsFileEarmarkPlus className="me-1" />
              Tạo phiếu công tác bôi trơn
            </Button>
            <Button
              variant="outline-success"
              onClick={
                handleExportChecklist
              }
              disabled={
                selectedEquipments.length === 0
              }
            >
              <BsFileEarmarkCheck className="me-1" />
              Xuất Checklist
            </Button>
          </div>
        </div>

        {showLubWorkOrder && (
          <CreateManualWorkOrderModal
            show={showLubWorkOrder}
            lubricationPlans={selectedEquipments}
            onClose={() => setShowLubWorkOrder(false)}
            onCreated={() => {
              setShowLubWorkOrder(false);
              setSelectedEquipments([]);
              loadChecklist(page);
              loadLockedPlanIds();
            }}
          />
        )}

      </div>
    );
  }