# M6 Thermal Power Plant — Frontend

![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple)

Giao diện web cho hệ thống quản lý bảo trì – vận hành nhà máy nhiệt điện (SCMS):
phiếu công tác, sửa chữa thiết bị, quản lý vật tư/công cụ, nhân sự, phân quyền
theo vai trò, thông báo real-time.

Backend tương ứng: [`M6_THERMAL_POWER_PLANT_API`](https://github.com/jaaaa8/M6_THERMAL_POWER_PLANT_API).

## Tech stack

- **React 19** + **Vite**
- **React Router**, **Bootstrap 5 / react-bootstrap**
- **Formik + Yup** cho form & validate
- **Axios** cho gọi API, **STOMP/SockJS** cho realtime (thông báo, cập nhật trạng thái)
- **jsPDF / @react-pdf/renderer** để xuất phiếu công tác PDF
- **Recharts** cho dashboard biểu đồ

## Cấu trúc thư mục

```
src/
├── pages/        # màn hình theo route
├── components/   # component theo domain (work_order, repair, equipment, hr, ...)
├── layouts/       # layout khung trang
├── services/      # gọi API theo domain
├── hooks/         # custom hook
├── pdf/           # sinh phiếu công tác PDF
└── utils/
```

## Chạy lần đầu

1. `cp .env.example .env`
2. `npm install`
3. `npm run dev`

Để `VITE_API_BASE_URL` trống là chạy được — request `/api/...` sẽ được Vite
proxy chuyển sang `http://localhost:8080`. Chỉ điền giá trị nếu backend máy bạn
chạy cổng khác.

**Không đặt secret vào biến `VITE_*`.** Vite nhúng giá trị vào bundle
`dist/*.js` lúc build, người dùng mở DevTools là đọc được. Secret chỉ nằm ở
backend.

Thêm biến mới thì cập nhật `.env.example` trong cùng PR, kèm mô tả — không kèm
giá trị thật. Tên biến frontend **bắt buộc** có tiền tố `VITE_`, nếu không Vite
bỏ qua và code đọc ra `undefined` mà không báo lỗi.

Quy ước đặt tên đầy đủ, cách khai báo biến mới, xử lý sự cố: xem
[`docs/BIEN_MOI_TRUONG.md`](https://github.com/jaaaa8/M6_THERMAL_POWER_PLANT_API/blob/main/docs/BIEN_MOI_TRUONG.md)
ở repo backend — tài liệu đó dùng chung cho cả 2 repo.

## Build & lint

```
npm run build     # build production
npm run preview   # xem thử bản build
npm run lint      # eslint
```

## Tài liệu

- [`docs/CHANGELOG.md`](../docs/CHANGELOG.md) — lịch sử thay đổi
