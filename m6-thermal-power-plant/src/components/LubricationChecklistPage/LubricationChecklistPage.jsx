import { useState, useEffect } from "react";
import { Row, Col, Button, Table } from "react-bootstrap";
import {
  BsGearFill,
  BsDropletFill,
  BsSearch,
  BsFileEarmarkCheck,
} from "react-icons/bs";

import "../LubricationPlan/LubricationPlanForm.css";

export default function LubricationPlanForm() {
  const [systemFilter, setSystemFilter] = useState("");

  const [equipmentList, setEquipmentList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [selectedEquipments, setSelectedEquipments] =
    useState([]);

  const [consumableList, setConsumableList] =
    useState([]);

  const systems = [
    {
      id: 1,
      code: "SYS-001",
      name: "Hệ thống làm mát",
    },
    {
      id: 2,
      code: "SYS-002",
      name: "Hệ thống turbine",
    },
    {
      id: 3,
      code: "SYS-003",
      name: "Hệ thống nghiền than",
    },
  ];

    const units = [
        "Lít",
        "Kg",
        "Cái",
        "Tuýp",
        "Thùng",
        "Can",
    ];

  useEffect(() => {
    setEquipmentList([
      {
        id: 1,
        systemId: 1,
        systemName: "Hệ thống làm mát",
        equipmentCode: "TB-001",
        equipmentName: "Bơm nước làm mát",
        cycleMonths: 3,
        nextDueDate: "2026-08-01",
      },
      {
        id: 2,
        systemId: 2,
        systemName: "Hệ thống turbine",
        equipmentCode: "TB-002",
        equipmentName: "Turbine số 1",
        cycleMonths: 6,
        nextDueDate: "2026-09-15",
      },
      {
        id: 3,
        systemId: 3,
        systemName: "Hệ thống nghiền than",
        equipmentCode: "TB-003",
        equipmentName: "Máy nghiền than",
        cycleMonths: 4,
        nextDueDate: "2026-07-20",
      },
    ]);

    setConsumableList([
      {
        id: 1,
        name: "Dầu Shell Omala S2",
      },
      {
        id: 2,
        name: "Mỡ SKF LGMT 2",
      },
      {
        id: 3,
        name: "Dầu Mobil DTE 25",
      },
    ]);
  }, []);

  const handleSearch = () => {
    const filtered = equipmentList.filter(
      (item) =>
        !systemFilter ||
        item.systemId.toString() === systemFilter
    );

    setSearchResults(filtered);
  };

  const handleSelectEquipment = (
    equipment,
    checked
  ) => {
    if (checked) {
      const existed = selectedEquipments.find(
        (item) => item.id === equipment.id
      );

      if (!existed) {
          setSelectedEquipments((prev) => [
              ...prev,
              {
                  ...equipment,
                  consumableId: "",
                  quantity: 1,
                  unit: "Lít",
              },
        ]);
      }
    } else {
      setSelectedEquipments((prev) =>
        prev.filter(
          (item) => item.id !== equipment.id
        )
      );
    }
  };

  const handleUpdateSelected = (
    index,
    field,
    value
  ) => {
    const clone = [...selectedEquipments];

    clone[index][field] = value;

    setSelectedEquipments(clone);
  };

  const handleExportChecklist = () => {
    console.log(selectedEquipments);

    alert(
      `Xuất checklist cho ${selectedEquipments.length} thiết bị`
    );
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

            <select
              className="form-select"
              value={systemFilter}
              onChange={(e) =>
                setSystemFilter(e.target.value)
              }
            >
              <option value="">
                Tất cả hệ thống
              </option>

              {systems.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
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

        <div className="table-responsive mb-4">
          <Table bordered hover>
            <thead>
              <tr>
                <th width="70">Chọn</th>
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Hệ thống</th>
                <th>Chu kỳ</th>
                <th>Ngày bảo dưỡng</th>
              </tr>
            </thead>

            <tbody>
              {searchResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center"
                  >
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                searchResults.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedEquipments.some(
                          (eq) =>
                            eq.id === item.id
                        )}
                        onChange={(e) =>
                          handleSelectEquipment(
                            item,
                            e.target.checked
                          )
                        }
                      />
                    </td>

                    <td>{item.equipmentCode}</td>
                    <td>{item.equipmentName}</td>
                    <td>{item.systemName}</td>
                    <td>
                      {item.cycleMonths} tháng
                    </td>
                    <td>{item.nextDueDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {/* TABLE THIẾT BỊ ĐƯỢC CHỌN */}
        <div className="form-section-title">
          <BsDropletFill />
          Thiết bị được chọn
        </div>

        <div className="table-responsive">
          <Table bordered hover>
              <thead>
              <tr>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Vật tư dầu mỡ</th>
                  <th width="120">Số lượng</th>
                  <th width="150">Đơn vị</th>
              </tr>
              </thead>

            <tbody>
              {selectedEquipments.length ===
              0 ? (
                <tr>
                    <td
                        colSpan={5}
                        className="text-center"
                    >
                        Chưa chọn thiết bị
                    </td>
                </tr>
              ) : (
                selectedEquipments.map(
                  (item, index) => (
                      <tr key={item.id}>
                          <td>{item.equipmentCode}</td>

                          <td>{item.equipmentName}</td>

                          <td>
                              <select
                                  className="form-select"
                                  value={item.consumableId}
                                  onChange={(e) =>
                                      handleUpdateSelected(
                                          index,
                                          "consumableId",
                                          e.target.value
                                      )
                                  }
                              >
                                  <option value="">
                                      Chọn vật tư
                                  </option>

                                  {consumableList.map((c) => (
                                      <option
                                          key={c.id}
                                          value={c.id}
                                      >
                                          {c.name}
                                      </option>
                                  ))}
                              </select>
                          </td>

                          <td>
                              <input
                                  type="number"
                                  min="1"
                                  className="form-control"
                                  value={item.quantity}
                                  onChange={(e) =>
                                      handleUpdateSelected(
                                          index,
                                          "quantity",
                                          e.target.value
                                      )
                                  }
                              />
                          </td>

                          <td>
                              <select
                                  className="form-select"
                                  value={item.unit}
                                  onChange={(e) =>
                                      handleUpdateSelected(
                                          index,
                                          "unit",
                                          e.target.value
                                      )
                                  }
                              >
                                  {units.map((unit) => (
                                      <option
                                          key={unit}
                                          value={unit}
                                      >
                                          {unit}
                                      </option>
                                  ))}
                              </select>
                          </td>
                      </tr>
                  )
                )
              )}
            </tbody>
          </Table>
        </div>

        {/* XUẤT CHECKLIST */}
        <div className="mt-3 d-flex justify-content-end">
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


    </div>
  );
}