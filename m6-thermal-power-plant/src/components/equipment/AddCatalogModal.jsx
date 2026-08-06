import { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Button,
    Dropdown
} from "react-bootstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";

import * as catalogService from "../../services/equipment/catalogService";
import * as unitService from "../../services/equipment/unitService";

export default function AddCatalogModal({
    show,
    onHide,
    onSuccess
}) {

    const [unitsList, setUnitsList] = useState([]);

    useEffect(() => {

        if (show) {

            loadUnits();

        }

    }, [show]);

    const loadUnits = async () => {

        try {

            const res = await unitService.getAll(0, 1000);

            setUnitsList(res.data.content);

        } catch {

            toast.error("Không thể tải danh sách đơn vị");

        }

    };

    const schema = Yup.object({

        name: Yup.string()
            .trim()
            .required("Tên thông số không được để trống")
            .max(100),

        description: Yup.string()
            .max(255),

        units: Yup.array()
            .min(1, "Phải chọn ít nhất một đơn vị")

    });

    const formik = useFormik({

        initialValues: {

            name: "",

            description: "",

            units: []

        },

        validationSchema: schema,

        onSubmit: async (values, { resetForm }) => {

            try {

                await catalogService.create(values);

                toast.success("Thêm thông số thành công");

                resetForm();

                onHide();

                if (onSuccess) {

                    onSuccess();

                }

            } catch {

                toast.error("Thêm thất bại");

            }

        }

    });

    return (

        <Modal
            show={show}
            onHide={onHide}
            centered
        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Thêm thông số

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Tên thông số

                    </Form.Label>

                    <Form.Control
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isInvalid={
                            formik.touched.name &&
                            !!formik.errors.name
                        }
                    />

                    <Form.Control.Feedback type="invalid">

                        {formik.errors.name}

                    </Form.Control.Feedback>

                </Form.Group>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Đơn vị áp dụng

                    </Form.Label>

                    <Dropdown autoClose="outside">

                        <Dropdown.Toggle
                            className="w-100 text-start"
                            variant="outline-secondary"
                        >

                            {
                                formik.values.units.length

                                    ? formik.values.units
                                        .map(x => x.name)
                                        .join(", ")

                                    : "Chọn đơn vị"

                            }

                        </Dropdown.Toggle>

                        <Dropdown.Menu className="w-100 p-2">

                            {

                                unitsList.map(unit => (

                                    <Form.Check

                                        key={unit.id}

                                        type="checkbox"

                                        label={unit.name}

                                        checked={
                                            formik.values.units.some(
                                                u => u.id === unit.id
                                            )
                                        }

                                        onChange={(e) => {

                                            if (e.target.checked) {

                                                formik.setFieldValue(

                                                    "units",

                                                    [

                                                        ...formik.values.units,

                                                        unit

                                                    ]

                                                );

                                            } else {

                                                formik.setFieldValue(

                                                    "units",

                                                    formik.values.units.filter(

                                                        u => u.id !== unit.id

                                                    )

                                                );

                                            }

                                        }}

                                    />

                                ))

                            }

                        </Dropdown.Menu>

                    </Dropdown>

                </Form.Group>

                <Form.Group>

                    <Form.Label>

                        Mô tả

                    </Form.Label>

                    <Form.Control

                        as="textarea"

                        rows={3}

                        name="description"

                        value={formik.values.description}

                        onChange={formik.handleChange}

                    />

                </Form.Group>

            </Modal.Body>

            <Modal.Footer>

                <Button
                    variant="secondary"
                    onClick={onHide}
                >

                    Hủy

                </Button>

                <Button
                    onClick={formik.handleSubmit}
                >

                    Thêm

                </Button>

            </Modal.Footer>

        </Modal>

    );

}