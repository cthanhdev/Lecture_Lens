# 🌐 LectureLens Frontend — Modern Web Study Portal

Giao diện Web hiện đại của **LectureLens**, được xây dựng trên nền tảng **React 19**, **Vite 8**, **Tailwind CSS v4** và **Three.js / React Three Fiber** theo ngôn ngữ thiết kế **Pastel Stationery Study Companion**.

---

## 🚀 Công Nghệ Cốt Lõi (Tech Stack)

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Công Cụ Build**: [Vite 8](https://vitejs.dev/) với Hot Module Replacement (HMR) tức thì
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) + [Framer Motion](https://www.framer.com/motion/)
- **Đồ Họa 3D**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Kiểm Tra Mã Nguồn**: [oxlint](https://oxc.rs/) (Linter thế hệ mới dựa trên Rust)

---

## 🎨 Ngôn Ngữ Thiết Kế: Pastel Stationery

Mô phỏng không gian bàn học thân thuộc của sinh viên với bảng màu Pastel Stationery:
- `bg-stationery-canvas`: Giấy mỹ thuật ngà ấm (`#FFFAF5`)
- `primary-lavender`: Tím lavender nhận diện thương hiệu (`#6D5FD0`)
- `accent-sakura`: Hồng sakura trợ lý Cú Mèo (`#F875AA`)
- `accent-mint`: Xanh bạc hà biểu thị mốc thời gian (`#10B981`)
- `accent-sticky`: Vàng ghi chú Cornell (`#FFF1C9`)

---

## 📦 Lệnh Thao Tác (Scripts)

Thao tác trực tiếp từ thư mục `frontend/` (hoặc qua root `npm run <cmd>`):

```bash
# Khởi chạy máy chủ phát triển (Vite Dev Server tại localhost:5173)
npm run dev

# Kiểm tra kiểu dữ liệu TypeScript & đóng gói Production
npm run build

# Kiểm tra quy chuẩn mã nguồn siêu tốc với oxlint
npm run lint

# Xem trước bản đóng gói Production
npm run preview
```

---

## 📂 Cấu Trúc Thư Mục Frontend

```
frontend/
├── public/                 # Static assets, SVG icons, favicon
├── src/
│   ├── assets/             # Hình ảnh tĩnh, minh họa
│   ├── App.tsx             # Root Component & Interactive 3D Canvas
│   ├── index.css           # Cấu hình Tailwind CSS v4 (@import "tailwindcss")
│   └── main.tsx            # Điểm khởi chạy React DOM
├── .oxlintrc.json          # Cấu hình oxlint
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
├── tsconfig.app.json       # TypeScript config cho App code
├── tsconfig.node.json      # TypeScript config cho Vite config
├── tsconfig.json           # Solution tsconfig
└── vite.config.ts          # Vite configuration
```
