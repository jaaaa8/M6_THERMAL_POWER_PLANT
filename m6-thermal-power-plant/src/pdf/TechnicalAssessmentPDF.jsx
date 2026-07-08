import {
    Document,
    Page,
    Text,
    Image,
    View,
    StyleSheet,
    Font
} from "@react-pdf/renderer";

import RobotoRegular from "../assets/fonts/Roboto-Regular.ttf";
import RobotoBold from "../assets/fonts/Roboto-Bold.ttf";

/* ===========================
   FONT TIẾNG VIỆT
=========================== */

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

/* ===========================
   STYLES
=========================== */

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Roboto",
        fontSize: 11,
        lineHeight: 1.5,
        color: "#222",
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

    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 9,
        color: "#666",
    },

    statusPending: {
        color: "#f59e0b",
        fontWeight: "bold",
    },

    statusProgress: {
        color: "#2563eb",
        fontWeight: "bold",
    },

    statusCompleted: {
        color: "#16a34a",
        fontWeight: "bold",
    },

    statusRejected: {
        color: "#dc2626",
        fontWeight: "bold",
    },

    imageSection: {
        marginBottom: 15,
        border: "1 solid #d9d9d9",
        padding: 10,
    },

    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    imageCard: {
        width: "48%",
        marginBottom: 15,
        border: "1 solid #d9d9d9",
        borderRadius: 5,
        padding: 8,
    },

    imageWrapper: {
        width: "100%",
        height: 180,
        border: "1 solid #eee",
        backgroundColor: "#f8f9fa",
        justifyContent: "center",
        alignItems: "center",
    },

    image: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    },

    imageCaption: {
        marginTop: 5,
        fontSize: 9,
        textAlign: "center",
        color: "#666",
    },

});

/* ===========================
   COMPONENT
=========================== */

export default function TechnicalAssessmentPDF({
                                                   data,
                                                   workOrders,
                                                   assessors,
                                                   systems = [],
                                                   equipments = [],
                                                   spareParts = [],
                                                   images = []
                                               }) {

    const workOrder =
        workOrders.find(
            (w) => w.id.toString() === data.workOrderId
        )?.code || "";

    const assessor =
        assessors.find(
            (a) => a.username.toString() === data.username
        )?.fullName || "";

    const system =
        systems.find(
            (s) => s.id.toString() === data.systemId
        )?.name || "";

    const equipment =
        equipments.find(
            (e) => e.id.toString() === data.equipmentId
        )?.name || "";

    const sparePart =
        spareParts.find(
            (s) => s.id.toString() === data.sparePartId
        )?.name || "";

    const getStatusLabel = () => {
        switch (data.status) {
            case "PENDING":
                return "Chờ xử lý";
            case "IN_PROGRESS":
                return "Đang xử lý";
            case "COMPLETED":
                return "Hoàn thành";
            case "REJECTED":
                return "Từ chối";
            default:
                return "";
        }
    };

    const getStatusStyle = () => {
        switch (data.status) {
            case "PENDING":
                return styles.statusPending;
            case "IN_PROGRESS":
                return styles.statusProgress;
            case "COMPLETED":
                return styles.statusCompleted;
            case "REJECTED":
                return styles.statusRejected;
            default:
                return {};
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        PHIẾU ĐÁNH GIÁ KỸ THUẬT
                    </Text>

                    <Text style={styles.subTitle}>
                        Biên bản đánh giá kỹ thuật thiết bị
                    </Text>
                </View>

                {/* THÔNG TIN CHUNG */}
                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        I. Thông tin chung
                    </Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Mã phiếu:
                        </Text>
                        <Text style={styles.value}>
                            {data.technicalCode}
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
                            Người đánh giá:
                        </Text>
                        <Text style={styles.value}>
                            {assessor}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Hệ thống:
                        </Text>
                        <Text style={styles.value}>
                            {system}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Thiết bị:
                        </Text>
                        <Text style={styles.value}>
                            {equipment}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Vật tư thay thế:
                        </Text>
                        <Text style={styles.value}>
                            {sparePart}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>
                            Trạng thái:
                        </Text>

                        <Text
                            style={[
                                styles.value,
                                getStatusStyle(),
                            ]}
                        >
                            {getStatusLabel()}
                        </Text>
                    </View>

                </View>

                {/* KẾT QUẢ */}
                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        II. Kết quả đánh giá
                    </Text>

                    <View style={styles.contentBox}>
                        <Text>
                            {data.result}
                        </Text>
                    </View>

                </View>

                {/* MÔ TẢ */}
                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        III. Đề xuất xử lý
                    </Text>

                    <View style={styles.contentBox}>
                        <Text>
                            {data.description}
                        </Text>
                    </View>

                </View>





            </Page>
            {/* ẢNH MINH CHỨNG */}
            {images.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <Text style={styles.title}>
                        ẢNH MINH CHỨNG
                    </Text>

                    <View style={styles.imageGrid}>
                        {images.map((img, index) => (
                            <View
                                key={index}
                                style={styles.imageCard}
                                wrap={false}
                            >
                                <View style={styles.imageWrapper}>
                                    <Image
                                        src={img}
                                        style={styles.image}
                                    />
                                </View>

                                <Text style={styles.imageCaption}>
                                    Ảnh hiện trạng #{index + 1}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Text
                        fixed
                        style={styles.footer}
                    >
                        Hệ thống quản lý bảo trì nhà máy nhiệt điện
                    </Text>
                </Page>
            )}

            {/* KÝ TÊN */}
            <Page
                size="A4"
                style={styles.page}
                wrap={false}
            >
                <View
                    style={{
                        marginTop: 120,
                        alignItems: "center",
                        marginBottom: 60,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "bold",
                        }}
                    >
                        XÁC NHẬN VÀ KÝ DUYỆT
                    </Text>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 80,
                    }}
                >
                    <View
                        style={{
                            width: "40%",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "bold" }}>
                            Người đánh giá
                        </Text>

                        <Text style={{ marginTop: 80 }}>
                            {assessor}
                        </Text>
                    </View>

                    <View
                        style={{
                            width: "40%",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "bold" }}>
                            Trưởng bộ phận
                        </Text>

                        <Text style={{ marginTop: 80 }}>
                            __________________
                        </Text>
                    </View>
                </View>

                <Text
                    fixed
                    style={styles.footer}
                >
                    Hệ thống quản lý bảo trì nhà máy nhiệt điện
                </Text>
            </Page>

        </Document>
    );
}