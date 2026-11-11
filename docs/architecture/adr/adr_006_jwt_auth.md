# ADR 006: Xác thực Phi trạng thái (Stateless JWT Authentication) và Phân quyền theo Role

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-18
* **Người phụ trách:** Hiệp (`hiep`)
* **Liên kết yêu cầu / Thiết kế:** Task 1.2, Task 2.1, Task 2.2, Task 2.3 (`User`), Task 5.1

---

## 1. Bối cảnh (Context)
Hệ thống **BrewLite** được triển khai theo kiến trúc tách rời giữa Frontend (`Next.js` chạy trên trình duyệt/PWA) và Backend (`NestJS API` đóng gói trong Docker Container). Hệ thống bao gồm các API công khai (như xem Menu `GET /products`) và các API yêu cầu bảo mật cao (như đồng bộ Giỏ hàng, khởi tạo Đơn hàng `POST /orders`, Thanh toán `POST /payments`, xem Lịch sử đơn và quản lý trạng thái đơn hàng theo vai trò `User.role`).

Nhóm cần một cơ chế xác thực và phân quyền an toàn, gọn nhẹ, dễ kiểm thử tự động và hoạt động ổn định trên môi trường Cloud Container.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1: Server-side Session (Lưu trữ phiên đăng nhập trong bộ nhớ Server hoặc Redis).**
2. **Phương án 2: Stateless Authentication sử dụng JSON Web Token (JWT) kết hợp mã hóa mật khẩu `bcrypt` và `Role Guard`.**

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2**:
1. **Bảo mật thông tin xác thực (`User`):**
   - Tuyệt đối không lưu mật khẩu dạng văn bản thuần (plain text). Mật khẩu người dùng khi đăng ký được băm một chiều bằng thuật toán `bcrypt` và lưu vào trường `passwordHash` của bảng `User`.
2. **Xác thực phi trạng thái bằng `JWT`:**
   - Khi người dùng đăng nhập thành công (`POST /auth/login`), NestJS API phát hành một chuỗi `JWT` được ký bằng khóa bí mật (`JWT_SECRET` cấu hình qua biến môi trường `.env`), bên trong payload chứa `userId`, `email` và `role`.
   - Frontend lưu trữ token và đính kèm vào HTTP Header `Authorization: Bearer <token>` cho các yêu cầu tiếp theo.
3. **Kiểm soát truy cập tại tầng Controller (`JwtAuthGuard` & `RolesGuard`):**
   - Sử dụng Middleware/Guard của NestJS để kiểm tra tính hợp lệ và thời hạn của `JWT` trước khi cho phép request đi vào tầng Service (như thể hiện trên Sequence Diagram ở Task 2.2).
   - Dựa vào thuộc tính `role` (`CUSTOMER`, `STAFF`, `ADMIN`/`MANAGER`) trên lớp `User` để phân quyền truy cập giữa chức năng đặt nước của khách hàng và chức năng cập nhật trạng thái đơn hàng của nhân viên/quản lý.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **Kiến trúc Backend hoàn toàn Stateless:** NestJS API không cần tốn bộ nhớ RAM hay cài đặt thêm Redis để lưu trữ Session, giúp việc đóng gói Docker và triển khai lên Cloud Production (Task 5.3, 5.4) đơn giản và dễ mở rộng.
* **Tách biệt rõ Frontend và Backend:** Hoạt động mượt mà qua giao thức HTTPS/REST API giữa các tên miền khác nhau (ví dụ: Frontend trên Vercel và Backend API trên Render/Railway).

### Hạn chế & Đánh đổi (-)
* **Quản lý vòng đời Token:** Vì JWT không lưu trạng thái trên Server nên không thể hủy (revoke) tức thì một token đang còn hạn nếu không dùng thêm danh sách đen (Token Blacklist). Nhóm kiểm soát rủi ro này bằng cách thiết lập thời gian hết hạn (`JWT_EXPIRES_IN`) hợp lý trong biến môi trường.