import { useEffect, useState } from "react";
import {
    Table,
    Button,
    Collapse,
    Card
} from "react-bootstrap";

import * as lubricationService from "../../services/equipment/lubricationService";

export default function LubricationHistoryTab({
    equipmentId
}) {

    const [histories, setHistories] = useState([]);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {

        loadHistory();

    }, [equipmentId]);

    const loadHistory = async () => {

        try {

            const res =
                await lubricationService.getByEquipment(
                    equipmentId
                );

            setHistories(res.data);

        } catch (e) {

            console.log(e);

        }

    };
    return (
        <>
            <h5 className="fw-bold mb-4">
                Lịch sử bảo dưỡng
            </h5>

            {histories.length === 0 ? (

                <div className="text-center py-5 text-muted border rounded bg-light">
                    Thiết bị chưa có lịch sử bảo dưỡng.
                </div>

            ) : (

                <Table hover bordered>

                    <thead className="table-light">

                        <tr>
                            <th width="5%">#</th>
                            <th>Ngày bảo dưỡng</th>
                            <th>Ghi chú</th>
                            <th width="120">Thao tác</th>
                        </tr>

                    </thead>

                    <tbody>

                        {histories.map((item, index) => (

                            <>

                                <tr key={item.id}>

                                    <td>{index + 1}</td>

                                    <td>{item.performedDate}</td>

                                    <td>
                                        {item.notes?.length > 40
                                            ? item.notes.substring(0, 40) + "..."
                                            : item.notes}
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

                                    <td colSpan={4} className="p-0 border-0">

                                        <Collapse in={openId === item.id}>

                                            <div>

                                                <Card className="m-3 shadow-sm">

                                                    <Card.Body>

                                                        <h6 className="fw-bold mb-3">
                                                            Thông tin bảo dưỡng
                                                        </h6>

                                                        <Table bordered>

                                                            <tbody>

                                                                <tr>
                                                                    <td width="25%">
                                                                        Mã KKS
                                                                    </td>
                                                                    <td>
                                                                        {item.kksCode}
                                                                    </td>
                                                                </tr>

                                                                <tr>
                                                                    <td>
                                                                        Thiết bị
                                                                    </td>
                                                                    <td>
                                                                        {item.equipmentName}
                                                                    </td>
                                                                </tr>

                                                                <tr>
                                                                    <td>
                                                                        Ngày bảo dưỡng
                                                                    </td>
                                                                    <td>
                                                                        {item.performedDate}
                                                                    </td>
                                                                </tr>

                                                                <tr>
                                                                    <td>
                                                                        Ghi chú
                                                                    </td>
                                                                    <td>
                                                                        {item.notes || "-"}
                                                                    </td>
                                                                </tr>

                                                            </tbody>

                                                        </Table>

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