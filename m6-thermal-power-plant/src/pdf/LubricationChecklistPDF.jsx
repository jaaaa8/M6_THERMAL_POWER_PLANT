import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";

import {
    Font,
} from "@react-pdf/renderer";

import RobotoFont
    from "../assets/fonts/Roboto-Regular.ttf";

Font.register({
    family: "Roboto",
    src: RobotoFont,
});

const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: "Roboto",
        fontSize: 10,
    },

    title: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 20,
    },

    tableHeader: {
        flexDirection: "row",
        border: 1,
        backgroundColor: "#eeeeee",
    },

    row: {
        flexDirection: "row",
        borderLeft: 1,
        borderRight: 1,
        borderBottom: 1,
    },

    cell: {
        padding: 5,
        fontSize: 9,
    },
});

export default function LubricationChecklistPDF({
                                                    equipments,
                                                }) {

    return ( <Document>

        ```
        <Page
            size="A4"
            style={styles.page}
        >

            <Text style={styles.title}>
                CHECKLIST BẢO DƯỠNG DẦU MỠ
            </Text>

            <View style={styles.tableHeader}>
                <Text
                    style={[
                        styles.cell,
                        { width: "6%" },
                    ]}
                >
                    STT
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "12%" },
                    ]}
                >
                    Mã TB
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "26%" },
                    ]}
                >
                    Thiết bị
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "20%" },
                    ]}
                >
                    Dầu/Mỡ
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "10%" },
                    ]}
                >
                    SL
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "14%" },
                    ]}
                >
                    Đến hạn
                </Text>

                <Text
                    style={[
                        styles.cell,
                        { width: "12%" },
                    ]}
                >
                    Thực hiện
                </Text>
            </View>

            {equipments.map(
                (item, index) => (
                    <View
                        key={item.id}
                        style={styles.row}
                    >
                        <Text
                            style={[
                                styles.cell,
                                { width: "6%" },
                            ]}
                        >
                            {index + 1}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "12%" },
                            ]}
                        >
                            {item.equipmentCode}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "26%" },
                            ]}
                        >
                            {item.equipmentName}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "20%" },
                            ]}
                        >
                            {item.lubricantType}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "10%" },
                            ]}
                        >
                            {item.quantity}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "14%" },
                            ]}
                        >
                            {item.nextDueDate}
                        </Text>

                        <Text
                            style={[
                                styles.cell,
                                { width: "12%" },
                            ]}
                        >
                            □
                        </Text>
                    </View>
                )
            )}

        </Page>

    </Document>


);
}
