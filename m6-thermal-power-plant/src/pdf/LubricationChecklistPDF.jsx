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

    footer:{
        marginTop:40,
        flexDirection:"row",
        justifyContent:"space-around",
        alignItems:"flex-start",
    },


    signBlock:{
        width:"30%",
        alignItems:"center",
    },


    signTitle:{
        fontSize:10,
        fontWeight:"bold",
        textAlign:"center",
    },


    signSpace:{
        height:60,
    },


    signNote:{
        fontSize:9,
        textAlign:"center",
    },

    page: {
        padding: 25,
        fontFamily: "Roboto",
        fontSize: 10,
        lineHeight: 1.4,
    },


    // ===== TABLE =====

    table: {
        borderWidth: 1,
        borderColor: "#333",
        marginTop: 5,
    },


    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#d9eaf7",
        borderBottomWidth: 1,
        borderColor: "#333",
        minHeight: 30,
        alignItems: "center",
    },


    row: {
        flexDirection: "row",
        minHeight: 32,
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#999",
    },


    cell: {
        padding: 5,
        fontSize: 9,
        borderRightWidth: 1,
        borderColor: "#999",
    },


    cellCenter:{
        textAlign:"center",
        padding:5,
        fontSize:9,
        borderRightWidth:1,
        borderColor:"#999",
    },


    lastCell:{
        borderRightWidth:0,
    },


    rowEven:{
        backgroundColor:"#f7f7f7",
    },

});

export default function LubricationChecklistPDF({
    equipments,
}) {

    return (<Document>
        <Page
            size="A4"
            style={styles.page}
        >

            <View style={styles.table}>

                <View style={styles.tableHeader}>

                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>
                        SCMS
                    </Text>

                    <Text style={styles.department}>
                        PHÒNG KỸ THUẬT - BẢO TRÌ
                    </Text>
                </View>

            </View>

            <Text style={styles.title}>
                CHECKLIST BẢO DƯỠNG DẦU MỠ
            </Text>

            <View style={styles.subInfo}>
                <Text>
                    Ngày lập:
                    {new Date().toLocaleDateString("vi-VN")}
                </Text>

                <Text>
                    Tổng thiết bị:
                    {equipments.length}
                </Text>
            </View>
            <View style={styles.tableHeader}>

                    <Text style={[styles.cellCenter,{width:"5%"}]}>
                        STT
                    </Text>

                    <Text style={[styles.cell,{width:"12%"}]}>
                        Mã TB
                    </Text>

                    <Text style={[styles.cell,{width:"25%"}]}>
                        Tên thiết bị
                    </Text>

                    <Text style={[styles.cell,{width:"18%"}]}>
                        Dầu/Mỡ
                    </Text>

                    <Text style={[styles.cellCenter,{width:"8%"}]}>
                        SL
                    </Text>

                    <Text style={[styles.cellCenter,{width:"12%"}]}>
                        Đến hạn
                    </Text>

                    <Text style={[
                        styles.cell,
                        styles.lastCell,
                        {width:"20%"}
                    ]}>
                        Ký xác nhận
                    </Text>

                </View>

                {equipments.map((item,index)=>(

                    <View
                        key={item.id}
                        style={[
                            styles.row,
                            index % 2 === 0 && styles.rowEven
                        ]}
                    >


                        <Text style={[
                            styles.cellCenter,
                            {width:"5%"}
                        ]}>
                            {index+1}
                        </Text>


                        <Text style={[
                            styles.cell,
                            {width:"12%"}
                        ]}>
                            {item.equipment?.equipmentCode}
                        </Text>


                        <Text style={[
                            styles.cell,
                            {width:"25%"}
                        ]}>
                            {item.equipment?.name}
                        </Text>


                        <Text style={[
                            styles.cell,
                            {width:"18%"}
                        ]}>
                            {item.consumable?.name}
                        </Text>


                        <Text style={[
                            styles.cellCenter,
                            {width:"8%"}
                        ]}>
                            {item.quantity}
                        </Text>


                        <Text style={[
                            styles.cellCenter,
                            {width:"12%"}
                        ]}>
                            {item.nextDueDate}
                        </Text>


                        <Text style={[
                            styles.cell,
                            styles.lastCell,
                            {width:"20%"}
                        ]}>
                        </Text>


                    </View>

                ))}



            </View>
            {/*<View style={styles.footer}>*/}


            {/*    <View style={styles.signBlock}>*/}

            {/*        <Text style={styles.signTitle}>*/}
            {/*            NGƯỜI LẬP*/}
            {/*        </Text>*/}

            {/*        <View style={styles.signSpace}/>*/}

            {/*        <Text style={styles.signNote}>*/}
            {/*            (Ký, ghi rõ họ tên)*/}
            {/*        </Text>*/}

            {/*    </View>*/}



            {/*    <View style={styles.signBlock}>*/}

            {/*        <Text style={styles.signTitle}>*/}
            {/*            NGƯỜI THỰC HIỆN*/}
            {/*        </Text>*/}

            {/*        <View style={styles.signSpace}/>*/}

            {/*        <Text style={styles.signNote}>*/}
            {/*            (Ký, ghi rõ họ tên)*/}
            {/*        </Text>*/}

            {/*    </View>*/}



            {/*    <View style={styles.signBlock}>*/}

            {/*        <Text style={styles.signTitle}>*/}
            {/*            QUẢN LÝ XÁC NHẬN*/}
            {/*        </Text>*/}

            {/*        <View style={styles.signSpace}/>*/}

            {/*        <Text style={styles.signNote}>*/}
            {/*            (Ký, ghi rõ họ tên)*/}
            {/*        </Text>*/}

            {/*    </View>*/}


            {/*</View>*/}

        </Page>


    </Document>


    );
}
