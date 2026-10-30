# BrewLite – Requirements to Deployment (Assignment 2)

**Môn học:** Công nghệ Phần mềm – Học kỳ I (2026–2027)  
**Trường:** Đại học Sài Gòn (SGU) – Khoa Công nghệ Thông tin  
**Ngăn xếp kỹ thuật bắt buộc:** Next.js (Mobile-first / PWA), NestJS, Layered Architecture , PostgreSQL (Prisma ORM) và Docker.

---

## 1. Giới thiệu Dự án & Phạm vi Sản phẩm

**BrewLite** là ứng dụng web đặt đồ uống trực tuyến theo hướng **Mobile-first / PWA**, giải quyết bài toán xếp hàng giờ cao điểm, sai sót khi ghi nhận tùy biến món (Size/Topping) thủ công, xung đột tồn kho khi nhiều khách đặt cùng lúc, rủi ro trừ tiền trùng lặp khi thanh toán và tăng cường giữ chân khách hàng qua chính sách tích điểm thưởng.

**Luồng nghiệp vụ cốt lõi (End-to-End):**
> `Xem menu` → `Chọn tùy chọn (Size/Topping)` → `Giỏ hàng & Khuyến mãi` → `Đặt đơn (Khóa tồn kho đồng thời)` → `Thanh toán mô phỏng (Idempotency-Key)` → `Biên nhận & Theo dõi đơn` → `Tích lũy & Đổi điểm thưởng (Loyalty)`

---

## 2. Phân công Nhóm Phát triển (7 Thành viên – 7 Chức năng & Đầy đủ Gói Sơ đồ UML)

Mỗi thành viên phụ trách **xuyên suốt 1 Module Chức năng** từ khâu Khai thác yêu cầu (FR/AC), **Vẽ trọn bộ Sơ đồ UML riêng của chức năng (Use Case, Activity, Sequence)**, Thiết kế Kiến trúc đến Hiện thực Code (Frontend View & Backend Controller/Service) và Kiểm thử, kết hợp với các nhiệm vụ hạ tầng kỹ thuật chung: <br>
📌 Lưu ý trong thư mục diagram tự tạo các folder tương ứng để chứa Sơ đồ tránh lộn xộn
| STT | Thành viên | Vai trò Scrum | Phân hệ Chức năng & Use Case Chi tiết (Mẫu chuẩn của Thầy)<br>(Bắt buộc: Use Case + Activity + Sequence) | Nhiệm vụ Dự án, Sơ đồ Hệ thống & Hạ tầng kiêm nhiệm<br>(Task 1 → Task 5) | Nhánh làm việc |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Phước** | Dev Team | **Chức năng 1 (`FR-01`, `FR-02`):** Phân hệ Thực đơn & Tìm kiếm đồ uống<br>•`Xem thực đơn đồ uống`<br>•📌 **Gói sơ đồ UML Module 1:**<br>• Use Case: `usecase-menu.puml` & `.svg`<br>• Activity: `activity-menu.puml` & `.svg`<br>• Sequence: `sequence-menu.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-menu-spec.md` | - **Database Seed Script:** Nạp 8–10 món nước, topping và danh mục mẫu (Task 4.3).<br>- **End-to-End Test (Playwright):** Kiểm thử luồng duyệt Menu & Xem chi tiết sản phẩm (Task 4.3, 5.2). | `phuoc` |
| **2** | **Khang** | Dev Team | **Chức năng 2 (`FR-03`):** Phân hệ Tùy biến món & Giỏ hàng<br>• **Use Case chính:** `Quản lý giỏ hàng` <br>📌 **Gói sơ đồ UML Module 2:**<br>• Use Case: `usecase-cart.puml` & `.svg`<br>• Activity: `activity-cart.puml` & `.svg`<br>• Sequence: `sequence-cart.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-cart-spec.md` | - **Unit Test (Jest):** Kiểm thử Zustand Store giỏ hàng, tùy biến topping và tính toán giỏ hàng (Task 5.2).<br>- **Domain Class Diagram:** Tổng hợp Sơ đồ lớp miền toàn hệ thống (`class-domain.puml` & `.svg`) (Task 2.3).<br>- Cấu hình Linter / Prettier / Code formatting monorepo (Task 4.1). | `khang` |
| **3** | **Hiệp** | Product Owner (PO) | **Chức năng 3 (`FR-04`):** Phân hệ Định danh & Xác thực tài khoản<br>• `Đăng nhập hệ thống`<br>• `Đăng ký tài khoản mới` <br>📌 **Gói sơ đồ UML Module 3:**<br>• Use Case: `usecase-auth.puml` & `.svg`<br>• Activity: `activity-auth.puml` & `.svg`<br>• Sequence: `sequence-auth.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-auth-spec.md` | - **Sơ đồ Use Case Tổng quát toàn hệ thống:** `use-case-system.puml` & `.svg` (Task 1.2).<br>- **Tài liệu Yêu cầu:** Soạn `context-and-scope.md` (Task 1.1) và SRS rút gọn `srs-summary.md` (Task 1.2).<br>- **Health Check:** API `GET /api/v1/health` (Task 5.2).<br>- **Quản lý Backlog & Truy vết:** Quản lý Issue Board & Lập Ma trận truy vết `traceability-matrix.md` (Mục 8). | `hiep` |
| **4** | **Phúc** | Dev Team | **Chức năng 4 (`FR-05`):** Phân hệ Khởi tạo Đơn hàng<br>•`Đặt đồ uống (Make Order)`<br>📌 **Gói sơ đồ UML Module 4:**<br>• Use Case: `usecase-order.puml` & `.svg`<br>• Activity: `activity-order.puml` & `.svg`<br>• Sequence: `sequence-order.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-checkout-spec.md` | - **Database Transaction & Row Lock (`SELECT FOR UPDATE`):** Ngăn chặn bán âm kho khi nhiều khách đặt cùng lúc (Task 4.3, 5.1).<br>- **Quản trị Repository & DUY NHẤT Phê duyệt PR:** Kiểm duyệt commit, conflict & duy nhất có thẩm quyền phê duyệt merge code thủ công vào `main` (Task 4.1). | `phuc` |
| **5** | **Nguyên** | Dev Team | **Chức năng 5 (`FR-06`, `NFR-01..04`):** Phân hệ Thanh toán trực tuyến mô phỏng<br>`Thanh toán đơn hàng (Pay Order)`<br>📌 **Gói sơ đồ UML Module 5:**<br>• Use Case: `usecase-payment.puml` & `.svg`<br>• Activity: `activity-payment.puml` & `.svg`<br>• Sequence: `sequence-payment.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-payment-spec.md` | - **Integration Test (Supertest):** Kiểm thử luồng Tạo đơn và Thanh toán có xử lý Idempotency (Task 5.2).<br>- **Cơ chế Idempotency-Key:** Chống trừ tiền trùng lặp khi mạng chậm hoặc khách nhấn nhiều lần (Task 4.3).<br>- **Tài liệu Quyết định Kiến trúc (ADR):** Soạn thảo các quyết định kiến trúc (`docs/architecture/adr/`) và `architecture-overview.md` (Task 3.1). | `nguyen` |
| **6** | **Tuấn Thành** | Scrum Master (SM) | **Chức năng 6 (`FR-07`, `FR-08`):** Phân hệ Theo dõi & Lịch sử đơn hàng<br>•`Xem danh sách lịch sử đơn hàng`<br>• <br>📌 **Gói sơ đồ UML Module 6:**<br>• Use Case: `usecase-order-history.puml` & `.svg`<br>• Activity: `activity-order-history.puml` & `.svg`<br>• Sequence: `sequence-order-history.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-order-history-spec.md` | - **Activity Diagram Tổng thể:** Thiết kế sơ đồ hoạt động End-to-End toàn hệ thống với swimlane (`activity-checkout.puml` & `.svg`) (Task 2.1).<br>- **Dockerization Local:** Cấu hình `docker-compose.yml` chạy đồng bộ Web, API, Postgres (Task 5.2).<br>- **Điều phối Scrum & Biên bản họp:** Tổ chức họp Scrum, soạn biên bản Sprint Review & Sprint Retrospective (Task 5.4). | `tuan-thanh` |
| **7** | **Mai Thành** | Dev Team | **Chức năng 7 (`FR-10`):** Phân hệ Quầy Pha chế & Điểm thưởng Loyalty<br>`Cập nhật tiến độ pha chế (Barista Board / KDS)`<br>• 📌 **Gói sơ đồ UML Module 7:**<br>• Use Case: `usecase-loyalty.puml` & `.svg`<br>• Activity: `activity-loyalty.puml` & `.svg`<br>• Sequence: `sequence-loyalty.puml` & `.svg`<br>• Đặc tả: `docs/requirements/usecase-loyalty-spec.md` | - **UML Deployment Diagram:** Thiết kế sơ đồ triển khai Production (`docs/diagrams/deployment.puml` & `.svg`) & tài liệu `docs/deployment.md` (Task 3.2).<br>- **Cloud Production Deployment:** Triển khai hệ thống lên Cloud có HTTPS (Frontend Vercel, Backend API, Database Postgres) (Task 5.4).<br>- **Video Demo:** Quay video clip demo trực tiếp luồng End-to-End (<= 5 phút) (Task 5.4).<br>- Tổng hợp Báo cáo đồ án (`.docx`) & kiểm tra checklist nộp bài. | `mai-thanh` |

### 2.1 Quy định Gói Hồ sơ Sơ đồ UML Bắt buộc (7 Use Cases, 7 Activity, 7 Sequence)
Theo yêu cầu thực tế của Giảng viên để đánh giá chi tiết đóng góp của từng cá nhân trong nhóm 7 người:
1. **Tính độc lập & toàn diện:** Mặc dù tài liệu mẫu yêu cầu tối thiểu 1 use case trọng tâm (Checkout), nhóm thực hiện **đầy đủ trọn bộ đặc tả và 3 loại sơ đồ (Use Case, Activity, Sequence) cho cả 7 chức năng**.
2. **Quy chuẩn lưu trữ sơ đồ (`docs/diagrams/`):** Mỗi sơ đồ bắt buộc phải có đủ **tệp mã nguồn PlantUML (`.puml`)** và **ảnh kết xuất định dạng vector (`.svg`)**.
3. **Quy chuẩn đặc tả (`docs/requirements/`):** Mỗi chức năng có 1 file Markdown đặc tả chi tiết gồm: Tên Use Case, Actor, Trigger, Tiền điều kiện, Hậu điều kiện, Luồng sự kiện chính (Main Flow), Luồng phụ/thay thế (Alternative Flows) và Luồng ngoại lệ (Exception Flows).
4. **Nhánh làm việc:** Thành viên vẽ sơ đồ và viết đặc tả trên chính **nhánh cá nhân** của mình (`phuoc`, `khang`, `hiep`, `phuc`, `nguyen`, `tuan-thanh`, `mai-thanh`) trước khi tạo PR gửi Phúc kiểm tra và phê duyệt merge vào `main`.

---

## 3. Cấu trúc Repository (Chuẩn Mục 9 – Assignment 2)

```text
brewlite/
|-- apps/
|   |-- web/                         # [VIEW] Next.js mobile-first/PWA
|   `-- api/                         # [CONTROLLER & MODEL] NestJS Modular MVC
|-- docs/
|   |-- requirements/                # Task 1: context-and-scope.md, srs-summary.md, usecase-checkout-spec.md
|   |-- diagrams/                    # Task 1, 2, 3: Tệp nguồn PlantUML (.puml) và ảnh kết xuất (.svg)
|   |-- architecture/                # Task 3: architecture-overview.md và thư mục adr/
|   |-- pull-request-guidelines.md   # Hướng dẫn chi tiết đặt tên nhánh, commit & quy trình merge code
|   |-- traceability-matrix.md       # Mục 8: Ma trận truy vết bắt buộc (FR -> UC -> Diagram -> Code -> Test)
|   `-- deployment.md                # Task 3.2: Mô tả triển khai Production
|-- tests/                           # Task 5.2: Integration tests & Playwright E2E tests
|-- .github/                         # Cấu hình GitHub Actions và PR Template
|   |-- workflows/ (ci.yml, cd.yml)
|   `-- pull_request_template.md
|-- docker-compose.yml               # Khởi chạy đồng bộ Web, API và PostgreSQL ở local
|-- .env.example                     # Mẫu cấu hình biến môi trường
`-- README.md                        # Tài liệu hướng dẫn, quy ước làm việc & Sprint Review/Retrospective
```

---

## 4. Chiến lược Branch, Pull Request, Quy ước Commit & Definition of Done (Task 4.1 & 4.2)

### 4.1 Quy tắc thực hiện tuần tự
Toàn bộ dự án tuân thủ nghiêm ngặt quy tắc thực hiện tuần tự của đề bài:
> **`Task 1 (Yêu cầu)` → `Task 2 (Mô hình hóa)` → `Task 3 (Kiến trúc)` → `Task 4 (MVP Sprint 1)` → `Task 5 (MVP Sprint 2 & Production)`**

### 4.2 Chiến lược Nhánh theo Tên Thành viên & Phân quyền Merge Độc quyền
- **Bảo vệ nhánh `main`:** Không thành viên nào được push trực tiếp vào `main`.
- **Nhánh làm việc cá nhân:** Mỗi thành viên làm việc trên nhánh mang chính **tên của mình**: `phuoc`, `khang`, `hiep`, `phuc`, `nguyen`, `tuan-thanh`, `mai-thanh`.
- **Phân quyền Merge độc quyền:** **Duy nhất Phúc (Quản lý Code & Phê duyệt PR)** có quyền review, kiểm duyệt code thủ công và bấm **Merge** vào nhánh `main`. Toàn bộ các thành viên khác (kể cả Mai Thành) chỉ tập trung phát triển (Dev) trên nhánh của mình và tuyệt đối không tự ý merge code.

### 4.3 Quy ước Commit bắt buộc phải ghi rõ ràng (Conventional Commits)
Nội dung commit phải phản ánh chính xác hành động và mã yêu cầu (tuyệt đối không dùng commit sơ sài như "update", "fix bug"):
* Cú pháp: `<type>(<scope>): <Mô tả chi tiết hành động>`
* Ví dụ:
  - `docs(diagrams): hoàn thành usecase-menu.puml và activity-menu.puml cho chức năng 1`
  - `docs(diagrams): thiết kế sequence-order.puml có database transaction và row lock`
  - `docs(requirements): hoàn thiện file đặc tả usecase-cart-spec.md cho giỏ hàng`
  - `docs(task1): cập nhật phạm vi MVP bổ sung chức năng loyalty`
  - `feat(FR-01): tạo API GET /products hỗ trợ query params lọc danh mục`
  - `feat(FR-03): tạo modal chọn size topping và đồng bộ giỏ hàng zustand`
  - `feat(FR-05): xử lý đặt đơn có Database Transaction và khóa dòng chống âm kho`
  - `feat(FR-06): tích hợp mock payment sinh Idempotency-Key chống thanh toán trùng`
  - `feat(FR-10): thêm API đổi điểm thưởng loyalty giảm tiền trực tiếp trên giỏ hàng`
  - `test(FR-05): viết unit test kịch bản rollback đơn hàng khi hết tồn kho`

### 4.4 Definition of Done (DoD)
Một PR chỉ được phê duyệt (`Merge`) khi thỏa mãn:
1. Nhánh làm việc đúng tên thành viên (`phuoc`, `khang`, `hiep`, `phuc`, `nguyen`, `tuan-thanh`, `mai-thanh`).
2. Lịch sử commit ghi rõ ràng, có gắn mã chức năng (`FR-xx` / `task-x`), không có commit sơ sài.
3. Không có conflict với nhánh `main`.
4. Không có file nhạy cảm (`.env`, secret, mật khẩu) bị đẩy nhầm lên repository.
5. Cập nhật mã tương ứng vào Ma trận truy vết `docs/traceability-matrix.md`.

---

## 5. Hướng dẫn Khởi chạy Dự án tại Local (Local Quickstart)

```bash
# 1. Clone repository và thiết lập biến môi trường
cp .env.example .env

# 2. Khởi chạy cơ sở dữ liệu PostgreSQL qua Docker Compose
docker-compose up -d postgres

# 3. Chạy Migration và nạp dữ liệu mẫu (Seed Data)
npm run db:migrate
npm run db:seed

# 4. Khởi chạy đồng thời Backend API và Frontend Web
npm run dev
```
- **Frontend Web (View):** `http://localhost:3000`
- **Backend API (Controller & Model):** `http://localhost:3001`
- **API Health Check:** `http://localhost:3001/api/v1/health`
