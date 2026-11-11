# TÀI LIỆU KIẾN TRÚC & CHIẾN LƯỢC TRIỂN KHAI PRODUCTION (DEPLOYMENT ARCHITECTURE & STRATEGY)
**Hệ thống:** Hệ thống Đặt Đồ Uống Trực Tuyến BrewLite (Mobile-first / PWA)  
**Giai đoạn:** Task 3.2 – Deployment Diagram & Task 5.4 – Cloud Production Deployment  
**Người phụ trách:** Mai Thành  
**Tệp sơ đồ liên kết:** `docs/diagrams/deployment.puml` & `docs/diagrams/deployment.svg`  
**Tài liệu tham chiếu:** `docs/requirements/srs-summary.md`, `docs/requirements/context-and-scope.md`, `.env.example`, `docker-compose.yml`  

---

## 1. Tổng quan Kiến trúc Triển khai & Nền tảng Thực tế

Hệ thống **BrewLite** được thiết kế và triển khai theo mô hình phân tách rõ **3 ranh giới môi trường (Local Development, CI/CD & Container Registry, Cloud Production)** trên các nền tảng đám mây thực tế:
* **Frontend & CDN (`apps/web`):** Triển khai trên **Vercel Edge Network & CDN**, phục vụ ứng dụng **Next.js (Mobile-first / PWA)** qua giao thức `HTTPS (TLS 1.3)`.
* **Container Registry:** Sử dụng **GitHub Container Registry (`ghcr.io`)** để lưu trữ và quản lý phiên bản Docker Image của Backend API (`ghcr.io/phuc280106/brewlite-api:latest`).
* **Backend API (`apps/api`):** Chạy dưới dạng **Docker Container (`node:20-alpine`)** trên dịch vụ **Render Web Service**, lắng nghe nội bộ tại cổng `3001` và được bọc HTTPS qua cổng `443`.
* **Cơ sở dữ liệu (`brewlite_db`):** Triển khai trên **Render Managed PostgreSQL 16** gắn kèm ổ đĩa lưu trữ bền vững (**Persistent SSD Volume** tại `/var/lib/postgresql/data`) và đặt hoàn toàn bên trong mạng nội bộ (**Render Private Network / Internal VPC**).

---

## 2. Sơ đồ Triển khai UML (UML Deployment Diagram – Task 3.2)

Sơ đồ dưới đây thể hiện đầy đủ 8 tiêu chí bắt buộc của **Mục 5.2 – Task 3.2**:
1. Thiết bị người dùng chạy trình duyệt / PWA (`Client Device`);
2. Dịch vụ / CDN phục vụ Next.js (`Vercel Edge Network & CDN`);
3. Container / dịch vụ chạy NestJS API (`Render Web Service - Docker Container`);
4. PostgreSQL có Persistent Storage (`Render Managed PostgreSQL 16 + Persistent SSD Volume`);
5. Container Registry (`ghcr.io`) và nền tảng triển khai (`Vercel` + `Render`);
6. Giao thức `HTTPS (TLS 1.3)`, kết nối nội bộ (`Internal TCP/IP + SSL`) và các cổng (`443`, `3001`, `5432`, `3000`);
7. Biến môi trường / Secrets (`.env`, `Vercel Env Vars`, `Render Secret Env Vars`), Health Check (`GET /api/v1/health`) và Log Stream (`Stdout/Stderr & Audit Log`);
8. Ranh giới tách biệt giữa **Local Development**, **CI/CD & Registry**, và **Cloud Production**.

![Sơ đồ Triển khai Hệ thống BrewLite](./diagrams/deployment.svg)

---

## 3. Bảng Truy vết Thành phần Triển khai đến Kiến trúc & Mã nguồn (Tiêu chí Nghiệm thu Task 3.2)

Bảng dưới đây ánh xạ trực tiếp **1-1** từng nút/container/dịch vụ trong `deployment.puml` tới thành phần kiến trúc, đường dẫn mã nguồn trong monorepo và mã yêu cầu (`FR`/`NFR`):

| STT | Container / Dịch vụ trên Deployment Diagram | Ranh giới Môi trường | Thành phần Kiến trúc tương ứng | Đường dẫn Mã nguồn / Cấu hình trong Repo | Yêu cầu Chức năng / Phi chức năng liên quan |
| :-: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Web Browser / PWA Runtime** (`Next.js Client Bundle` + `Zustand Store & LocalStorage`) | Client Tier | Presentation Layer (View & Client State Management) | • `web/` (`apps/web`)<br>• `cartStore.ts` (Zustand Store)<br>• `localStorage` (`brewlite-cart`, `accessToken`) | `FR-01`, `FR-02`, `FR-03`, `NFR-05` (Mobile-first / PWA) |
| **2** | **Docker Engine (`docker-compose.yml`)** (`web:3000`, `api:3001`, `postgres:5432`) | Ranh giới 1: Local Development | Local Multi-Container Runtime | • `docker-compose.yml`<br>• `.env.example` | `NFR-04` (`AC-NFR-04.3` – Khởi chạy đồng bộ bằng `docker-compose up -d`) |
| **3** | **GitHub Actions Runner** (`ci.yml`, `cd.yml` & `GitHub Secrets`) | Ranh giới 2: CI/CD | Automated Quality Gate & Continuous Deployment | • `.github/workflows/ci.yml`<br>• `.github/workflows/cd.yml` | `NFR-06` (Lint 0 lỗi), `NFR-07` (`AC-NFR-07.1` – CI/CD tự động 100% Pass) |
| **4** | **GitHub Container Registry (`ghcr.io`)** (`brewlite-api:latest`) | Ranh giới 2: CI/CD | Container Image Artifact Repository | • `api/Dockerfile`<br>• `.github/workflows/cd.yml` | `NFR-04`, `NFR-07` (Đóng gói bất biến giữa CI và Production) |
| **5** | **Vercel Edge Network & CDN** (`brewlite-web` Next.js App Router) | Ranh giới 3: Production | Cloud Frontend Hosting & Global Edge CDN | • `web/src/app/` (Pages: `/menu`, `/cart`, `/checkout`, `/orders`)<br>• `NEXT_PUBLIC_API_URL` | `NFR-01` (`LCP <= 2.5s`), `NFR-03` (`100% HTTPS TLS 1.3`) |
| **6** | **Render Web Service – Docker Container** (`brewlite-api` – Port `3001`) | Ranh giới 3: Production (Private VPC) | Application / Business Logic Layer (NestJS Modular MVC) | • `api/src/products/` (`FR-01`, `FR-02`)<br>• `api/src/auth/` (`FR-04`)<br>• `api/src/orders/` (`FR-05`, `FR-07`, `FR-08`, `FR-09`)<br>• `api/src/payments/` (`FR-06`)<br>• `api/src/loyalty/` (`FR-10`) | `FR-01` $\rightarrow$ `FR-10`, `NFR-01` (`API <= 500ms/1000ms`), `NFR-06`, `NFR-08` (Stateless JWT) |
| **7** | **Prisma ORM Client** (`Connection Pool & Migrate`) | Ranh giới 3: Production (API Container) | Data Access / Persistence Layer | • `api/prisma/schema.prisma`<br>• `api/prisma/migrations/`<br>• `api/prisma/seed.ts` | `NFR-02` (Parameterized Queries, Transaction), `NFR-03` (`AC-NFR-03.4` – Chống SQLi) |
| **8** | **Health Check & Log Stream** (`GET /api/v1/health` & `Stdout/Audit Log`) | Ranh giới 3: Production (API Container) | Observability, Readiness Probe & Audit Logging | • `api/src/health/` (`GET /api/v1/health`)<br>• NestJS Logger (`stdout`/`stderr`) | `NFR-04` (`AC-NFR-04.1` Uptime $\ge 99.5\%$, `AC-NFR-04.2` Healthcheck $\le 200\text{ms}$) |
| **9** | **Render Managed PostgreSQL 16 + Persistent SSD Volume** (`brewlite_db` – Port `5432`) | Ranh giới 3: Production (Private VPC) | Relational Database & Persistent Block Storage | • Bảng: `User`, `Category`, `Product`, `Size`, `Topping`, `Order`, `OrderItem`, `Payment`, `LoyaltyTransaction`<br>• Mount: `/var/lib/postgresql/data` | `NFR-02` (`SELECT FOR UPDATE` chống âm kho, `Idempotency-Key` 24h, `CHECK points >= 0`), `NFR-03` (Cô lập VPC) |

---

## 4. Đặc tả Giao thức Mạng, Cổng, Biến Môi trường (Secrets) & Giám sát

### 4.1. Giao thức kết nối và Cổng (Protocols & Ports)
* **Người dùng $\leftrightarrow$ Vercel CDN (`HTTPS / TLS 1.3 – Port 443`):** Phục vụ giao diện PWA, tài nguyên tĩnh và SSR HTML.
* **Người dùng $\leftrightarrow$ Render API (`HTTPS / TLS 1.3 – Port 443 -> Internal Port 3001`):** Giao tiếp RESTful API định dạng JSON. Đính kèm `Authorization: Bearer <JWT>` cho các route cần xác thực và `Idempotency-Key: <UUIDv4>` cho API thanh toán.
* **Render API $\leftrightarrow$ Render PostgreSQL (`Internal TCP/IP + SSL – Port 5432`):** Kết nối nội bộ trong **Render Private Network (VPC)**. Cổng `5432` bị khóa hoàn toàn với Internet bên ngoài.

### 4.2. Quản lý Biến Môi trường & Secrets (Ánh xạ từ `.env.example`)
Tuyệt đối không lưu file `.env` trong Git (`.gitignore`). Các biến môi trường được cấu hình tách biệt theo từng môi trường:
* **Trên Vercel (Frontend):**
  * `NEXT_PUBLIC_API_URL`: URL HTTPS của dịch vụ NestJS trên Render (`https://brewlite-api.onrender.com/api/v1`).
  * `NEXT_PUBLIC_APP_NAME`: `"BrewLite"`.
* **Trên Render (Backend API & Database):**
  * `DATABASE_URL`: Chuỗi kết nối nội bộ có SSL tới PostgreSQL (`postgresql://brewlite_user:***@dpg-xxx-a.singapore-postgres.render.com:5432/brewlite_db?schema=public`).
  * `API_PORT`: `3001`, `NODE_ENV`: `"production"`.
  * `JWT_SECRET`, `JWT_EXPIRES_IN`: Khóa bí mật ký token HS256 và thời hạn sống.
  * `CORS_ORIGIN`: Domain HTTPS chính thức của Vercel (`https://brewlite.vercel.app`).
  * `PAYMENT_MOCK_DELAY_MS`, `LOYALTY_POINT_RATE`, `LOYALTY_REDEEM_RATE`: Tham số cấu hình nghiệp vụ thanh toán và tích điểm.

### 4.3. Health Check & Logging trên Production
* **Health Check (`GET /api/v1/health`):** Render định kỳ gọi endpoint này mỗi 30 giây và ngay sau mỗi lần deploy mới để kiểm tra trạng thái kết nối Database (`{ "status": "ok", "database": "up", "timestamp": "..." }`). Nếu health check thất bại, Render tự động giữ nguyên container phiên bản cũ (Zero-downtime Rollback).
* **Logging (`Stdout/Stderr Stream`):** Mọi truy vấn lỗi, lịch sử khóa tồn kho và giao dịch thanh toán đều được NestJS xuất ra luồng chuẩn để Render Log Stream thu thập và phục vụ kiểm toán (Audit).
