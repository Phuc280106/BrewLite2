# ĐẶC TẢ USE CASE: HỆ THỐNG XÁC THỰC VÀ PHÂN QUYỀN (AUTH)
**Mã chức năng:** FR-04  
**Phân hệ:** Xác thực & Định danh (`Auth & Identity Module`)  

---

## USE CASE 1: ĐĂNG KÝ TÀI KHOẢN (UC_Register)

### 1. Thông tin chung
* **Mã Yêu Cầu:** Cần bổ xung
* **Tên Use Case:** Đăng ký tài khoản
* **Actor chính:** Khách hàng (Người dùng chưa có tài khoản)
* **Trigger:** Người dùng nhấn nút "Đăng ký" trên giao diện hoặc liên kết chuyển hướng từ trang Đăng nhập.

### 2. Tiền điều kiện & Hậu điều kiện
* **Tiền điều kiện:** Người dùng chưa đăng nhập vào hệ thống; thiết bị có kết nối mạng tới máy chủ BrewLite.
* **Hậu điều kiện:**
  * **Thành công:** Bản ghi tài khoản mới được lưu vào cơ sở dữ liệu (`Users`), mật khẩu được băm an toàn bằng `bcrypt`, vai trò mặc định là `CUSTOMER`. Chuyển hướng người dùng sang trang Đăng nhập.
  * **Thất bại:** Không có bản ghi nào được tạo trong DB; hệ thống giữ nguyên trạng thái trước đó.

### 3. Luồng sự kiện chính (Main Flow)
1. Người dùng nhấn nút "Đăng ký" trên thanh điều hướng hoặc màn hình Đăng nhập.
2. Hệ thống hiển thị biểu mẫu Đăng ký gồm: `Email`, `Mật khẩu` và `Xác nhận mật khẩu`.
3. Người dùng nhập đầy đủ thông tin và nhấn nút "Đăng ký".
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào (email đúng định dạng , mật khẩu tối thiểu 6 ký tự, mật khẩu xác nhận trùng khớp).
5. Người dùng nhấn nút "Đăng ký" xác nhận sau khi đã nhập xong
6. Hệ thống kiểm tra sự tồn tại của email trong cơ sở dữ liệu: Email chưa từng được đăng ký.
7. Hệ thống băm mật khẩu bằng thuật toán `bcrypt` (salt rounds $\ge 10$) và tạo bản ghi người dùng mới với trạng thái kích hoạt.
8. Hệ thống hiển thị thông báo đăng ký thành công và tự động chuyển hướng người dùng sang màn hình Đăng nhập.

### 4. Luồng phụ / Thay thế (Alternative Flows)
* **4a. Chuyển sang màn hình Đăng nhập:**
  - Tại bước 2, nếu người dùng đã có tài khoản, nhấn vào liên kết *"Đã có tài khoản? Đăng nhập ngay"*.
  - Hệ thống đóng form đăng ký và chuyển hướng sang màn hình Đăng nhập.

### 5. Luồng ngoại lệ (Exception Flows)
* **4b. Dữ liệu nhập vào không hợp lệ:**
  - Tại bước 4, nếu email sai định dạng, mật khẩu < 6 ký tự hoặc xác nhận mật khẩu không khớp:
  - Hệ thống đánh dấu viền đỏ trường bị lỗi và hiển thị thông báo lỗi cụ thể bên dưới trường tương ứng (ví dụ: *"Mật khẩu phải có ít nhất 6 ký tự"*).
  - Người dùng ở lại màn hình đăng ký để chỉnh sửa lại.
* **5a. Email đã tồn tại (Trùng lặp tài khoản):**
  - Tại bước 5, nếu email đã tồn tại trong bảng `Users`:
  - Hệ thống trả về mã lỗi (HTTP 409 Conflict hoặc 400 Bad Request) kèm thông báo: *"Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác"*.
  - Giữ lại nội dung email đã nhập, xóa ô mật khẩu để người dùng thao tác lại.
* **6a. Lỗi kết nối máy chủ / Cơ sở dữ liệu:**
  - Tại bước 6, nếu kết nối DB bị gián đoạn:
  - Hệ thống hiển thị thông báo lỗi hệ thống: *"Hệ thống đang bận, vui lòng thử lại sau"* (HTTP 500). Giao dịch được rollback hoàn toàn.

---

## USE CASE 2: ĐĂNG NHẬP HỆ THỐNG (UC_Login)

### 1. Thông tin chung
* **Mã Yêu Cầu:** Cần bổ xung
* **Tên Use Case:** Đăng nhập hệ thống
* **Actor chính:** Khách hàng, Quản trị viên (Người dùng đã có tài khoản)
* **Trigger:** Người dùng nhấn nút "Đăng nhập" trên thanh điều hướng hoặc truy cập trang `/login`.

### 2. Tiền điều kiện & Hậu điều kiện
* **Tiền điều kiện:** Người dùng đã có tài khoản tồn tại trong hệ thống BrewLite.
* **Hậu điều kiện:**
  * **Thành công:** Hệ thống cấp phát chuỗi `JWT Access Token` chứa payload (`userId`, `email`, `role`). Trình duyệt lưu token và người dùng được chuyển hướng về Trang chủ.
  * **Thất bại:** Không cấp phát token; phiên làm việc không được thiết lập.

### 3. Luồng sự kiện chính (Main Flow)
1. Người dùng truy cập trang Đăng nhập hoặc nhấn nút "Đăng nhập".
2. Hệ thống hiển thị biểu mẫu Đăng nhập gồm: `Email` và `Mật khẩu`.
3. Người dùng nhập thông tin email, mật khẩu và nhấn nút "Đăng nhập".
4. Hệ thống truy vấn tìm kiếm người dùng theo email trong cơ sở dữ liệu.
5. Hệ thống sử dụng `verifyBCrypt` đối chiếu mật khẩu người dùng nhập với chuỗi băm lưu trong DB: Kết quả trùng khớp.
6. Hệ thống tạo mã `JWT Access Token` có thời hạn hiệu lực (24 giờ), được ký bằng `JWT_SECRET`.
7. Hệ thống trả về HTTP 200 OK kèm `accessToken`.
8. Ứng dụng client lưu trữ token, cập nhật trạng thái người dùng sang đã đăng nhập và chuyển hướng về Trang chủ.

### 4. Luồng phụ / Thay thế (Alternative Flows)
* **4a. Người dùng chưa có tài khoản:**
  - Tại bước 2, người dùng nhấn liên kết *"Chưa có tài khoản? Đăng ký ngay"*.
  - Hệ thống chuyển hướng sang màn hình Đăng ký.

### 5. Luồng ngoại lệ (Exception Flows)
* **4b / 5a. Sai thông tin đăng nhập (Email không tồn tại hoặc Mật khẩu sai):**
  - Tại bước 4 hoặc 5, nếu email không có trong DB hoặc mật khẩu không khớp:
  - Hệ thống từ chối đăng nhập (HTTP 401 Unauthorized) và hiển thị thông điệp chung nhằm đảm bảo an toàn bảo mật: *"Thông tin đăng nhập không chính xác"*.
  - Người dùng ở lại màn hình đăng nhập để nhập lại.
* **6a. Tài khoản bị khóa (nếu có):**
  - Hệ thống phát hiện cờ trạng thái tài khoản không kích hoạt $\rightarrow$ Báo lỗi *"Tài khoản đã bị vô hiệu hóa"*.