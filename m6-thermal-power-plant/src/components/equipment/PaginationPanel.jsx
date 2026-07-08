import { Button, Form } from "react-bootstrap";

export default function PaginationPanel({
    page,
    size,
    totalPages,
    totalElements,
    onPageChange,
    onSizeChange
}) {

    if (totalPages <= 1) return null;

    return (
        <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">

            <span className="small text-secondary">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)}
                {" "}của {totalElements} kết quả
            </span>

            <div className="d-flex align-items-center gap-3">

                <Form.Select
                    size="sm"
                    value={size}
                    onChange={(e) => onSizeChange(Number(e.target.value))}
                    style={{ width: "110px" }}
                >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                </Form.Select>

                <div className="d-flex gap-1">

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Trước
                    </Button>

                    {[...Array(totalPages)].map((_, i) => (
                        <Button
                            key={i}
                            size="sm"
                            variant={i === page ? "primary" : "outline-secondary"}
                            onClick={() => onPageChange(i)}
                        >
                            {i + 1}
                        </Button>
                    ))}

                    <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled={page === totalPages - 1}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Sau
                    </Button>

                </div>
            </div>
        </div>
    );
}