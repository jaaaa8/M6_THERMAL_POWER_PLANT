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
        color: "#222",
        lineHeight: 1.5,
    },

    header: {
        textAlign: "center",
        marginBottom: 20,
        borderBottom: "2 solid #0d6efd",
        paddingBottom: 10,
    },

    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0d6efd",
        marginBottom: 5,
    },

    subTitle: {
        fontSize: 10,
        color: "#666",
    },

    section: {
        marginBottom: 15,
        border: "1 solid #d9d9d9",
        borderRadius: 4,
        padding: 10,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#0d6efd",
    },

    row: {
        flexDirection: "row",
        marginBottom: 6,
    },

    label: {
        width: "35%",
        fontWeight: "bold",
    },

    value: {
        width: "65%",
    },

    contentBox: {
        marginTop: 5,
        padding: 10,
        backgroundColor: "#f8f9fa",
        border: "1 solid #e5e5e5",
    },

    table: {
        border: "1 solid #d9d9d9",
        marginTop: 10,
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#e9f2ff",
        borderBottom: "1 solid #d9d9d9",
    },

    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #e5e5e5",
    },

    cellNo: {
        width: "10%",
        padding: 6,
        borderRight: "1 solid #d9d9d9",
    },

    cellName: {
        width: "50%",
        padding: 6,
        borderRight: "1 solid #d9d9d9",
    },

    cellQty: {
        width: "20%",
        padding: 6,
        borderRight: "1 solid #d9d9d9",
        textAlign: "center",
    },

    cellUnit: {
        width: "20%",
        padding: 6,
        textAlign: "center",
    },

    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 9,
        color: "#666",
    },
});

export default function SparePartsIssuePDF({
                                               data,
                                               workOrders,
                                               spareParts,
                                               employees,
                                               technicalAssessment,
                                           }) {

    const workOrder =
        workOrders.find(
            w => w.id.toString() === data.workOrderId
        )?.code || "";

    const issuedBy =
        employees.find(
            e => e.id.toString() === data.issuedBy
        )?.fullName || "";

    return (
        <Document>

            {/* PAGE 1 */}
            <Page size="A4" style={styles.page}>

                <View style={styles.header}>
                    <Text style={styles.title}>
                        PHIẾU XUẤT VẬT TƯ
                    </Text>

                    <Text style={styles.subTitle}>
                        Cấp phát vật tư phục vụ bảo trì thiết bị
                    </Text>
                </View>

                {/* THÔNG TIN CHUNG */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        I. Thông tin phiếu xuất vật tư
                    </Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Mã phiếu:
                        </Text>

                        <Text style={styles.value}>
                            {data.sparePartCode}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Lệnh công việc:
                        </Text>

                        <Text style={styles.value}>
                            {workOrder}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Người yêu cầu:
                        </Text>

                        <Text style={styles.value}>
                            {issuedBy}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Thời gian yêu cầu:
                        </Text>

                        <Text style={styles.value}>
                            {data.issuedAt}
                        </Text>
                    </View>
                </View>

                {/* DANH SÁCH VẬT TƯ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        II. Danh sách vật tư cấp phát
                    </Text>

                    <View style={styles.table}>

                        <View style={styles.tableHeader}>
                            <Text style={styles.cellNo}>STT</Text>
                            <Text style={styles.cellName}>
                                Tên vật tư
                            </Text>
                            <Text style={styles.cellQty}>
                                Số lượng
                            </Text>
                            <Text style={styles.cellUnit}>
                                ĐVT
                            </Text>
                        </View>

                        {data.items?.map((item, index) => {

                            const sparePart =
                                spareParts.find(
                                    sp =>
                                        sp.id.toString() ===
                                        item.sparePartId
                                );

                            return (
                                <View
                                    key={index}
                                    style={styles.tableRow}
                                >
                                    <Text style={styles.cellNo}>
                                        {index + 1}
                                    </Text>

                                    <Text style={styles.cellName}>
                                        {sparePart?.name || ""}
                                    </Text>

                                    <Text style={styles.cellQty}>
                                        {item.quantity}
                                    </Text>

                                    <Text style={styles.cellUnit}>
                                        {item.unit}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <Text fixed style={styles.footer}>
                    Hệ thống quản lý bảo trì nhà máy nhiệt điện
                </Text>

            </Page>

            {/* PAGE 2 */}
            <Page size="A4" style={styles.page} wrap={false}>

                <View
                    style={{
                        marginTop: 120,
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "bold",
                        }}
                    >
                        XÁC NHẬN CẤP PHÁT VẬT TƯ
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 120,
                    }}
                >
                    <View
                        style={{
                            width: "40%",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Người nhận vật tư
                        </Text>

                        <Text
                            style={{
                                marginTop: 80,
                            }}
                        >
                            __________________
                        </Text>
                    </View>

                    <View
                        style={{
                            width: "40%",
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "bold",
                            }}
                        >
                            Người cấp phát
                        </Text>

                        <Text
                            style={{
                                marginTop: 80,
                            }}
                        >
                            __________________
                        </Text>
                    </View>
                </View>

                <Text fixed style={styles.footer}>
                    Hệ thống quản lý bảo trì nhà máy nhiệt điện
                </Text>

            </Page>

        </Document>
    );
}