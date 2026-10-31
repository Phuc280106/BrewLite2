# ĐẶC TẢ USE CASE: HỆ THỐNG XÁC THỰC VÀ PHÂN QUYỀN (AUTH)
**Mã chức năng:** `FR-04`  
**Phân hệ:** Xác thực & Định danh (`Auth & Identity Module`)  
**Tài liệu tham chiếu:** `docs/requirements/srs-summary.md`, `docs/traceability-matrix.md`  

## USE CASE 1: ĐĂNG KÝ TÀI KHOẢN (UC_Register)

### 1. Thông tin chung
* **Mã Use Case:** `UC-AUTH-01`
* **Mã Yêu cầu tương ứng:** `FR-04` (Tiêu chí: `AC-04.1`, `AC-04.2`)
* **Yêu cầu phi chức năng liên quan:** `NFR-03` (`AC-NFR-03.1` – Mật khẩu băm an toàn bằng `bcrypt` salt rounds $\ge 10$)
* **Tên Use Case:** Đăng ký tài khoản
* **Actor chính:** Khách hàng (Người dùng chưa có tài khoản)
* **Trigger:** Người dùng nhấn nút "Đăng ký" trên giao diện hoặc liên kết chuyển hướng từ trang Đăng nhập.

### 2. Tiền điều kiện & Hậu điều kiện
* **Tiền điều kiện:** Người dùng chưa đăng nhập vào hệ thống; thiết bị có kết nối mạng tới máy chủ BrewLite.
* **Hậu điều kiện:**
  * **Thành công:** Bản ghi tài khoản mới được lưu vào cơ sở dữ liệu (`Users`), mật khẩu được băm an toàn bằng `bcrypt`, vai trò mặc định là `CUSTOMER`. Chuyển hướng người dùng sang trang Đăng nhập (`AC-04.1`).
  * **Thất bại:** Không có bản ghi nào được tạo trong DB; hệ thống giữ nguyên trạng thái trước đó.

### 3. Luồng sự kiện chính (Main Flow)
1. Người dùng nhấn nút "Đăng ký" trên thanh điều hướng hoặc màn hình Đăng nhập.
2. Hệ thống hiển thị biểu mẫu Đăng ký gồm: `Họ và tên` ,`Email`, `Mật khẩu` và `Xác nhận mật khẩu`.
3. Người dùng nhập đầy đủ thông tin và nhấn nút "Đăng ký".
4. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào (email đúng định dạng RFC 5322, mật khẩu tối thiểu 6 ký tự, mật khẩu xác nhận trùng khớp).
5. Hệ thống kiểm tra sự tồn tại của email trong cơ sở dữ liệu: Email chưa từng được đăng ký.
6. Hệ thống băm mật khẩu bằng thuật toán `bcrypt` (salt rounds $\ge 10$) và tạo bản ghi người dùng mới trong database với vai trò `CUSTOMER` (`AC-04.1`, `AC-NFR-03.1`).
7. Hệ thống hiển thị thông báo đăng ký thành công (HTTP 201 Created) và tự động chuyển hướng người dùng sang màn hình Đăng nhập.

### 4. Luồng phụ / Thay thế (Alternative Flows)
* **4a. Chuyển sang màn hình Đăng nhập:**
  - Tại bước 2, nếu người dùng nhận ra đã có tài khoản, nhấn vào liên kết *"Đã có tài khoản? Đăng nhập ngay"*.
  - Hệ thống đóng form đăng ký và chuyển hướng sang màn hình Đăng nhập.

### 5. Luồng ngoại lệ (Exception Flows)
* **4b. Dữ liệu nhập vào không hợp lệ:**
  - Tại bước 4, nếu email sai định dạng, mật khẩu < 6 ký tự hoặc xác nhận mật khẩu không khớp:
  - Hệ thống đánh dấu viền đỏ trường bị lỗi và hiển thị thông báo lỗi cụ thể bên dưới trường tương ứng (ví dụ: *"Mật khẩu phải có ít nhất 6 ký tự"*).
  - Người dùng ở lại màn hình đăng ký để chỉnh sửa lại.
* **5a. Email đã tồn tại / Trùng lặp tài khoản (`AC-04.2`):**
  - Tại bước 5, nếu email đã tồn tại trong bảng `Users`:
  - Hệ thống trả về mã lỗi HTTP 409 Conflict (hoặc 400 Bad Request) kèm thông báo: *"Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác"*.
  - Giữ lại nội dung email đã nhập, xóa ô mật khẩu để người dùng thao tác lại.
* **6a. Lỗi kết nối máy chủ / Cơ sở dữ liệu:**
  - Tại bước 6, nếu kết nối DB bị gián đoạn:
  - Hệ thống hiển thị thông báo lỗi hệ thống: *"Hệ thống đang bận, vui lòng thử lại sau"* (HTTP 500). Giao dịch được rollback hoàn toàn.

---

## USE CASE 2: ĐĂNG NHẬP HỆ THỐNG (UC_Login)

### 1. Thông tin chung
* **Mã Use Case:** `UC-AUTH-02`
* **Mã Yêu cầu tương ứng:** `FR-04` (Tiêu chí: `AC-04.3`, `AC-04.4`, `AC-04.5`)
* **Yêu cầu phi chức năng liên quan:** `NFR-03` (`AC-NFR-03.2` – Token JWT ký HS256), `NFR-08` (`AC-NFR-08.1` – Kiến trúc Stateless)
* **Tên Use Case:** Đăng nhập hệ thống
* **Actor chính:** Khách hàng, Quản trị viên (Người dùng đã có tài khoản)
* **Trigger:** Người dùng nhấn nút "Đăng nhập" trên thanh điều hướng hoặc truy cập trang `/login`.

### 2. Tiền điều kiện & Hậu điều kiện
* **Tiền điều kiện:** Người dùng đã có tài khoản tồn tại trong hệ thống BrewLite.
* **Hậu điều kiện:**
  * **Thành công:** Hệ thống cấp phát chuỗi `JWT Access Token` chứa payload (`userId`, `email`, `role`). Trình duyệt lưu token và người dùng được chuyển hướng về Trang chủ (`AC-04.3`).
  * **Thất bại:** Không cấp phát token; phiên làm việc không được thiết lập (`AC-04.4`).

### 3. Luồng sự kiện chính (Main Flow)
1. Người dùng truy cập trang Đăng nhập hoặc nhấn nút "Đăng nhập".
2. Hệ thống hiển thị biểu mẫu Đăng nhập gồm: `Email` và `Mật khẩu`.
3. Người dùng nhập thông tin email, mật khẩu và nhấn nút "Đăng nhập".
4. Hệ thống truy vấn tìm kiếm người dùng theo email trong cơ sở dữ liệu.
5. Hệ thống sử dụng `verifyBCrypt` đối chiếu mật khẩu người dùng nhập với chuỗi băm lưu trong DB: Kết quả trùng khớp.
6. Hệ thống tạo mã `JWT Access Token` có thời hạn hiệu lực (24 giờ), được ký bằng `JWT_SECRET` (`AC-04.3`, `AC-NFR-03.2`).
7. Hệ thống trả về HTTP 200 OK kèm `accessToken`.
8. Ứng dụng client lưu trữ token, cập nhật trạng thái người dùng sang đã đăng nhập và chuyển hướng về Trang chủ.

### 4. Luồng phụ / Thay thế (Alternative Flows)
* **4a. Người dùng chưa có tài khoản:**
  - Tại bước 2, người dùng nhấn liên kết *"Chưa có tài khoản? Đăng ký ngay"*.
  - Hệ thống chuyển hướng sang màn hình Đăng ký (`UC-AUTH-01`).

### 5. Luồng ngoại lệ (Exception Flows)
* **4b / 5a. Sai thông tin đăng nhập (`AC-04.4`):**
  - Tại bước 4 hoặc 5, nếu email không có trong DB hoặc mật khẩu không khớp:
  - Hệ thống từ chối đăng nhập (HTTP 401 Unauthorized) và hiển thị thông điệp chung nhằm đảm bảo an toàn bảo mật: *"Thông tin đăng nhập không chính xác"*.
  - Người dùng ở lại màn hình đăng nhập để nhập lại.
* **6a. Tài khoản bị khóa (nếu có):**
  - Hệ thống phát hiện cờ trạng thái tài khoản không kích hoạt $\rightarrow$ Báo lỗi *"Tài khoản đã bị vô hiệu hóa"*.

---

## USE CASE 3: ĐĂNG XUẤT HỆ THỐNG (UC_Logout)

### 1. Thông tin chung
* **Mã Use Case:** `UC-AUTH-03`
* **Mã Yêu cầu tương ứng:** `FR-04` (Quản lý vòng đời phiên xác thực JWT / Hủy phiên đăng nhập)
* **Yêu cầu phi chức năng liên quan:** `NFR-03` (Bảo mật: Thu hồi phiên & xóa token), `NFR-08` (Cơ chế Stateless Authentication)
* **Tên Use Case:** Đăng xuất hệ thống
* **Actor chính:** Khách hàng, Quản trị viên (Người dùng đang đăng nhập)
* **Trigger:** Người dùng nhấn nút "Đăng xuất" trên thanh điều hướng hoặc menu tài khoản.

### 2. Tiền điều kiện & Hậu điều kiện
* **Tiền điều kiện:** Người dùng đang có phiên đăng nhập hợp lệ (có `JWT Access Token`).
* **Hậu điều kiện:**
  * **Thành công:** Chuỗi `accessToken` bị xóa bỏ hoàn toàn ở Client (`localStorage` / Cookie). Auth state được reset về trạng thái khách vãng lai và điều hướng về Trang chủ.
  * **Thất bại:** Giữ nguyên phiên nếu xảy ra lỗi trình duyệt không phản hồi.

### 3. Luồng sự kiện chính (Main Flow)
1. Người dùng nhấn nút "Đăng xuất" trên thanh điều hướng hoặc menu tài khoản.
2. Hệ thống gửi yêu cầu đăng xuất tới API Backend (đính kèm Bearer Token) để xác nhận thu hồi phiên.
3. Backend phản hồi HTTP 200 OK xác nhận đăng xuất thành công.
4. Hệ thống Client thực hiện xóa `accessToken` khỏi bộ nhớ trình duyệt (`localStorage` / Cookie).
5. Hệ thống đặt lại trạng thái người dùng (Auth State) về `Khách vãng lai`, xóa thông tin hiển thị tài khoản trên Header và điều hướng về Trang chủ.

### 4. Luồng ngoại lệ (Exception Flows)
* **2a. Token đã hết hạn từ trước khi bấm đăng xuất:**
  - Hệ thống Client tự động làm sạch `localStorage` và điều hướng về trang Đăng nhập mà không gây lỗi giao diện.

---

## MÃ YÊU CẦU TƯƠNG ỨNG 

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Mã yêu cầu tương ứng** | • **`FR-04`** : Đăng ký, Đăng nhập, cấp phát và xác thực phân quyền `JWT` (Access Token, `bcrypt`).<br>• **`NFR-01`** : Thời gian phản hồi API xác thực đăng nhập, đăng ký $\le 500ms$.<br>• **`NFR-03`** : Bảo mật mã hóa mật khẩu bằng thuật toán `bcrypt` (salt rounds $\ge 10$), bảo vệ token `JWT` ký an toàn HS256 và truyền qua `HTTPS`.<br>• **`NFR-04`** : Độ khả dụng hệ thống $\ge 99.5\%$, hỗ trợ endpoint giám sát sức khỏe `GET /api/v1/health`.<br>• **`NFR-08`** : Kiến trúc xác thực `Stateless` dựa trên JWT phía Client, không lưu trữ Session trên server. |


