import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import {
    BsBoxArrowInRight,
    BsEye,
    BsEyeSlash,
} from "react-icons/bs";
import { toast } from "react-toastify";
import { authService } from "../services/authService";

export default function LoginPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] =
        useState(false);
    const [loading, setLoading] =
        useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {

            await authService.login(
                username,
                password
            );

            toast.success(
                "Đăng nhập thành công!"
            );

            navigate("/");

        } catch (error) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Sai tài khoản hoặc mật khẩu"
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <>
            <h2>Đăng nhập</h2>

            <Form onSubmit={handleSubmit}>

                <Form.Group className="mb-3">
                    <Form.Label>
                        Tên đăng nhập
                    </Form.Label>

                    <Form.Control
                        type="text"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                        required
                        autoFocus
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Label>
                        Mật khẩu
                    </Form.Label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >
                        <Form.Control
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            required
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                            style={{
                                position:
                                    "absolute",
                                right: "12px",
                                top: "50%",
                                transform:
                                    "translateY(-50%)",
                                background:
                                    "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                            }}
                        >
                            {showPassword ? (
                                <BsEyeSlash />
                            ) : (
                                <BsEye />
                            )}
                        </button>
                    </div>
                </Form.Group>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                >
                    {loading ? (
                        "Đang đăng nhập..."
                    ) : (
                        <>
                            <BsBoxArrowInRight className="me-2" />
                            Đăng nhập
                        </>
                    )}
                </Button>

            </Form>
        </>
    );
}