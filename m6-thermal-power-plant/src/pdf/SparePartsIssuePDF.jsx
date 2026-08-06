import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";

import RobotoRegular from "../assets/fonts/Roboto-Regular.ttf";
import RobotoBold from "../assets/fonts/Roboto-Bold.ttf";

Font.register({
    family: "Roboto",
    fonts: [
        {
            src: RobotoRegular,
            fontWeight: "normal",
        },
        {
            src: RobotoBold,
            fontWeight: "bold",
        },
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Roboto",
        fontSize: 11,
        color: "#000",
        lineHeight: 1.5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    headerLeft: {
        width: "45%",
        textAlign: "center",
        fontWeight: "bold",
    },
    hr: {
        borderTop: "1 solid black",
        width: "60%",
        alignSelf: "center",
        marginTop: 4,
        marginBottom: 4,
    },
    headerRight: {
        width: "45%",
        textAlign: "center",
    },
    titleSection: {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    headerDetails: {
        textAlign: "right",
        marginBottom: 10,
        paddingRight: 20,
    },
    sendTo: {
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 5,
    },
    table: {
        borderTop: "1 solid #000",
        borderLeft: "1 solid #000",
        borderRight: "1 solid #000",
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        borderBottom: "1 solid #000",
        fontWeight: "bold",
        alignItems: "stretch",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #000",
    },
    col1: { width: "5%", borderRight: "1 solid #000", padding: 5, justifyContent: "center", alignItems: "center" },
    col2: { width: "15%", borderRight: "1 solid #000", padding: 5, justifyContent: "center", alignItems: "center" },
    col3: { width: "30%", borderRight: "1 solid #000", padding: 5, justifyContent: "center", alignItems: "center" },
    col4: { width: "10%", borderRight: "1 solid #000", padding: 5, justifyContent: "center", alignItems: "center" },
    colGroup: { width: "20%", borderRight: "1 solid #000", flexDirection: "column" },
    colGroupTitle: { borderBottom: "1 solid #000", padding: 5, textAlign: "center" },
    colGroupSub: { flexDirection: "row", flex: 1 },
    col5: { width: "50%", borderRight: "1 solid #000", padding: 5, justifyContent: "center", alignItems: "center" },
    col6: { width: "50%", padding: 5, justifyContent: "center", alignItems: "center" },
    col7: { width: "20%", padding: 5, justifyContent: "center", alignItems: "center" },
    
    cell1: { width: "5%", borderRight: "1 solid #000", padding: 5, textAlign: "center" },
    cell2: { width: "15%", borderRight: "1 solid #000", padding: 5, textAlign: "center" },
    cell3: { width: "30%", borderRight: "1 solid #000", padding: 5 },
    cell4: { width: "10%", borderRight: "1 solid #000", padding: 5, textAlign: "center" },
    cell5: { width: "10%", borderRight: "1 solid #000", padding: 5, textAlign: "center" },
    cell6: { width: "10%", borderRight: "1 solid #000", padding: 5, textAlign: "center" },
    cell7: { width: "20%", padding: 5, textAlign: "center" },
    
    signatures: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    signBox: {
        width: "33%",
        textAlign: "center",
    },
    signRole: {
        fontWeight: "bold",
    },
    dots: {
        marginTop: 50,
    }
});

export default function SparePartsIssuePDF({
    data,
    workOrders,
    spareParts,
}) {
    const getDayMonthYear = (date) => {
        if (!date) return { day: "...", month: "...", year: "......" };
        const d = new Date(date);
        if (isNaN(d.getTime())) return { day: "...", month: "...", year: "......" };
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: String(d.getMonth() + 1).padStart(2, '0'),
            year: d.getFullYear()
        };
    };

    const dmy = getDayMonthYear(data?.issuedAt);

    const workOrder = workOrders?.find(
        w => Number(w.id) === Number(data?.workOrderId)
    )?.orderCode || "";

    const requesterName = data?.issuedBy?.employee?.employeeName || data?.issuedBy?.username || "[Họ và tên người đề nghị]";

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text>CÔNG TY CỔ PHẦN DỊCH VỤ KỸ THUẬT</Text>
                        <Text>ĐIỆN LỰC DẦU KHÍ VIỆT NAM</Text>
                        <Text>CHI NHÁNH HÀ TĨNH</Text>
                        <View style={styles.hr} />
                    </View>
                    <View style={styles.headerRight}>
                        <Text>Biểu số 03-TT</Text>
                        <Text>(Ban hành theo quyết định số 15/2006/QĐ-BTC ngày</Text>
                        <Text>20/03/2006 của Bộ Tài Chính)</Text>
                    </View>
                </View>

                <View style={styles.titleSection}>
                    <Text style={styles.title}>GIẤY ĐỀ NGHỊ XUẤT KHO VẬT TƯ</Text>
                    <Text>Ngày {dmy.day} tháng {dmy.month} năm {dmy.year}</Text>
                </View>

                <View style={styles.headerDetails}>
                    <View style={{ width: 250, marginLeft: "auto", textAlign: "left" }}>
                        <View style={{ flexDirection: "row" }}>
                            <Text style={{ width: 85 }}>Xuất tại kho:</Text>
                            <Text>............................................</Text>
                        </View>
                        <View style={{ flexDirection: "row", marginVertical: 3 }}>
                            <Text style={{ width: 85 }}>Số phiếu xuất:</Text>
                            <Text>{data?.sparePartCode || "............................................"}</Text>
                        </View>
                        <View style={{ flexDirection: "row" }}>
                            <Text style={{ width: 85 }}>Ngày:</Text>
                            <Text>............................................</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sendTo}>
                    <Text>Kính gửi: Ông Giám đốc Công ty Điện lực Dầu khí Hà Tĩnh</Text>
                </View>

                <View style={{ marginBottom: 5 }}>
                    <View style={styles.infoRow}>
                        <Text style={{ width: "15%" }}>1. Người đề nghị:</Text>
                        <Text style={{ width: "85%" }}>{requesterName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={{ width: "15%" }}>2. Lý do sử dụng:</Text>
                        <Text style={{ width: "40%" }}>{data?.reason || data?.description || "[Lý do sử dụng]"}</Text>
                        <Text style={{ width: "20%" }}>WO:   {workOrder || "[Mã công tác]"}</Text>
                        <Text style={{ width: "25%" }}>KKS:   {data?.kks || "[KKS]"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text>3. Đề nghị lĩnh số vật tư dưới đây:</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <View style={styles.col1}><Text>STT</Text></View>
                        <View style={styles.col2}><Text>Mã vật tư</Text></View>
                        <View style={styles.col3}><Text>Tên vật tư và quy cách</Text></View>
                        <View style={styles.col4}><Text>ĐVT</Text></View>
                        <View style={styles.colGroup}>
                            <View style={styles.colGroupTitle}><Text>Số lượng</Text></View>
                            <View style={styles.colGroupSub}>
                                <View style={styles.col5}><Text>Cần</Text></View>
                                <View style={styles.col6}><Text>Cấp</Text></View>
                            </View>
                        </View>
                        <View style={styles.col7}><Text>Ghi chú</Text></View>
                    </View>

                    {data?.items?.map((item, index) => {
                        const sp = spareParts?.find(
                            s => s.id?.toString() === item.sparePartId?.toString()
                        );
                        return (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.cell1}>{index + 1}</Text>
                                <Text style={styles.cell2}>{sp?.partCode || sp?.code || ""}</Text>
                                <Text style={styles.cell3}>{sp?.name || ""}</Text>
                                <Text style={styles.cell4}>{sp?.unitName || ""}</Text>
                                <Text style={styles.cell5}>{item.quantity}</Text>
                                <Text style={styles.cell6}></Text>
                                <Text style={styles.cell7}></Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.signatures}>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>Người nhận</Text>
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>Tổ trưởng sản xuất</Text>
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>CHI NHÁNH PVPSHT</Text>
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                </View>

                <View style={[styles.signatures, { marginTop: 20 }]}>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>Phòng Kỹ thuật PVPHT</Text>
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>Phòng Vật Tư - Vận Tải</Text>
                        <Text>(Ký, ghi rõ họ tên)</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                    <View style={styles.signBox}>
                        <Text style={styles.signRole}>GIÁM ĐỐC PVPHT</Text>
                        <Text style={{ textDecoration: 'underline' }}>Phê duyệt</Text>
                        <Text style={styles.dots}>...................................................</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
}