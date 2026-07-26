# M6 Thermal Power Plant — Frontend

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
`BIEN_MOI_TRUONG.md` ở gốc repo **backend** (`M6_THERMAL_POWER_PLANT_API`) —
tài liệu đó dùng chung cho cả 2 repo.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
