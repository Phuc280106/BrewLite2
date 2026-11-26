# BIÊN BẢN SPRINT REVIEW & SPRINT RETROSPECTIVE (TASK 5.4)

> **Dự án:** BrewLite 2.0 — Hệ thống đặt đồ uống trực tuyến (Mobile-first Web & API Monorepo)  
> **Học phần:** Kỹ nghệ phần mềm / Kiến trúc phần mềm  
> **Thời gian thực hiện:** Sprint 1 & Sprint 2  
> **Thành phần tham dự:** Toàn bộ thành viên nhóm phát triển (7 thành viên):
> - **Nguyễn Hoàng Phúc** (Team Lead — Phân hệ 5: Khởi tạo đơn & Khóa dòng tồn kho `FR-05`)
> - **Phạm Tuấn Thành** (Phân hệ 6: Trạng thái đơn `FR-07`, Lịch sử đơn `FR-08`, Docker & Migrations `Task 5.2`)
> - **Võ Tấn Nguyên** (Phân hệ 6: Thanh toán mô phỏng & Idempotency `FR-06`)
> - **Lê Mai Thanh** (Phân hệ 3: Giỏ hàng & Tùy biến món `FR-03`)
> - **Đỗ Phú Phước** (Phân hệ 1: Danh mục & Menu `FR-01`)
> - **Lê Trọng Khang** (Phân hệ 2: Chi tiết món & Topping `FR-02`)
> - **Nguyễn Trọng Hiệp** (Phân hệ 4 & 7: Xác thực `FR-04` & Tích điểm thành viên `FR-10`)

---

## PHẦN 1: BIÊN BẢN SPRINT REVIEW (PRODUCT REVIEW & DEMO)

### 1.1. Mục tiêu Sprint (Sprint Goals)
- **Sprint 1 (Khung kỹ thuật & Duyệt sản phẩm):**
  - Khởi tạo kiến trúc Modular Monolith trong Monorepo (`apps/api` NestJS và `apps/web` Next.js).
  - Hoàn thiện lược đồ cơ sở dữ liệu PostgreSQL (Prisma ORM) và bộ dữ liệu mẫu (Seed Data).
  - Bàn giao các tính năng duyệt menu, xem chi tiết món, tùy biến size/topping, quản lý giỏ hàng (`FR-01`, `FR-02`, `FR-03`) và xác thực người dùng (`FR-04`).
- **Sprint 2 (Giao dịch, Trạng thái đơn, Tích điểm & Đóng gói):**
  - Khởi tạo đơn hàng an toàn với Database Transaction và khóa dòng tồn kho `SELECT FOR UPDATE` (`FR-05`).
  - Xử lý thanh toán an toàn với cơ chế Idempotency Key chống trùng lặp giao dịch (`FR-06`).
  - Theo dõi tiến trình đơn hàng thời gian thực qua Order State Machine và biên nhận điện tử có mã QR/Barcode nhận món (`FR-07`).
  - Lịch sử đơn hàng cá nhân và hủy đơn hoàn kho (`FR-08`, `FR-12`).
  - Tích điểm thưởng thành viên tự động (`FR-10`).
  - Đóng gói toàn bộ hệ thống bằng Docker (`docker-compose.yml`) và thiết lập cơ chế Database Migration (`prisma/migrations/`) phục vụ triển khai (`Task 5.2`).

---

### 1.2. Bảng tổng kết bàn giao tính năng (Feature Delivery Status)

| Mã FR | Tên chức năng | Phụ trách | Trạng thái | Minh chứng kỹ thuật & Kiểm thử |
| :---: | :--- | :--- | :---: | :--- |
| **FR-01** | Danh mục & Thực đơn | Đỗ Phú Phước | **DONE** | API `GET /categories`, `GET /products`; UI Menu phân loại tab; Responsive Figma. |
| **FR-02** | Chi tiết món & Topping | Lê Trọng Khang | **DONE** | Modal chi tiết, chọn size (M, L), chọn nhiều topping, tính giá động theo thời gian thực. |
| **FR-03** | Giỏ hàng & Tùy biến | Lê Mai Thanh | **DONE** | Store Zustand (`useCartStore.ts`), snapshot cấu hình món; Unit tests (6/6 pass). |
| **FR-04** | Xác thực JWT & Phân quyền | Nguyễn Trọng Hiệp | **DONE** | API Auth (`/auth/login`, `/auth/register`), JWT Auth Guard; Unit tests (10/10 pass). |
| **FR-05** | Khởi tạo đơn & Khóa kho | Nguyễn Hoàng Phúc | **DONE** | API `POST /orders`, Transaction + Khóa dòng `SELECT ... FOR UPDATE`; Unit tests (4/4 pass). |
| **FR-06** | Thanh toán & Idempotency | Võ Tấn Nguyên | **DONE** | API `POST /payments`, header `Idempotency-Key` (UUID v4), tự hủy đơn quá hạn 15p; Unit tests (14/14 pass). |
| **FR-07** | Biên nhận & Trạng thái đơn | Phạm Tuấn Thành | **DONE** | API `PATCH /orders/:id/status`, Order State Machine (`assertTransition`), Stepper 5 bước, mã QR/Barcode. |
| **FR-08** | Lịch sử đơn & Hủy hoàn kho | Phạm Tuấn Thành | **DONE** | API `GET /orders/me`, `PATCH /orders/:id/cancel` hoàn kho tự động; Unit tests (38/38 pass). |
| **Task 5.2**| Docker & Prisma Migrations | Phạm Tuấn Thành | **DONE** | `docker-compose.yml` (Web + API + Postgres), Dockerfile 2 tầng, thư mục `prisma/migrations/`. |

---

### 1.3. Kịch bản Demo thực tế (End-to-End User Flow)
1. **Duyệt món & Tùy biến:** Khách hàng đăng nhập, chọn *Trà Sữa Oolong Nướng* (Size L, 50% đường, 50% đá, thêm Trân châu hoàng kim, Ghi chú *"Ít ngọt, giao tại quán"*).
2. **Quản lý giỏ hàng:** Sản phẩm được thêm vào giỏ hàng với giá tính toán chính xác gồm giá gốc + phụ thu size + giá topping.
3. **Tạo đơn hàng & Khóa kho:** Nhấn đặt hàng, API backend khởi tạo Transaction, khóa dòng kiểm tra nguyên liệu trà & sữa trong DB, trừ tồn kho an toàn chống bán âm.
4. **Thanh toán mô phỏng:** Chuyển sang màn hình thanh toán, client sinh `Idempotency-Key` gửi kèm. Giao dịch thành công, đơn chuyển trạng thái sang `PAID`.
5. **Theo dõi trạng thái & Biên nhận điện tử:**
   - Stepper 5 bước hiển thị trạng thái `Đã thanh toán` tách biệt với `Đang pha chế`.
   - Barista nhận đơn và cập nhật tiến trình qua API State Machine: `PAID -> PREPARING -> READY -> COMPLETED`. Mọi thao tác đi lùi hoặc nhảy cóc đều bị chặn lại với mã lỗi `400 Bad Request`.
   - Biên nhận hiển thị đầy đủ: Mã đơn hàng `#BL-XXXX`, mã nhận món `#8921`, mã QR + Barcode, danh sách món chi tiết kèm mức Đường, Đá, Ghi chú và hình thức nhận món.
   - Khi đơn ở trạng thái `PENDING` hoặc `PAID`, khách hàng có thể hủy đơn; hệ thống tự động hoàn kho nguyên liệu theo đúng định lượng.

---

### 1.4. Phản hồi từ Giảng viên / Reviewer & Kết quả cải tiến

| Nội dung phản hồi | Hành động khắc phục của nhóm | Kết quả nghiệm thu |
| :--- | :--- | :---: |
| **Chặt chẽ hóa chuyển đổi trạng thái đơn** | Xây dựng Order State Machine với hàm `assertTransition` tại backend, ném `400 Bad Request` khi chuyển sai hoặc đi lùi. | **Đã hoàn thành** (24 unit tests chứng minh) |
| **Tách biệt `PAID` và `PREPARING` trên giao diện** | Nâng cấp `OrderStatusStepper` từ 4 bước lên 5 bước: `Chờ tiếp nhận -> Đã thanh toán -> Đang pha chế -> Sẵn sàng -> Hoàn tất`. | **Đã hoàn thành** (UI đồng bộ Figma) |
| **Gỡ bỏ dữ liệu giả (Mock Data)** | Gỡ bỏ hoàn toàn `DEMO_ORDERS_STORAGE_KEY` và các hàm mock local storage trong `apps/web/src/lib/orders.ts`. Gọi 100% qua NestJS API thật. | **Đã hoàn thành** (Client API thuần) |
| **Bổ sung Đường / Đá / Ghi chú trên Biên nhận** | Cập nhật kiểu dữ liệu `note`, `pickupMethod` và render trực quan trên `OrderReceiptView.tsx`. | **Đã hoàn thành** (Hiển thị đầy đủ) |
| **Đóng gói Docker Compose & Migrations** | Viết Dockerfile tối ưu multi-stage cho Web & API, hoàn thiện `docker-compose.yml` chạy 3 service và trích xuất `prisma/migrations/`. | **Đã hoàn thành** (Sẵn sàng chạy local) |

---

## PHẦN 2: BIÊN BẢN SPRINT RETROSPECTIVE (ĐÁNH GIÁ & CẢI TIẾN QUY TRÌNH)

### 2.1. What Went Well (Những điểm làm tốt)
1. **Kiến trúc Monorepo & Phân rã Module:**
   - Phân chia ranh giới module rõ ràng giữa 7 thành viên giúp giảm thiểu xung đột mã nguồn (merge conflict). Mỗi thành viên phụ trách trọn vẹn từ Backend, Database đến Frontend của phân hệ mình.
2. **Kỷ luật Git & Quy chuẩn Mã nguồn:**
   - Tuân thủ quy tắc Conventional Commits (`feat(...)`, `fix(...)`, `docs(...)`, `refactor(...)`).
   - Mọi Pull Request đều được kiểm tra nghiêm ngặt qua bộ kiểm thử tự động (Unit Test, Lint, Build) trước khi merge vào nhánh `main`.
3. **Tính toàn vẹn dữ liệu cao:**
   - Áp dụng các mẫu thiết kế kiến trúc chuẩn công nghiệp: Khóa dòng `SELECT FOR UPDATE` chống Race Condition, Idempotency Key chống trùng lặp thanh toán, State Machine bảo vệ vòng đời đơn hàng.
4. **Độ bao phủ kiểm thử cao:**
   - Đạt 100% test pass trên cả hai ứng dụng: 76/76 unit tests backend và 12/12 unit tests frontend.

---

### 2.2. What Could Be Improved (Những điểm cần cải thiện)
1. **Xử lý môi trường phát triển giả lập (Mock vs Real API):**
   - Ban đầu nhóm duy trì nhánh mock data trong frontend để hỗ trợ demo offline, dẫn đến việc chuyển đổi sang API thực tế phát sinh thêm công đoạn dọn dẹp mã nguồn.
2. **Kế hoạch triển khai Docker & Migration:**
   - Các tệp cấu hình Dockerfile và Migration được tạo ở cuối Sprint thay vì ngay từ đầu Sprint, dẫn đến việc kiểm thử môi trường container bị dồn áp lực về sau.
3. **Tự động hóa kiểm thử tích hợp (E2E Integration Test):**
   - Hiện tại các ca kiểm thử chủ yếu là Unit Test ở từng service riêng biệt; cần bổ sung thêm các bài test tích hợp liên hoàn (POST /orders -> POST /payments -> PATCH /status) bằng Supertest.

---

### 2.3. Action Items (Kế hoạch hành động cụ thể)

| STT | Kế hoạch hành động | Người phụ trách | Thời hạn | Tiêu chí hoàn thành (DoD) |
| :---: | :--- | :--- | :---: | :--- |
| **ACT-01** | Kiểm tra chạy thử toàn bộ hệ thống bằng lệnh `docker compose up --build` trên môi trường máy sạch. | Phạm Tuấn Thành | Ngay lập tức | 3 containers `postgres`, `api`, `web` khởi động thành công và liên lạc được với nhau. |
| **ACT-02** | Bổ sung Integration Test liên phân hệ (Task 5.2) bằng Supertest cho luồng Checkout -> Payment. | Võ Tấn Nguyên | Sprint 2 | Toàn bộ kịch bản test tích hợp chạy tự động và pass trong CI. |
| **ACT-03** | Rà soát Ma trận truy vết (`docs/traceability-matrix.md`) đảm bảo phản ánh 100% các FR đã hoàn thành. | Nguyễn Hoàng Phúc | Sprint 2 | Mọi FR đều được liên kết đầy đủ từ SRS, Diagram, Code đến Test. |
| **ACT-04** | Chuẩn bị slide thuyết trình và kịch bản demo bảo vệ đồ án kết thúc học phần. | Toàn đội (7 TV) | Trước ngày bảo vệ | Slide hoàn chỉnh, demo mượt mà không phát sinh lỗi bất ngờ. |

---

### 2.4. Kết luận của Nhóm phát triển
Toàn bộ nhóm đã phối hợp chặt chẽ, tôn trọng mã nguồn của nhau và đáp ứng đầy đủ các yêu cầu kỹ thuật của đề tài. Hệ thống **BrewLite 2.0** đã sẵn sàng cho giai đoạn kiểm thử nghiệm thu cuối cùng và đóng gói bàn giao sản phẩm.

**Xác nhận của đại diện nhóm:**  
*Nguyễn Hoàng Phúc (Team Lead) & Phạm Tuấn Thành (Kỹ sư phụ trách Task 5.2/5.4)*
