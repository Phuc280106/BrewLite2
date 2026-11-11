# ADR 001: Tổ chức Mã nguồn theo Monorepo và Kiến trúc Backend Modular Monolith (Layered Architecture)

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-15
* **Người phụ trách:** Khang (`khang`)
* **Liên kết yêu cầu / Thiết kế:** Task 3.1, Task 4.1, `class-domain.puml`

---

## 1. Bối cảnh (Context)
Dự án **BrewLite** được phát triển bởi nhóm 7 thành viên qua 2 Sprint với ngăn xếp kỹ thuật bắt buộc gồm: Frontend (`Next.js` theo hướng Mobile-first/PWA), Backend (`NestJS`) và cơ sở dữ liệu `PostgreSQL`. 

Nhóm cần một phương án tổ chức mã nguồn và cấu trúc Backend giải quyết được các vấn đề sau:
1. 7 thành viên phải làm việc song song trên các phân hệ khác nhau (Menu, Chi tiết sản phẩm, Giỏ hàng, Xác thực, Đặt đơn, Thanh toán, Lịch sử đơn) mà không gây xung đột mã nguồn.
2. Đảm bảo tính nhất quán giữa tài liệu thiết kế (`docs/`), mã nguồn (`apps/`) và kiểm thử tự động (`tests/`).
3. Thiết lập pipeline CI/CD (Lint, Unit Test, Build, Deploy) gọn nhẹ và dễ bảo trì.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1: Polyrepo (Tách nhiều kho mã nguồn riêng cho Frontend, Backend, Docs) + Microservices.**
2. **Phương án 2: Monorepo (`apps/web`, `apps/api`, `docs`, `tests`) + Modular Monolith theo Kiến trúc Phân lớp (Layered Architecture).**

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2**:
1. **Cấu trúc Monorepo:** Đặt toàn bộ dự án trong một repository duy nhất với cấu trúc chuẩn:
   - `apps/web/`: Ứng dụng Frontend Next.js (Presentation / View).
   - `apps/api/`: Ứng dụng Backend NestJS.
   - `docs/`: Tài liệu yêu cầu, sơ đồ UML (`.puml`, `.svg`), kiến trúc và ma trận truy vết.
   - `tests/`: Kiểm thử tích hợp (Integration) và End-to-End (Playwright).
2. **Kiến trúc Phân lớp chia theo Module (Modular Layered Architecture) tại Backend:**
   - Chia `apps/api` thành các Domain Module độc lập: `CatalogModule`, `CartModule`, `AuthModule`, `OrderModule`, `PaymentModule`, `PromotionModule`, `LoyaltyModule`.
   - Bên trong mỗi module tuân thủ nghiêm ngặt 3 tầng:
     - **Controller Layer:** Tiếp nhận HTTP Request, kiểm tra `JWT Guard` và kiểm tra hợp lệ dữ liệu qua `DTO ValidationPipe`.
     - **Service Layer:** Chứa toàn bộ logic nghiệp vụ cốt lõi.
     - **Data Access Layer (Prisma ORM):** Giao tiếp với PostgreSQL thông qua Prisma Client.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **Truy vết và đồng bộ dễ dàng:** Mọi thay đổi từ tài liệu yêu cầu, sơ đồ UML đến code Frontend/Backend đều nằm trong cùng một luồng Pull Request, đáp ứng quy tắc truy vết bắt buộc của đồ án.
* **Dùng chung công cụ kiểm soát chất lượng:** Dễ dàng cấu hình ESLint, Prettier và GitHub Actions CI/CD thống nhất cho toàn dự án.
* **Đảm bảo tính toàn vẹn giao dịch (ACID):** Các module nằm chung trên một tiến trình NestJS và kết nối tới cùng một cơ sở dữ liệu PostgreSQL, giúp thực hiện `Database Transaction` giữa `Order`, `OrderItem`, `Ingredient`, `Payment` và `LoyaltyTransaction` một cách trực tiếp mà không cần cơ chế Distributed Transaction (Saga/2PC) phức tạp như Microservices.

### Hạn chế & Đánh đổi (-)
* **Đánh đổi khả năng mở rộng độc lập (Independent Scaling):** Không thể scale riêng lẻ từng module nhỏ như kiến trúc Microservices mà phải scale toàn bộ container `apps/api`. Tuy nhiên, với quy mô của BrewLite, một khối NestJS API hoàn toàn đáp ứng tốt tải lượng truy cập.
* **Rủi ro xung đột Git:** Nhiều thành viên cùng đẩy code vào một repo dễ gây merge conflict. Nhóm khắc phục bằng cách phân tách rõ thư mục theo module, mỗi thành viên làm việc trên nhánh cá nhân riêng và chỉ định duy nhất một người (Phúc) kiểm duyệt, phê duyệt merge vào nhánh `main`.