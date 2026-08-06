import { pdf } from "@react-pdf/renderer";
import SparePartsIssuePDF from "../pdf/SparePartsIssuePDF";
import { toast } from "react-toastify";

export const downloadSparePartsIssuePdf = async (issue, workOrders = [], spareParts = []) => {
    if (!issue) return;
    try {
        const toastId = toast.info("Đang khởi tạo và tải file PDF phiếu xuất...", { autoClose: false });

        const formattedData = {
            ...issue,
            sparePartCode: issue.issueCode || issue.sparePartCode,
            workOrderId: issue.workOrderId,
            workOrderCode: issue.workOrderCode,
            issuedAt: issue.issuedAt,
            issuedBy: issue.issuedBy,
            items: (issue.details || issue.items || []).map(d => ({
                sparePartId: d.sparePartId || d.sparePart?.id,
                sparePartCode: d.sparePartCode || d.sparePart?.sparePartCode,
                sparePartName: d.sparePartName || d.sparePart?.name,
                unit: d.unit || d.sparePart?.unit?.name || d.unitName,
                quantity: d.quantity
            }))
        };

        const fileName = formattedData.sparePartCode || `SPI_${issue.id || Date.now()}`;
        const blob = await pdf(
            <SparePartsIssuePDF
                data={formattedData}
                workOrders={workOrders}
                spareParts={spareParts}
            />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(toastId);
        toast.success(`Đã tải xuống file PDF ${fileName}.pdf`);
    } catch (error) {
        console.error("Lỗi khi tải file PDF:", error);
        toast.error("Không thể tải xuống file PDF phiếu xuất");
    }
};
