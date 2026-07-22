import { Tabs, Tab } from "react-bootstrap";
import PageHeader from "../common/PageHeader";
import ManageUnits from "./ManageUnits";
import ManageParameterCatalog from "./ManageParameterCatalog";

export default function ManageParameterMaster() {

    return (

        <>
            <PageHeader
                title="Quản lý thông số kỹ thuật"
                subtitle="Quản lý danh mục thông số và đơn vị đo lường"
                breadcrumbs={[
                    { label: "Trang chủ", path: "/" },
                    { label: "Hệ thống & Thiết bị", path: "/equipment/system" },
                    { label: "Thiết bị", path: "/equipment/equipments" },
                    { label: "Quản lý thông số" }
                ]}
            />

            <Tabs
                defaultActiveKey="unit"
                className="mb-4"
            >

                <Tab
                    eventKey="unit"
                    title="Đơn vị"
                >
                    <ManageUnits />
                </Tab>

                <Tab
                    eventKey="catalog"
                    title="Danh mục thông số"
                >
                    <ManageParameterCatalog />
                </Tab>

            </Tabs>

        </>

    );
}