import { useState } from "react";
import { Button, Table, Form } from "react-bootstrap";
import { PDFDownloadLink } from "@react-pdf/renderer";

import {
    BsFilePdf,
    BsCheckSquare,
} from "react-icons/bs";

import LubricationChecklistPDF
    from "../../pdf/LubricationChecklistPDF";

export default function LubricationChecklistPage() {

    const [selectedIds, setSelectedIds] =
        useState([]);

    const equipments = [
        {
            id: 1,
            equipmentCode: "TB-001",
            equipmentName: "Bơm nước làm mát",
            lubricantType: "Shell Omala S2",
            quantity: 2,
            nextDueDate: "2026-06-23",
        },
        {
            id: 2,
            equipmentCode: "TB-002",
            equipmentName: "Turbine số 1",
            lubricantType: "Mobil DTE 25",
            quantity: 5,
            nextDueDate: "2026-06-24",
        },
        {
            id: 3,
            equipmentCode: "TB-003",
            equipmentName: "Máy nghiền than",
            lubricantType: "SKF LGMT 2",
            quantity: 1,
            nextDueDate: "2026-06-25",
        },
    ];

    const handleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const selectedEquipments =
        equipments.filter((item) =>
            selectedIds.includes(item.id)
        );

    return ( <div className="nhansu-form-card">

        ```
        <div className="nhansu-form-header">
            <div className="nhansu-form-header-icon">
                <BsCheckSquare />
            </div>

            <div className="nhansu-form-header-text">
                <h2>
                    Checklist Bảo Dưỡng Dầu Mỡ
                </h2>

                <p>
                    Chọn thiết bị đến kỳ thay dầu
                    hoặc bổ sung mỡ để xuất PDF.
                </p>
            </div>
        </div>

        <div className="nhansu-form-body">

            <Table
                bordered
                hover
                responsive
            >
                <thead>
                <tr>
                    <th width="60">
                        Chọn
                    </th>

                    <th>Mã TB</th>
                    <th>Tên thiết bị</th>
                    <th>Loại dầu mỡ</th>
                    <th>Định lượng</th>
                    <th>Ngày đến hạn</th>
                </tr>
                </thead>

                <tbody>

                {equipments.map((item) => (

                    <tr key={item.id}>

                        <td>
                            <Form.Check
                                checked={
                                    selectedIds.includes(
                                        item.id
                                    )
                                }
                                onChange={() =>
                                    handleSelect(item.id)
                                }
                            />
                        </td>

                        <td>
                            {item.equipmentCode}
                        </td>

                        <td>
                            {item.equipmentName}
                        </td>

                        <td>
                            {item.lubricantType}
                        </td>

                        <td>
                            {item.quantity}
                        </td>

                        <td>
                            {item.nextDueDate}
                        </td>

                    </tr>

                ))}

                </tbody>
            </Table>

        </div>

        <div className="nhansu-form-footer">

            <PDFDownloadLink
                document={
                    <LubricationChecklistPDF
                        equipments={
                            selectedEquipments
                        }
                    />
                }
                fileName="checklist-bao-duong-dau-mo.pdf"
            >
                {({ loading }) => (
                    <Button
                        variant="primary"
                        disabled={
                            loading ||
                            selectedEquipments.length === 0
                        }
                    >
                        <BsFilePdf />

                        {loading
                            ? "Đang tạo PDF..."
                            : "Xuất Checklist PDF"}
                    </Button>
                )}
            </PDFDownloadLink>

        </div>

    </div>


);
}
