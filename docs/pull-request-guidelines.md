# QUY TẮC ĐẶT TÊN NHÁNH, COMMIT VÀ QUY TRÌNH MERGE CODE
**Dự án:** BrewLite – Requirements to Deployment (Assignment 2)  
**Môn học:** Công nghệ Phần mềm — ĐH Sài Gòn (SGU)  
**Nhóm sinh viên:** Phước, Khang, Hiệp, Phúc, Nguyên, Tuấn Thành, Mai Thành  
**Tệp:** `docs/pull-request-guidelines.md`

---

## 1. Nguyên tắc cốt lõi

1. **Nhánh `main` được bảo vệ tuyệt đối:** Không thành viên nào được push trực tiếp vào `main`.
2. **Phân quyền Merge độc quyền:** **Duy nhất Phúc (Quản lý Code & Phê duyệt PR)** có quyền kiểm tra, review code và bấm **Merge** vào nhánh `main`. Toàn bộ các thành viên khác chỉ tập trung phát triển (Dev) trên nhánh cá nhân, tuyệt đối không tự ý merge code.
3. **Tên nhánh đơn giản theo thành viên:** Mỗi thành viên sở hữu nhánh làm việc riêng mang tên mình.
4. **Commit bắt buộc phải ghi rõ ràng, chi tiết:** Tuyệt đối không chấp nhận các commit vô nghĩa như *"update"*, *"fix"*, *"done"*, *"test"*. Mọi commit phải ghi rõ làm chức năng nào (FR-xx), sửa tệp nào, logic gì.

---

## 2. Bảng Phân công Toàn diện (7 Thành viên – 7 Chức năng & Đầy đủ Gói Sơ đồ UML)
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

## 3. Quy ước Commit bắt buộc phải ghi rõ ràng (Commit Messages)

Vì tên nhánh đã đặt theo tên người, nên **nội dung Commit phải là nơi thể hiện rõ nhất bạn đã làm gì**.

### 3.1. Cú pháp Commit chuẩn:
```text
<loại-thay-đổi>(<mã-yêu-cầu-hoặc-task>): <Mô tả chi tiết hành động đã làm>
```

### 3.2. Các loại thay đổi (`type`):
* `feat`: Thêm chức năng mới (API mới, giao diện mới).
* `docs`: Viết tài liệu yêu cầu, vẽ sơ đồ `.puml`, cập nhật báo cáo, ADR.
* `fix`: Sửa lỗi logic, sửa bug giao diện, fix lỗi.
* `test`: Viết unit test, integration test, E2E test.
* `ci` / `chore`: Cấu hình Docker, script seed database, deployment.
* `refactor`: Tối ưu hóa, dọn dẹp code không làm đổi luồng chạy.

### 3.3. Ví dụ commit ĐẠT CHUẨN (Ghi rất rõ ràng):
* `docs(diagrams): hoàn thành usecase-menu.puml và activity-menu.puml cho chức năng 1`
* `docs(diagrams): thiết kế sequence-order.puml có database transaction và row lock`
* `docs(requirements): hoàn thiện file đặc tả usecase-cart-spec.md cho giỏ hàng`
* `docs(task1): cập nhật bảng phạm vi MVP bổ sung chức năng tích điểm loyalty`
* `docs(task2): hoàn thành sequence diagram thanh toán có xử lý idempotency`
* `docs(task3): viết tài liệu quyết định kiến trúc 001-monorepo.md`
* `feat(FR-01): tạo API GET /products hỗ trợ query params lọc theo danh mục`
* `feat(FR-02): thiết kế màn hình Menu mobile-first hiển thị thẻ món và giá`
* `feat(FR-03): tạo modal chọn size, đường, đá và tích hợp Zustand lưu giỏ hàng`
* `feat(FR-04): hoàn thành API đăng nhập JWT và mã hóa mật khẩu bằng bcrypt`
* `feat(FR-05): xử lý tạo đơn hàng với Database Transaction và khóa dòng chống âm kho`
* `feat(FR-06): tích hợp mock payment sinh UUID Idempotency-Key chống thanh toán trùng`
* `feat(FR-07): tạo giao diện OrderStatusStepper theo dõi tiến trình đơn hàng`
* `feat(FR-10): thêm API đổi điểm thưởng loyalty và trừ tiền trực tiếp trên giỏ hàng`
* `chore(db): tạo script seed 10 món nước mẫu và topping vào postgresql`
* `test(e2e): viết kịch bản e2e test từ xem menu đến thêm giỏ hàng`
* `test(integration): viết integration test kiểm tra luồng tạo đơn và thanh toán`

### ❌ Những commit TUYỆT ĐỐI KHÔNG CHẤP NHẬN:
* `"update code"`
* `"fix bug"`
* `"xong task"`
* `"sua file"`

---

## 4. Quy ước Đặt tên Tiêu đề Pull Request (PR Title)

Khi tạo PR từ nhánh của mình vào nhánh `main`, thành viên đặt tên theo mẫu:

```text
[Tên thành viên] - [Chức năng / Task]: <Mô tả tóm tắt nội dung PR>
```

**Ví dụ chuẩn:**
* `[Phước] - Sơ đồ Chức năng 1: Hoàn thành Use Case, Activity và Sequence Diagram xem Menu`
* `[Khang] - Sơ đồ Chức năng 2: Hoàn thành Use Case, Activity và Sequence Diagram giỏ hàng`
* `[Phước] - Chức năng 1 (FR-01, FR-02): Hoàn thiện API Menu, giao diện xem món & DB Seed`
* `[Khang] - Chức năng 2 (FR-03): Tích hợp Modal tùy biến món và Giỏ hàng Zustand`
* `[Hiệp] - Chức năng 3 (FR-04): Đăng ký, Đăng nhập, JWT Guard & GET /health`
* `[Phúc] - Chức năng 4 (FR-05): Tạo đơn hàng với Database Transaction chống âm kho`
* `[Nguyên] - Chức năng 5 (FR-06): Thanh toán mô phỏng Idempotency & Viết ADR kiến trúc`
* `[Tuấn Thành] - Chức năng 6 (FR-07, 08): Màn hình biên nhận, Stepper & Docker Compose`
* `[Mai Thành] - Chức năng 7 (FR-10): Tích lũy điểm thưởng & Sơ đồ Deployment Production`
* `[Hiệp] - Task 1: Cập nhật Product Backlog và Ma trận truy vết`

---

## 5. Quy trình Duyệt / Merge Code

### Checklist cần kiểm tra trước khi bấm Merge:
1. **Tên nhánh:** Đúng quy ước tên thành viên (`phuoc`, `khang`, `hiep`, `phuc`, `nguyen`, `tuan-thanh`, `mai-thanh`).
2. **Lịch sử commit:** Mỗi commit phải có mã chức năng (`FR-xx` hoặc `task-x`) và mô tả rõ ràng.
3. **Không có xung đột (No merge conflicts):** Nếu có xung đột, yêu cầu thành viên giải quyết conflict trước khi merge.
4. **Không có file nhạy cảm:** Không commit nhầm `.env` hoặc file rác lên repo.
5. **Chế độ Merge:** Chọn **"Squash and merge"** để gộp commit gọn gàng trên nhánh `main`.
