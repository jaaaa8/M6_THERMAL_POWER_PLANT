import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image
} from "@react-pdf/renderer";
import {
    Font
} from "@react-pdf/renderer";


import RobotoRegular
    from "../../assets/fonts/Roboto-Regular.ttf";


import RobotoBold
    from "../../assets/fonts/Roboto-Bold.ttf";
Font.register({
    family: "Roboto",
    fonts: [
        {
            src: RobotoRegular,
            fontWeight: 400
        },
        {
            src: RobotoBold,
            fontWeight: 700
        }
    ]
});
const styles = StyleSheet.create({

    page: {
        padding: 35,
        fontSize: 10,
        fontFamily: "Roboto"
    },

    title: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "bold"
    },


    section: {
        marginBottom: 15
    },


    sectionTitle: {
        fontSize: 13,
        marginBottom: 8,
        fontWeight: "bold"
    },


    table: {
        borderWidth: 1,
        borderColor: "#555"
    },


    row: {
        flexDirection: "row"
    },


    cell: {
        padding: 5,
        borderRightWidth: 1,
        borderBottomWidth: 1
    },


    label: {
        width: "35%",
        fontWeight: "bold"
    },


    value: {
        width: "65%"
    },


    image: {
        width: 120,
        height: 100,
        marginBottom: 10
    },


    smallImage: {
        width: 80,
        height: 70,
        marginRight: 10
    }


});



export default function EquipmentPdf({
    equipment
}) {


    return (

        <Document>
            <Page
                size="A4"
                style={styles.page}
            >
                <Text style={styles.title}>
                    HỒ SƠ THIẾT BỊ
                </Text>
                {/* IMAGE */}

                <View style={styles.section}>

                    <Text style={styles.sectionTitle}>
                        1. HÌNH ẢNH THIẾT BỊ
                    </Text>
                    <View
                        style={{
                            flexDirection: "row"
                        }}
                    >
                        {
                            equipment.imageUrls?.map(
                                (img, index) => (

                                    <Image
                                        key={index}
                                        src={img}
                                        style={styles.smallImage}
                                    />
                                ))
                        }
                    </View>
                </View>
                {/* GENERAL */}
                <Text style={styles.sectionTitle}>
                    2. THÔNG TIN CHUNG
                </Text>
                <View style={styles.table}>
                    <Row
                        label="Mã KKS"
                        value={equipment.kksCode}
                    />
                    <Row
                        label="Tên thiết bị"
                        value={equipment.name}
                    />
                    <Row
                        label="Hệ thống"
                        value={equipment.systemName}
                    />
                    <Row
                        label="Loại thiết bị"
                        value={equipment.equipmentTypeName}
                    />
                    <Row
                        label="Trạng thái"
                        value={equipment.status}
                    />
                    <Row
                        label="Model"
                        value={equipment.model}
                    />
                    <Row
                        label="Nhà sản xuất"
                        value={equipment.manufacturer}
                    />
                    <Row
                        label="Năm hoạt động"
                        value={equipment.installationYear}
                    />
                    <Row
                        label="Mô tả"
                        value={equipment.description}
                    />
                </View>
                {/* PARAMETER */}

                <Text style={{ ...styles.sectionTitle, marginTop: "20px" }}>
                    3. THÔNG SỐ KỸ THUẬT
                </Text>
                <View style={styles.table}>
                    {
                        equipment.technicalParameters?.map(
                            (param, index) => (
                                <View key={index}>
                                    <Row
                                        label={param.name}
                                        value={
                                            `${param.value || ""} ${param.unit?.map(u => u.name).join(",")}`
                                        }
                                    />
                                </View>
                            ))
                    }
                </View>
                {/* REPAIR */}
                <Text style={{ ...styles.sectionTitle, marginTop: "20px" }}>
                    4. LỊCH SỬ SỬA CHỮA
                </Text>
                {
                    equipment.repairHistories?.map(
                        (item, index) => (
                            <View
                                key={index}
                                style={{
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    padding: 5
                                }}
                            >
                                <Row
                                    label="Ngày sửa chữa"
                                    value={item.repairDate}
                                />
                                <Row
                                    label="Nội dung"
                                    value={item.repairContent}
                                />
                                <Row
                                    label="Kết quả"
                                    value={item.repairResult}
                                />
                                {
                                    item.details?.length > 0 && (

                                        <View>

                                            <Text>
                                                Phụ tùng:
                                            </Text>


                                            {
                                                item.details.map((p) => (
                                                    <Text key={p.id}>
                                                        - {p.sparePartName}
                                                        ({p.quantity} {p.unitName})
                                                    </Text>
                                                ))
                                            }
                                        </View>
                                    )
                                }
                            </View>
                        ))
                }
                {/* MAINTENANCE */}
                {/* MAINTENANCE */}
                <Text style={styles.sectionTitle}>
                    5. LỊCH SỬ BẢO DƯỠNG
                </Text>

                {
                    equipment.maintenanceHistories?.map((item, index) => (
                        <View
                            key={index}
                            style={{
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: "#555",
                                padding: 5
                            }}
                        >
                            <Row
                                label="Lần bảo dưỡng"
                                value={`${index + 1}`}
                            />
                            <Row
                                label="Ngày"
                                value={item.performedDate}
                            />
                            <Row
                                label="Nội dung"
                                value={item.notes}
                            />
                        </View>
                    ))
                }
            </Page>
        </Document>
    )
}


function Row({
    label,
    value
}) {
    return (

        <View
            style={styles.row}
        >
            <Text
                style={[
                    styles.cell,
                    styles.label
                ]}
            >
                {label}

            </Text>
            <Text
                style={[
                    styles.cell,
                    styles.value
                ]}
            >
                {value || ""}

            </Text>

        </View>
    )

}