import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Collapse,
    Badge,
    Card
} from "react-bootstrap";

import * as repairHistoryService from "../../services/repairHistoryService";

export default function RepairHistoryTab({ equipmentId }) {

    const [repairHistories, setRepairHistories] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        loadRepairHistory();
    }, [equipmentId]);

    const loadRepairHistory = async () => {
        try {
            const res = await repairHistoryService.getByEquipment(equipmentId);
            setRepairHistories(res.data);
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <>

            <h5 className="fw-bold mb-4">
                Lịch sử sửa chữa
            </h5>

            {repairHistories.length === 0 ? (

                <div className="text-center py-5 text-muted border rounded bg-light">
                    Thiết bị chưa có lịch sử sửa chữa.
                </div>

            ) : (

                <Table hover bordered>

                    <thead className="table-light">

                        <tr>
                            <th width="5%">#</th>
                            <th>Mã công việc</th>
                            <th>Ngày sửa</th>
                            <th>Kết quả</th>
                            <th width="120">Thao tác</th>
                        </tr>

                    </thead>

                    <tbody>

                        {repairHistories.map((item, index) => (

                            <>
                                <tr key={item.id}>

                                    <td>{index + 1}</td>

                                    <td>{item.orderCode}</td>

                                    <td>{item.repairDate}</td>

                                    <td>
                                        <Badge bg="success">
                                            {item.repairResult}
                                        </Badge>
                                    </td>

                                    <td>
                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            onClick={() =>
                                                setOpenId(
                                                    openId === item.id
                                                        ? null
                                                        : item.id
                                                )
                                            }
                                        >
                                            {openId === item.id
                                                ? "Ẩn"
                                                : "Chi tiết"}
                                        </Button>
                                    </td>

                                </tr>

                                <tr>

                                    <td colSpan={5} className="p-0 border-0">

                                        <Collapse in={openId === item.id}>

                                            <div>

                                                <Card className="m-3 shadow-sm">

                                                    <Card.Body>

                                                        <h6 className="fw-bold mb-3">
                                                            Thông tin sửa chữa
                                                        </h6>

                                                        <p>
                                                            <b>Trưởng nhóm:</b>{" "}
                                                            {item.leaderName}
                                                        </p>

                                                        <p>
                                                            <b>Nội dung:</b>{" "}
                                                            {item.repairContent}
                                                        </p>

                                                        <p>
                                                            <b>Kết quả:</b>{" "}
                                                            {item.repairResult}
                                                        </p>

                                                        <hr />

                                                        <h6 className="fw-bold">
                                                            Phụ tùng sử dụng
                                                        </h6>

                                                        {item.details.length === 0 ? (

                                                            <div className="text-muted">
                                                                Không sử dụng phụ tùng
                                                            </div>

                                                        ) : (

                                                            <Table
                                                                bordered
                                                                size="sm"
                                                                className="mt-2"
                                                            >

                                                                <thead>

                                                                    <tr>
                                                                        <th>STT</th>
                                                                        <th>Mã</th>
                                                                        <th>Tên phụ tùng</th>
                                                                        <th>SL</th>
                                                                        <th>Đơn vị</th>
                                                                    </tr>

                                                                </thead>

                                                                <tbody>

                                                                    {item.details.map((d, i) => (

                                                                        <tr key={d.id}>

                                                                            <td>{i + 1}</td>

                                                                            <td>{d.sparePartCode}</td>

                                                                            <td>{d.sparePartName}</td>

                                                                            <td>{d.quantity}</td>

                                                                            <td>{d.unitName}</td>

                                                                        </tr>

                                                                    ))}

                                                                </tbody>

                                                            </Table>

                                                        )}

                                                    </Card.Body>

                                                </Card>

                                            </div>

                                        </Collapse>

                                    </td>

                                </tr>

                            </>

                        ))}

                    </tbody>

                </Table>

            )}

        </>
    );
}