# Tổng quan Kiến trúc Hệ thống BrewLite (Task 3.1)

## 1. Phương pháp Tiếp cận Kiến trúc
Hệ thống **BrewLite** được thiết kế theo **Kiến trúc Phân lớp (Layered Architecture)** bên trong một **Monorepo** (`apps/web`, `apps/api`), kết hợp mô hình hóa kiến trúc theo **C4 Model** (System Context & Container):

* **Presentation Layer (`apps/web` - Next.js Mobile-first / PWA):** Phục vụ giao diện đặt đồ uống tối ưu cho thiết bị di động, quản lý trạng thái giỏ hàng tức thời bằng `Zustand Store` và giao tiếp với Backend qua giao thức HTTPS/RESTful API.
* **Application & Business Logic Layer (`apps/api` - NestJS Modular Monolith):** Tổ chức thành các module độc lập theo miền nghiệp vụ (`Catalog`, `Cart`, `Auth`, `Order`, `Payment`, `Promotion`, `Loyalty`). Mỗi module phân tách rõ 3 lớp: **Controller** (tiếp nhận request, kiểm tra JWT, validate DTO) $\rightarrow$ **Service** (xử lý nghiệp vụ, điều phối Transaction) $\rightarrow$ **Data Access** (Prisma ORM).
* **Data Storage Layer (`PostgreSQL`):** Hệ quản trị cơ sở dữ liệu quan hệ lưu trữ bền vững 14 thực thể miền (Domain Entities), đảm bảo tính toàn vẹn ACID và kiểm soát đồng thời.

---

## 2. Thiết kế Chi tiết Các Thành phần Bắt buộc

### 2.1. Frontend Next.js / PWA
* Xây dựng theo triết lý **Mobile-first** và hỗ trợ Progressive Web App (PWA) giúp khách hàng thao tác chọn món, tùy biến kích cỡ (`Size`), thêm `Topping` nhanh chóng trên trình duyệt điện thoại.
* Xử lý đầy đủ các trạng thái giao diện: `loading`, `empty`, `error` và quản lý giỏ hàng kết hợp (**Hybrid Cart**: lưu tạm trên `Zustand Store` khi chưa đăng nhập và đồng bộ xuống cơ sở dữ liệu khi đã đăng nhập).

### 2.2. Backend NestJS theo Module / Domain
Cấu trúc `apps/api` ánh xạ trực tiếp từ sơ đồ lớp miền (`class-domain.puml`):
1. **Catalog Module:** Cung cấp API `GET /products`, `GET /products/:id`, lọc theo `Category` và tính toán động số lượng khả dụng (`calculateAvailableStock`, `isInStock`) từ bảng công thức `RecipeItems` và nguyên liệu `Ingredient`.
2. **Cart Module:** Quản lý thực thể `Cart` và `CartItem`, tính tổng tiền tạm tính (`calculateTotal`).
3. **Auth Module:** Quản lý `User` (`passwordHash`, `role`), xử lý đăng ký, đăng nhập và bảo vệ API bằng `JWT Guard`.
4. **Order Module:** Xử lý khởi tạo đơn hàng (`POST /orders`), lưu vết giá lịch sử (`unitPrice`, `productName`) vào `OrderItem`, và thực thi **ACID Transaction kết hợp Khóa lạc quan (`version`)** trên bảng `Ingredient` (`deductStock`) để chống bán âm kho.
5. **Payment Module:** Tích hợp dịch vụ thanh toán mô phỏng (`Mock Payment Service`), kiểm tra khóa **`idempotencyKey`** chống trừ tiền trùng lặp và tự động gọi `restoreStock()` hoàn kho nếu thanh toán thất bại.
6. **Promotion & Loyalty Module:** Kiểm tra điều kiện mã giảm giá (`Promotion`) và quản lý tích lũy/quy đổi điểm thưởng (`Loyalty`, `LoyaltyTransaction` với hai loại giao dịch `EARN` và `REDEEM`).

### 2.3. Cơ sở dữ liệu PostgreSQL và Cơ chế Migration
* **Quản lý lược đồ (Schema & Migration):** Sử dụng **Prisma ORM** (`schema.prisma`) để định nghĩa toàn bộ bảng, khóa ngoại, chỉ mục và Enum (`OrderStatus`, `PaymentStatus`, `LoyaltyTransactionType`). Mọi thay đổi cấu trúc CSDL được quản lý phiên bản thông qua `Prisma Migrate` (`npm run db:migrate`).
* **Khởi tạo dữ liệu (Database Seeding):** Cung cấp kịch bản `npm run db:seed` tự động nạp dữ liệu mẫu cho danh mục, sản phẩm, kích cỡ, topping, nguyên liệu và công thức pha chế, đảm bảo môi trường Local, CI và Production có thể tái tạo đồng nhất.

### 2.4. Dịch vụ Thanh toán Mô phỏng (Mock Payment Service)
* Mô phỏng quy trình thanh toán qua Ví điện tử / Thẻ ngân hàng.
* Bắt buộc kiểm tra trường `idempotencyKey` trong bảng `Payment` trước khi thực thi giao dịch, đảm bảo nếu người dùng gửi lặp request do mạng chậm thì hệ thống chỉ xử lý thanh toán một lần duy nhất.

### 2.5. Logging, Health Check và Quản lý Cấu hình
* **Health Check:** Cung cấp endpoint `GET /api/v1/health` trả về trạng thái hoạt động của tiến trình API và kết nối PostgreSQL, được sử dụng bởi Docker Compose và bước Smoke Test sau khi triển khai Production.
* **Logging:** Ghi nhận nhật ký truy cập (HTTP Request Logging), nhật ký giao dịch đặt đơn/thanh toán và bắt lỗi tập trung qua Global Exception Filter.
* **Quản lý cấu hình:** Sử dụng `@nestjs/config` đọc cấu hình từ biến môi trường (`.env` ở local dựa trên `.env.example`, và GitHub Secrets / Cloud Environment Variables trên CI/Production). Tuyệt đối không đưa thông tin nhạy cảm lên kho mã nguồn.

---

## 3. Đánh giá Kiến trúc: Lý do chọn, Ưu điểm, Hạn chế và Trade-off

| Tiêu chí | Nội dung phân tích |
| :--- | :--- |
| **Lý do chọn kiến trúc** | Kiến trúc **Modular Monolith (Layered Architecture)** đặt trong **Monorepo** phù hợp tối ưu với nhóm 7 thành viên phát triển trong 2 Sprint: vừa phân chia ranh giới module rõ ràng cho từng thành viên, vừa đơn giản hóa việc kiểm thử tích hợp và triển khai CI/CD. |
| **Ưu điểm** | - **Tính toàn vẹn dữ liệu cao:** Thực thi ACID Transaction trực tiếp trên PostgreSQL xuyên suốt các bảng `Order`, `OrderItem`, `Ingredient`, `Payment` và `Loyalty`.<br>- **Truy vết 1-1 rõ ràng:** Từ yêu cầu (`FR`) $\rightarrow$ Sơ đồ (`Activity`, `Sequence`, `Class`) $\rightarrow$ Module/API $\rightarrow$ Kiểm thử.<br>- **Chi phí vận hành tối ưu:** Khởi chạy toàn bộ hệ thống ở local chỉ với một lệnh `docker-compose up` và triển khai Cloud gọn nhẹ. |
| **Hạn chế** | - Toàn bộ các module nghiệp vụ chạy chung trong một tiến trình NestJS API nên chưa thể mở rộng (scale) phần cứng độc lập cho riêng từng module nhỏ như kiến trúc Microservices. |
| **Sự đánh đổi (Trade-off)** | 1. **Monolith vs. Microservices:** Đánh đổi khả năng phân tán độc lập để lấy tốc độ phát triển, sự đơn giản trong vận hành CI/CD và tính nhất quán giao dịch ACID.<br>2. **Optimistic Locking (`version`) vs. Pessimistic Locking:** Đánh đổi việc một request đến trùng mili-giây có thể bị từ chối (`409 Conflict`) để lấy hiệu năng đọc không khóa dòng (non-blocking) và sự tương thích tự nhiên với Prisma ORM.<br>3. **Data Snapshot (`OrderItem`) vs. Chuẩn hóa tuyệt đối:** Chấp nhận dư thừa có kiểm soát trường `productName` và `unitPrice` trong `OrderItem` để bảo toàn bất biến lịch sử giá đơn hàng. |

---

## 4. Danh mục Hồ sơ Quyết định Kiến trúc (ADR Index)
Chi tiết từng quyết định kiến trúc quan trọng được lưu trữ trong thư mục `docs/architecture/adr/`:
* [ADR 001: Tổ chức Mã nguồn theo Monorepo và Kiến trúc Backend Modular Monolith](./adr/adr_001_monorepo.md)
* [ADR 002: Quản lý Tồn kho theo Công thức Nguyên liệu và Khóa Lạc quan (Optimistic Locking)](./adr/adr_002_optimistic_locking.md)
* [ADR 003: Chống Trừ tiền Trùng lặp bằng Idempotency-Key và Cơ chế Hoàn kho](./adr/adr_003_idempotency.md)
* [ADR 004: Quản lý Trạng thái Giỏ hàng Kết hợp (Hybrid Cart: Zustand Store & Database Cart)](./adr/adr_004_cart_zustand_store.md)
* [ADR 005: Lưu vết Dữ liệu Lịch sử Đơn hàng (Data Snapshot trên Order và OrderItem)](./adr/adr_005_data_snapshot_cartitem.md)
* [ADR 006: Xác thực Phi trạng thái (Stateless JWT Authentication) và Phân quyền theo Role](./adr/adr_006_jwt_auth.md)