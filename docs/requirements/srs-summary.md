# BẢN ĐẶC TẢ YÊU CẦU PHẦN MỀM RÚT GỌN (SRS SUMMARY)
**Hệ thống:** Hệ thống Đặt Đồ Uống Trực Tuyến BrewLite (Mobile-first / PWA)  
**Mã tài liệu:** `SRS-BREWLITE-V1.0`  
**Phiên bản:** 1.0 (Đặc tả Hệ thống Chuẩn hóa & Khung phân loại MoSCoW)  
**Tệp tài liệu:** `requirements/srs-summary.md` & `docs/requirements/srs-summary.md`  
**Phạm vi áp dụng:** Tài liệu kỹ thuật xác định phạm vi chức năng, kiến trúc phi chức năng và tiêu chuẩn nghiệm thu phần mềm của hệ thống BrewLite.  

---

## 1. Giới thiệu & Mục tiêu Tài liệu

Tài liệu **SRS Rút gọn (Software Requirements Specification Summary)** này định nghĩa tập trung và chuẩn hóa toàn bộ các **Yêu cầu Chức năng (Functional Requirements - FR)** và **Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)** của Hệ thống Đặt Đồ Uống Trực Tuyến BrewLite.

Tài liệu đóng vai trò làm:
1. **Khế ước kỹ thuật hệ thống (System Quality Contract):** Căn cứ chuẩn mực xác định rõ ràng ranh giới phạm vi, năng lực xử lý và hành vi kỳ vọng của toàn bộ hệ thống.
2. **Cơ sở thiết kế & lập mô hình (Modeling Baseline):** Cung cấp đầu vào trực tiếp cho việc xây dựng các mô hình kiến trúc và gói sơ đồ UML (Use Case, Activity, Sequence, Class, Component, Deployment).
3. **Tiêu chuẩn nghiệm thu kỹ thuật (Acceptance Baseline):** Đưa ra các **Tiêu chí chấp nhận có thể kiểm chứng (Verifiable Acceptance Criteria - AC)** làm chuẩn mực tiên quyết để phát triển bộ kiểm thử tự động (Unit Test, Integration Test, End-to-End Test) và nghiệm thu chất lượng phần mềm.

---

## 2. Quy ước Phân loại Mức độ Ưu tiên theo MoSCoW

Toàn bộ các yêu cầu của hệ thống được phân cấp theo khung chuẩn **MoSCoW**:

* **Must Have (M) — Bắt buộc phải có:** Các yêu cầu cốt lõi bắt buộc hệ thống phải đáp ứng để tạo nên phiên bản MVP (Minimum Viable Product) hoàn chỉnh, khép kín luồng nghiệp vụ đặt món và sẵn sàng vận hành. Thiếu bất kỳ yêu cầu Must nào, hệ thống chưa đủ điều kiện phát hành.
* **Should Have (S) — Nên có:** Các yêu cầu quan trọng mang lại giá trị cao cho trải nghiệm người dùng và tính toàn diện của hệ thống; được ưu tiên triển khai sau khi hoàn tất các chức năng Must.
* **Could Have (C) — Có thể có:** Các yêu cầu mở rộng (Nice-to-have), chỉ thực hiện khi tài nguyên và hiệu năng của hệ thống cho phép mà không làm chậm trễ tiến độ của các yêu cầu Must/Should.
* **Won’t Have (W) — Không thực hiện trong phạm vi hiện tại:** Các yêu cầu đã được thống nhất là nằm ngoài phạm vi (Out-of-Scope) của phiên bản hiện tại, được bảo lưu vào lộ trình phát triển tương lai (Post-MVP / Roadmap).

---

## 3. Danh mục Yêu cầu Chức năng (Functional Requirements - FR)

### Bảng tóm tắt Yêu cầu Chức năng & Phân hệ Hệ thống

| Mã FR | Tên Yêu cầu Chức năng | Tác nhân (Actor) | Mức ưu tiên MoSCoW | Phân hệ Hệ thống (Module) |
| :---: | :--- | :--- | :---: | :--- |
| **FR-01** | Duyệt Menu & Lọc theo Danh mục | Khách hàng | **Must** | Phân hệ Thực đơn & Danh mục (`Product Catalog Module`) |
| **FR-02** | Xem Chi tiết Món | Khách hàng | **Must** | Phân hệ Thực đơn & Danh mục (`Product Catalog Module`) |
| **FR-03** | Tùy biến Món (Size/Topping) & Quản lý Giỏ hàng | Khách hàng | **Must** | Phân hệ Giỏ hàng & Tùy biến (`Cart & Customization Module`) |
| **FR-04** | Đăng ký, Đăng nhập & Xác thực Phân quyền JWT | Khách hàng, Quản trị viên, Hệ thống | **Must** | Phân hệ Xác thực & Phân quyền (`Auth & Identity Module`) |
| **FR-05** | Khởi tạo Đơn hàng & Khóa Tồn kho Đồng thời | Khách hàng, Hệ thống | **Must** | Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`) |
| **FR-06** | Thanh toán Mô phỏng & Chống Trừ tiền Trùng lặp | Khách hàng, Cổng thanh toán mô phỏng | **Must** | Phân hệ Thanh toán & Giao dịch (`Payment & Transaction Module`) |
| **FR-07** | Biên nhận Đơn hàng & Theo dõi Tiến trình Stepper | Khách hàng | **Must** | Phân hệ Biên nhận & Theo dõi Đơn (`Receipt & Tracking Module`) |
| **FR-08** | Xem Lịch sử Đơn hàng Cá nhân | Khách hàng | **Must** | Phân hệ Biên nhận & Theo dõi Đơn (`Receipt & Tracking Module`) |
| **FR-09** | Cập nhật & Chuyển đổi Trạng thái Đơn hàng | Nhân viên quầy, Quản trị viên, Hệ thống | **Should** | Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`) |
| **FR-10** | Tích lũy Điểm thưởng & Đổi Điểm Giảm giá | Khách hàng, Hệ thống | **Must** | Phân hệ Khách hàng Thân thiết (`Loyalty Module`) |
| **FR-11** | Tìm kiếm Món theo Từ khóa | Khách hàng | **Should** | Phân hệ Thực đơn & Danh mục (`Product Catalog Module`) |
| **FR-12** | Hủy Đơn hàng khi ở trạng thái Chờ tiếp nhận | Khách hàng, Hệ thống | **Should** | Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`) |
| **FR-13** | Ghi chú Riêng cho Từng Món / Đơn hàng | Khách hàng | **Could** | Phân hệ Giỏ hàng & Tùy biến (`Cart & Customization Module`) |
---

### Chi tiết Đặc tả & Tiêu chí Chấp nhận Từng Yêu cầu Chức năng

#### `FR-01`: Duyệt Menu & Lọc theo Danh mục
* **Phân hệ thực thi:** Phân hệ Thực đơn & Danh mục (`Product Catalog Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Hệ thống cung cấp danh mục phân loại đồ uống (Cà phê, Trà sữa, Trà trái cây, Đá xay...) và danh sách thẻ sản phẩm trực quan. Cho phép khách hàng lọc nhanh danh sách món theo từng tab danh mục.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-01.1:** Khi truy cập trang chủ `/`, hệ thống tải và hiển thị toàn bộ thanh danh mục cùng danh sách đồ uống tương ứng từ cơ sở dữ liệu.
  * **AC-01.2:** Khi người dùng nhấn vào một tab danh mục (ví dụ: *"Cà phê"*), danh sách sản phẩm hiển thị cập nhật tức thì chỉ chứa các món thuộc danh mục đó trong thời gian $\le 300\text{ms}$.
  * **AC-01.3:** Nếu danh mục chưa có món nào, hệ thống hiển thị thông báo trạng thái rỗng thân thiện: *"Chưa có sản phẩm nào trong danh mục này"*.
  * **AC-01.4:** API `GET /api/v1/products?categoryId=...` trả về HTTP `200 OK` với danh sách JSON chứa đủ các trường: `id`, `name`, `basePrice`, `imageUrl`, `inStock`, `categoryId`.

#### `FR-02`: Xem Chi tiết Món & Trạng thái Tồn kho
* **Phân hệ thực thi:** Phân hệ Thực đơn & Danh mục (`Product Catalog Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Khách hàng có thể nhấn vào bất kỳ món nào để mở trang hoặc modal xem chi tiết: Tên món, hình ảnh lớn, mô tả hương vị, đơn giá chuẩn, nhãn tình trạng còn hàng hoặc tạm hết hàng.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-02.1:** Nhấp vào thẻ sản phẩm bất kỳ, hệ thống mở cửa sổ chi tiết hiển thị đầy đủ: Ảnh sản phẩm, tên, giá bán cơ sở, mô tả thành phần và huy hiệu trạng thái (`Còn hàng` hoặc `Tạm hết`).
  * **AC-02.2:** Đối với món có `inStock = false`, nút *"Thêm vào giỏ hàng"* bị vô hiệu hóa (disabled), hiển thị chữ *"Tạm hết hàng"* và không cho phép người dùng click thêm món.
  * **AC-02.3:** API `GET /api/v1/products/:id` trả về HTTP `200 OK` kèm thông tin sản phẩm, danh sách kích cỡ (Size) và danh sách topping hợp lệ; trả về HTTP `404 Not Found` nếu `id` không tồn tại.

#### `FR-03`: Tùy biến Món (Size/Topping) & Quản lý Giỏ hàng
* **Phân hệ thực thi:** Phân hệ Giỏ hàng & Tùy biến (`Cart & Customization Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Cho phép khách hàng tùy biến món đồ uống trước khi đưa vào giỏ: Chọn Size (Nhỏ - S, Vừa - M, Lớn - L), mức đường (0%, 30%, 50%, 70%, 100%), mức đá (0%, 50%, 100%), và chọn thêm một hoặc nhiều loại Topping (Trân châu trắng, Thạch củ năng, Kem cheese...). Quản lý giỏ hàng lưu trạng thái ở client (`Zustand` store + `localStorage`): tăng/giảm số lượng, xóa món, tính tổng tiền tức thì theo công thức:
  $$\text{Tổng tiền món} = \left(\text{Giá gốc} + \Delta\text{Giá Size} + \sum \text{Giá Topping}\right) \times \text{Số lượng}$$
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-03.1:** Modal tùy biến bắt buộc chọn đúng 1 Size, 1 mức đường, 1 mức đá và cho phép chọn 0 đến $N$ loại topping. Tổng giá món trên modal nhảy số tức thì theo tùy chọn của người dùng.
  * **AC-03.2:** Nhấn nút *"Thêm vào giỏ"*, món được đưa vào Zustand store; biểu tượng giỏ hàng trên thanh điều hướng cập nhật ngay lập tức tổng số lượng món.
  * **AC-03.3:** Hai món cùng loại nhưng khác tùy biến (ví dụ: 1 ly Cà phê Size M 50% đường và 1 ly Cà phê Size L 100% đường) được lưu thành 2 dòng riêng biệt trong giỏ hàng.
  * **AC-03.4:** Trong màn hình giỏ hàng `/cart`, người dùng có thể tăng/giảm số lượng (tối thiểu là 1, giảm từ 1 sẽ hiển thị xác nhận xóa) hoặc bấm nút xóa bỏ món.
  * **AC-03.5:** Trạng thái giỏ hàng được giữ nguyên vẹn khi người dùng tải lại trang (F5) hoặc đóng trình duyệt mở lại nhờ đồng bộ với `localStorage`.

#### `FR-04`: Đăng ký, Đăng nhập & Xác thực Phân quyền JWT
* **Phân hệ thực thi:** Phân hệ Xác thực & Phân quyền (`Auth & Identity Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Cung cấp chức năng đăng ký tài khoản mới (Họ tên, Email, Số điện thoại, Mật khẩu) và đăng nhập hệ thống. Mật khẩu được mã hóa an toàn bằng thuật toán `bcrypt`. Xác thực người dùng bằng cơ chế JSON Web Token (JWT) cho các endpoint yêu cầu bảo mật. Phân quyền vai trò: `CUSTOMER` và `ADMIN`.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-04.1:** Đăng ký thành công: Gửi `POST /api/v1/auth/register` với email hợp lệ chưa tồn tại và mật khẩu $\ge 6$ ký tự, hệ thống băm mật khẩu bằng `bcrypt` (salt rounds $\ge 10$), lưu vào DB và trả về HTTP `201 Created`.
  * **AC-04.2:** Trùng lặp email: Nếu email đã tồn tại, hệ thống từ chối đăng ký và trả về HTTP `409 Conflict` kèm thông báo *"Email đã được sử dụng"*.
  * **AC-04.3:** Đăng nhập thành công: Gửi `POST /api/v1/auth/login` với email và mật khẩu chính xác, hệ thống trả về HTTP `200 OK` kèm `accessToken` (JWT) chứa payload (`userId`, `email`, `role`).
  * **AC-04.4:** Đăng nhập thất bại: Gửi sai email hoặc mật khẩu, hệ thống trả về HTTP `401 Unauthorized` kèm thông báo *"Thông tin đăng nhập không hợp lệ"*.
  * **AC-04.5:** Bảo vệ tài nguyên: Mọi request tới endpoint yêu cầu xác thực (`JwtAuthGuard`) mà không có header `Authorization: Bearer <token>` hoặc token hết hạn/không hợp lệ đều bị từ chối với HTTP `401 Unauthorized`.

#### `FR-05`: Khởi tạo Đơn hàng & Khóa Tồn kho Đồng thời
* **Phân hệ thực thi:** Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Khách hàng xác nhận đặt đơn hàng từ giỏ hàng qua `POST /api/v1/orders`. Backend tự động truy vấn giá từ DB để tính tổng tiền độc lập (không tin tưởng giá từ Client gửi lên). Sử dụng Database Transaction kết hợp cơ chế khóa dòng (`SELECT FOR UPDATE`) để kiểm tra và trừ tồn kho, ngăn chặn tuyệt đối lỗi bán âm kho khi nhiều khách cùng đặt một lúc. Đơn hàng khởi tạo ở trạng thái ban đầu `PENDING`.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-05.1:** Tính đúng giá: Backend tính lại tổng tiền từ DB; nếu client can thiệp gửi sai giá tiền, hệ thống vẫn ghi nhận giá trị tính toán chuẩn từ máy chủ.
  * **AC-05.2:** Trừ kho an toàn: Khi đặt hàng, hệ thống mở Database Transaction, khóa các dòng sản phẩm liên quan (`SELECT ... FOR UPDATE`), kiểm tra `stock >= quantity`. Nếu đủ hàng, trừ kho và tạo bản ghi `Order`, `OrderItem` với trạng thái `PENDING`, trả về HTTP `201 Created` kèm `orderId`.
  * **AC-05.3:** Rollback khi hết hàng: Nếu có bất kỳ món nào trong giỏ không đủ tồn kho tại thời điểm commit, transaction tự động `ROLLBACK`, không trừ bất kỳ món nào và trả về HTTP `400 Bad Request` kèm thông báo món đã hết hàng.
  * **AC-05.4:** Kiểm chứng tranh chấp đồng thời: Khi 50 requests đồng thời gửi yêu cầu mua 1 sản phẩm chỉ còn tồn kho = 1, chỉ duy nhất 1 request thành công tạo đơn, 49 requests còn lại nhận phản hồi hết hàng; tồn kho cuối cùng trong DB bằng đúng 0 (không âm).

#### `FR-06`: Thanh toán Mô phỏng & Chống Trừ tiền Trùng lặp
* **Phân hệ thực thi:** Phân hệ Thanh toán & Giao dịch (`Payment & Transaction Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Cung cấp API `POST /api/v1/payments` mô phỏng thanh toán trực tuyến qua Thẻ ngân hàng giả lập (`MOCK_CARD`) hoặc Ví điện tử giả lập (`MOCK_WALLET`). Bắt buộc truyền kèm header `Idempotency-Key` (chuỗi UUIDv4 sinh từ Client cho mỗi lượt bấm thanh toán) để chống trừ tiền trùng lặp khi mạng chập chờn hoặc người dùng click nhiều lần.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-06.1:** Thanh toán thành công: Gửi request thanh toán hợp lệ với `Idempotency-Key` mới, hệ thống tạo bản ghi `Payment` với trạng thái `SUCCESS`, chuyển trạng thái đơn hàng từ `PENDING` sang `PREPARING`, trả về HTTP `200 OK`.
  * **AC-06.2:** Cơ chế Idempotency chống trừ tiền trùng: Gửi lặp lại cùng một request thanh toán với cùng `Idempotency-Key` trong vòng 24 giờ, hệ thống phát hiện request đã xử lý và trả về ngay kết quả giao dịch cũ với HTTP `200 OK`, tuyệt đối không trừ tiền hay tạo bản ghi thanh toán mới lần thứ hai.
  * **AC-06.3:** Xử lý thất bại: Nếu mô phỏng kịch bản thanh toán thất bại (ví dụ: mã thẻ từ chối), hệ thống ghi nhận `Payment` trạng thái `FAILED`, giữ nguyên trạng thái đơn để khách hàng thao tác thanh toán lại.
  * **AC-06.4:** Timeout hoàn kho: Nếu sau 15 phút kể từ khi tạo đơn mà đơn hàng không được thanh toán thành công, hệ thống tự động hoàn lại số lượng tồn kho đã giữ và chuyển đơn sang `CANCELLED`.

#### `FR-07`: Biên nhận Đơn hàng & Theo dõi Tiến trình Stepper
* **Phân hệ thực thi:** Phân hệ Biên nhận & Theo dõi Đơn (`Receipt & Tracking Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Sau khi thanh toán thành công, hệ thống điều hướng khách hàng tới màn hình Biên nhận (`/orders/:id/receipt`). Màn hình hiển thị đầy đủ thông tin: Mã đơn hàng, ngày giờ đặt, chi tiết các món nước kèm topping, tổng tiền thanh toán, phương thức thanh toán. Tích hợp thanh tiến trình trực quan (`OrderStatusStepper`) hiển thị 4 trạng thái tuần tự: `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`, và trạng thái ngoại lệ `CANCELLED`.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-07.1:** Khi thanh toán thành công, người dùng được tự động chuyển hướng đến `/orders/:id/receipt`. Màn hình hiển thị chính xác mã đơn, thời gian, danh sách món và tổng tiền.
  * **AC-07.2:** Thành phần `OrderStatusStepper` trực quan hóa tiến trình: Bước hiện tại được làm nổi bật (active/highlight); các bước đã hoàn thành có biểu tượng tick xanh; các bước chưa tới ở trạng thái mờ (inactive).
  * **AC-07.3:** Giao diện tự động cập nhật trạng thái mới nhất khi khách tải lại trang hoặc thông qua cơ chế định kỳ polling trạng thái từ API.
  * **AC-07.4:** Nếu đơn hàng ở trạng thái `CANCELLED`, giao diện hiển thị cảnh báo màu đỏ với thông báo rõ ràng về trạng thái hủy đơn.

#### `FR-08`: Xem Lịch sử Đơn hàng Cá nhân
* **Phân hệ thực thi:** Phân hệ Biên nhận & Theo dõi Đơn (`Receipt & Tracking Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Cho phép khách hàng đã đăng nhập truy cập trang `/orders/my-orders` để xem toàn bộ danh sách đơn hàng đã thực hiện trong quá khứ. Danh sách được sắp xếp theo thời gian mới nhất lên đầu. Mỗi thẻ đơn tóm tắt mã đơn, ngày đặt, số lượng món, tổng tiền và huy hiệu trạng thái.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-08.1:** Đăng nhập và truy cập `/orders/my-orders`, hệ thống hiển thị danh sách đơn hàng thuộc quyền sở hữu của chính tài khoản đó (không hiển thị đơn của tài khoản khác).
  * **AC-08.2:** Danh sách được sắp xếp giảm dần theo thời gian tạo đơn (`createdAt DESC`).
  * **AC-08.3:** Mỗi thẻ đơn hiển thị đầy đủ: Mã đơn, thời gian đặt, tổng tiền, huy hiệu trạng thái có màu sắc phân biệt trực quan.
  * **AC-08.4:** Nhấn vào thẻ đơn bất kỳ, hệ thống điều hướng trực tiếp đến trang xem chi tiết biên nhận `/orders/:id/receipt`.
  * **AC-08.5:** Nếu tài khoản chưa từng đặt đơn nào, hiển thị màn hình rỗng (Empty State) kèm nút điều hướng *"Khám phá Menu ngay"*.

#### `FR-09`: Cập nhật & Chuyển đổi Trạng thái Đơn hàng
* **Phân hệ thực thi:** Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Cung cấp API và giao diện thao tác dành cho nhân viên quầy (Barista / Admin) cập nhật tiến độ chế biến đơn hàng: từ `PREPARING` $\rightarrow$ `READY` (món đã pha xong, sẵn sàng để khách nhận) $\rightarrow$ `COMPLETED` (khách đã nhận món).
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-09.1:** Endpoint `PATCH /api/v1/orders/:id/status` yêu cầu quyền `ADMIN` hoặc `BARISTA`; tài khoản khách thông thường gửi request bị từ chối với HTTP `403 Forbidden`.
  * **AC-09.2:** Trạng thái chỉ được chuyển đổi theo quy tắc tiến tới hợp lệ: `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`; không cho phép chuyển lùi từ `COMPLETED` về các trạng thái trước.
  * **AC-09.3:** Khi đơn hàng chuyển trạng thái sang `COMPLETED`, hệ thống tự động kích hoạt tính năng tích lũy điểm thưởng loyalty cho khách hàng (theo `FR-10`).
  * **AC-09.4:** Nếu đơn hàng bị hủy (`CANCELLED`), hệ thống tự động thực hiện hoàn trả lại tồn kho đã khóa trước đó cho các sản phẩm trong đơn.

#### `FR-10`: Tích lũy Điểm thưởng & Đổi Điểm Giảm giá (Loyalty)
* **Phân hệ thực thi:** Phân hệ Khách hàng Thân thiết (`Loyalty Module`)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Hệ thống quản lý điểm thưởng khách hàng thân thiết:
  1. **Tích lũy điểm:** Tự động cộng điểm vào tài khoản khi đơn hàng hoàn tất thanh toán thành công theo quy tắc: **10.000 VNĐ chi tiêu = 1 Điểm thưởng** (làm tròn xuống).
  2. **Hiển thị điểm:** Số dư điểm khả dụng hiển thị trên thanh điều hướng Header (`LoyaltyBadge`).
  3. **Đổi điểm giảm giá:** Khách hàng có thể nhập số điểm muốn đổi tại bước Giỏ hàng / Đặt hàng (`RedeemPointsInput`) để giảm trừ trực tiếp tiền đơn hàng theo tỷ lệ: **1 Điểm = 1.000 VNĐ giảm giá**.
  4. **Ràng buộc toàn vẹn:** Điểm đổi không vượt quá số dư hiện có; số dư điểm không bao giờ được phép âm (`CHECK points >= 0`). Mọi giao dịch cộng/trừ điểm được lưu vết vào bảng `LoyaltyTransaction`.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-10.1:** Tích điểm chuẩn xác: Sau khi đơn hàng có giá trị thanh toán 65.000 VNĐ hoàn tất, tài khoản được cộng chính xác $\lfloor 65.000 / 10.000 \rfloor = 6$ điểm thưởng; tạo 1 bản ghi `LoyaltyTransaction` loại `EARN` ghi nhận $+6$ điểm.
  * **AC-10.2:** Hiển thị số dư: Khách hàng đăng nhập nhìn thấy số điểm hiện tại hiển thị rõ ràng trên Header mà không cần tải lại trang.
  * **AC-10.3:** Đổi điểm giảm tiền: Khách hàng có 20 điểm và nhập đổi 10 điểm tại màn hình thanh toán, tổng tiền đơn hàng phải trả được giảm trừ đúng 10.000 VNĐ.
  * **AC-10.4:** Chặn đổi vượt số dư: Nếu khách hàng nhập số điểm muốn đổi lớn hơn số dư hiện có (ví dụ: có 5 điểm nhưng nhập 10 điểm), hệ thống báo lỗi không hợp lệ và vô hiệu hóa nút xác nhận đổi điểm.
  * **AC-10.5:** Chống âm điểm đồng thời: Cơ sở dữ liệu thiết lập ràng buộc cứng `CHECK (points >= 0)`; thao tác trừ điểm được bọc trong cùng Database Transaction với lệnh tạo đơn để loại trừ hoàn toàn nguy cơ âm điểm do gửi nhiều request song song.

#### `FR-11`: Tìm kiếm Món theo Từ khóa
* **Phân hệ thực thi:** Phân hệ Thực đơn & Danh mục (`Product Catalog Module`)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Cho phép khách hàng nhập từ khóa tìm kiếm trên thanh Menu để lọc nhanh món theo tên.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-11.1:** Khi nhập từ khóa (ví dụ: *"Matcha"*), danh sách hiển thị tự động lọc các món có tên chứa từ khóa (không phân biệt chữ hoa/chữ thường) với cơ chế debounce $300\text{ms}$.
  * **AC-11.2:** Khi xóa rỗng ô tìm kiếm, danh sách sản phẩm lập tức quay về trạng thái hiển thị đầy đủ ban đầu.

#### `FR-12`: Hủy Đơn hàng khi ở trạng thái Chờ tiếp nhận
* **Phân hệ thực thi:** Phân hệ Đơn hàng & Tồn kho (`Order & Inventory Module`)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Cho phép khách hàng chủ động hủy đơn hàng đã đặt nếu đơn hàng vẫn đang ở trạng thái `PENDING` (chưa thanh toán hoặc chưa vào khâu pha chế).
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-12.1:** Nút *"Hủy đơn"* chỉ hiển thị khi đơn hàng ở trạng thái `PENDING`. Khi đơn đã sang `PREPARING`, nút hủy bị ẩn hoặc vô hiệu hóa.
  * **AC-12.2:** Khi khách hàng bấm xác nhận hủy đơn, hệ thống cập nhật trạng thái đơn thành `CANCELLED` và tự động hoàn trả số lượng tồn kho tương ứng vào cơ sở dữ liệu.

#### `FR-13`: Ghi chú Riêng cho Từng Món / Đơn hàng
* **Phân hệ thực thi:** Phân hệ Giỏ hàng & Tùy biến (`Cart & Customization Module`)
* **Mức ưu tiên:** `Could`
* **Mô tả:** Cho phép khách hàng nhập thêm ghi chú yêu cầu riêng (ví dụ: *"Ít đá riêng"*, *"Lấy thêm ống hút giấy"*) với độ dài tối đa 150 ký tự.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-13.1:** Khách hàng có thể nhập nội dung ghi chú trong trường text input tại màn hình giỏ hàng; nội dung được lưu trữ cùng bản ghi `OrderItem` hoặc `Order`.
  * **AC-13.2:** Nội dung ghi chú hiển thị đầy đủ và chính xác trên màn hình biên nhận của khách và màn hình đơn hàng của quầy pha chế.
---

## 4. Danh mục Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

### Bảng tóm tắt Yêu cầu Phi chức năng

| Mã NFR | Nhóm Yêu cầu Phi chức năng | Mức ưu tiên MoSCoW | Chỉ số Đo lường / Tiêu chuẩn Kiểm chứng |
| :---: | :--- | :---: | :--- |
| **NFR-01** | Hiệu năng & Thời gian Phản hồi | **Must** | API đọc $\le 500\text{ms}$; Giao dịch $\le 1000\text{ms}$; LCP $\le 2.5\text{s}$ |
| **NFR-02** | Toàn vẹn Dữ liệu & Xử lý Tranh chấp | **Must** | Khóa dòng `SELECT FOR UPDATE`; Idempotency Key 24h; `stock >= 0` |
| **NFR-03** | Bảo mật & An toàn Thông tin | **Must** | `bcrypt` salt $\ge 10$; JWT HS256; 100% HTTPS; Chống SQLi/XSS |
| **NFR-04** | Độ Khả dụng & Giám sát Vận hành | **Must** | Uptime $\ge 99.5\%$; Health check $\le 200\text{ms}$; Docker Compose |
| **NFR-05** | Tương thích & Trải nghiệm Di động | **Should** | Mobile-First ($360\text{px} - 430\text{px}$); Touch target $\ge 44\text{px}$ |
| **NFR-06** | Khả năng Bảo trì & Chuẩn Mã nguồn | **Should** | Modular MVC; 0 ESLint error; Conventional Commits 100% |
| **NFR-07** | Kiểm thử Tự động & CI/CD Pipeline | **Should** | GitHub Actions 100% Pass; Coverage Core Logic $\ge 80\%$ |
| **NFR-08** | Khả năng Mở rộng Quy mô (Scalability) | **Could** | Backend Stateless; Xác thực qua JWT; Sẵn sàng cho Horizontal Scaling |

---

### Chi tiết Đặc tả & Tiêu chí Chấp nhận Từng Yêu cầu Phi chức năng

#### `NFR-01`: Hiệu năng & Thời gian Phản hồi (Performance & Latency)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Hệ thống phải đảm bảo tốc độ phản hồi nhanh chóng, mượt mà nhằm đáp ứng trải nghiệm mua sắm giờ cao điểm, giảm thời gian chờ đợi của khách hàng.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-01.1 (API Đọc):** Tối thiểu 95% số lượng request đọc dữ liệu (`GET /api/v1/products`, `GET /api/v1/products/:id`, `GET /api/v1/orders/my-orders`) có thời gian phản hồi $\le 500\text{ms}$ dưới điều kiện tải thử nghiệm 50 người dùng đồng thời.
  * **AC-NFR-01.2 (API Giao dịch):** Các API xử lý transaction ghi cơ sở dữ liệu (`POST /api/v1/orders`, `POST /api/v1/payments`) có thời gian xử lý và phản hồi $\le 1000\text{ms}$.
  * **AC-NFR-01.3 (Giao diện Client):** Điểm hiệu năng Google Lighthouse trên thiết bị di động đạt $\ge 80$; chỉ số First Contentful Paint (FCP) $\le 1.8\text{s}$ và Largest Contentful Paint (LCP) $\le 2.5\text{s}$ trên đường truyền mạng di động 4G tiêu chuẩn.

#### `NFR-02`: Tính Toàn vẹn Dữ liệu & Xử lý Tranh chấp Đồng thời (Data Integrity & Concurrency)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Bảo đảm tính ACID tuyệt đối cho mọi nghiệp vụ liên quan đến kho hàng và giao dịch tài chính/điểm thưởng; triệt tiêu hoàn toàn rủi ro bán âm kho và trừ tiền trùng lặp.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-02.1 (Chống âm kho):** Thao tác kiểm tra và cập nhật tồn kho phải sử dụng Database Transaction kết hợp khóa dòng (`SELECT FOR UPDATE`). Khi chạy kịch bản kiểm thử tải với 50 requests đồng thời cùng đặt mua 1 sản phẩm có số lượng tồn kho bằng 1, kết quả kiểm chứng: Chỉ đúng 1 đơn hàng được tạo thành công, 49 request còn lại nhận thông báo lỗi hết hàng; số lượng tồn kho trong database bằng đúng 0, không bao giờ âm (`stock >= 0`).
  * **AC-NFR-02.2 (Chống trừ tiền trùng):** API thanh toán áp dụng cơ chế `Idempotency-Key` (UUIDv4) lưu trong Redis/Database. Khi gửi 5 request thanh toán lặp lại cùng kèm một `Idempotency-Key` trong khoảng thời gian 24 giờ, hệ thống chỉ thực hiện trừ tiền và xử lý đơn hàng đúng 1 lần duy nhất; 4 request sau trả về cùng một kết quả của lần đầu với mã HTTP `200 OK`.
  * **AC-NFR-02.3 (Ràng buộc điểm thưởng):** Điểm thưởng trong bảng `User` được bảo vệ bằng ràng buộc mức DB: `CHECK (points >= 0)`. Nghiệp vụ đổi điểm thưởng giảm giá đơn hàng phải thực thi trong cùng transaction tạo đơn, đảm bảo không thể xảy ra gian lận trừ điểm thành công nhưng đơn hàng lại tạo thất bại.

#### `NFR-03`: Bảo mật & An toàn Thông tin (Security & Data Protection)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Bảo vệ an toàn dữ liệu cá nhân, thông tin xác thực của người dùng và phòng ngừa các lỗ hổng bảo mật ứng dụng web phổ biến (OWASP Top 10).
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-03.1 (Mã hóa mật khẩu):** 100% mật khẩu tài khoản người dùng phải được băm bằng thuật toán `bcrypt` với hệ số salt $\ge 10$ trước khi lưu trữ vào bảng cơ sở dữ liệu. Tuyệt đối không ghi nhận mật khẩu dạng văn bản thô (plain text) trong database hay log tệp.
  * **AC-NFR-03.2 (Xác thực JWT):** Chuỗi JWT được ký bảo mật bằng thuật toán mã hóa (HS256) với khóa bí mật `JWT_SECRET` được cấu hình độc lập qua biến môi trường; thời hạn sống (TTL) của Access Token không vượt quá 24 giờ.
  * **AC-NFR-03.3 (Mã hóa đường truyền):** Toàn bộ kết nối giữa trình duyệt người dùng và hệ thống trên môi trường Production bắt buộc phải chạy qua giao thức bảo mật `HTTPS` (TLS 1.2 hoặc TLS 1.3).
  * **AC-NFR-03.4 (Phòng chống Injection & XSS):** Sử dụng Prisma ORM với cơ chế Parameterized Queries 100% cho mọi câu lệnh truy vấn, loại trừ hoàn toàn nguy cơ SQL Injection. Dữ liệu văn bản từ người dùng được xử lý thoát ký tự đặc biệt (sanitization) tự động qua cơ chế render an toàn của React/Next.js.
  * **AC-NFR-03.5 (Bảo vệ bí mật dự án):** Tuyệt đối không commit tệp chứa thông tin nhạy cảm `.env` hoặc credential lên kho mã nguồn Git; kiểm thử CI tự động quét và chặn các commit chứa secret.

#### `NFR-04`: Độ Khả dụng & Giám sát Vận hành (Availability & Observability)
* **Mức ưu tiên:** `Must`
* **Mô tả:** Đảm bảo hệ thống duy trì trạng thái hoạt động ổn định, dễ dàng theo dõi sức khỏe ứng dụng và thuận tiện đóng gói triển khai nhất quán giữa môi trường Local và Cloud.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-04.1 (Tỷ lệ sẵn sàng):** Hệ thống đạt tỷ lệ hoạt động liên tục (Uptime) $\ge 99.5\%$ trong suốt giai đoạn vận hành demo và nghiệm thu ứng dụng.
  * **AC-NFR-04.2 (Giám sát sức khỏe):** Cung cấp endpoint `GET /api/v1/health` công khai; phản hồi mã HTTP `200 OK` kèm cấu trúc JSON `{ "status": "ok", "database": "up", "timestamp": "..." }` với thời gian xử lý $\le 200\text{ms}$.
  * **AC-NFR-04.3 (Đóng gói Docker):** Cung cấp tệp `docker-compose.yml` hoàn chỉnh tại thư mục gốc; môi trường thử nghiệm bao gồm Web, API và PostgreSQL có thể khởi chạy đồng bộ, sẵn sàng hoạt động bằng câu lệnh duy nhất: `docker-compose up -d`.

#### `NFR-05`: Khả năng Tương thích & Trải nghiệm Di động (Compatibility & Mobile UX)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Thiết kế giao diện theo phong cách **Mobile-First Responsive**, tối ưu hóa trải nghiệm thao tác một tay trên màn hình điện thoại thông minh.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-05.1 (Kích thước màn hình):** Giao diện hiển thị chuẩn xác, không bị tràn ngang hoặc che khuất phần tử trên các kích thước màn hình điện thoại phổ biến từ $360\text{px}$ đến $430\text{px}$ (iPhone SE, iPhone 13/14/15, Samsung Galaxy), đồng thời tự co giãn phù hợp khi hiển thị trên màn hình Tablet ($768\text{px}$) và Desktop ($\ge 1024\text{px}$).
  * **AC-NFR-05.2 (Trình duyệt hỗ trợ):** Ứng dụng chạy mượt mà, không phát sinh lỗi giao diện trên các trình duyệt hiện đại: Chrome, Safari (iOS), Edge, Firefox (các phiên bản phát hành trong vòng 2 năm gần nhất).
  * **AC-NFR-05.3 (Vùng chạm chuẩn WCAG):** Các nút bấm chức năng chính (Thêm giỏ hàng, Đặt hàng, Thanh toán, Tăng giảm số lượng) có kích thước vùng chạm tối thiểu $44\text{px} \times 44\text{px}$, đáp ứng tiêu chuẩn tiếp cận người dùng WCAG 2.1 AA.

#### `NFR-06`: Khả năng Bảo trì & Quy chuẩn Mã nguồn (Maintainability & Clean Code)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Mã nguồn được tổ chức khoa học, dễ đọc, dễ mở rộng và tuân thủ các quy chuẩn lập trình hiện đại của NestJS và Next.js.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-06.1 (Kiến trúc phân tầng):** Backend tuân thủ kiến trúc Modular MVC (tách biệt rõ Controller, Service, DTO, Entity); Frontend phân tách rõ rệt giữa UI Component, Custom Hook và State Store (Zustand).
  * **AC-NFR-06.2 (Tiêu chuẩn Lint):** Lệnh kiểm tra mã nguồn `npm run lint` vượt qua với 0 lỗi (0 errors) trước khi tạo Pull Request.
  * **AC-NFR-06.3 (Quy ước Commit):** 100% commit trên toàn bộ các nhánh phải tuân thủ nghiêm ngặt quy ước Conventional Commits (`feat`, `docs`, `fix`, `test`, `chore`) kèm mã chức năng hệ thống (ví dụ: `feat(FR-05): xử lý tạo đơn hàng...`).

#### `NFR-07`: Kiểm thử Tự động & Tích hợp Liên tục (Testability & CI/CD)
* **Mức ưu tiên:** `Should`
* **Mô tả:** Thiết lập quy trình kiểm thử tự động và cổng chất lượng (Quality Gate) trên GitHub Actions để bảo vệ nhánh mã nguồn chính không bị lỗi hồi quy.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-07.1 (Pipeline CI):** Mọi Pull Request tạo vào nhánh chính phải tự động kích hoạt workflow GitHub Actions và bắt buộc vượt qua 100% các bước: Lint Check, Type Check, Unit Tests, Build Web & API.
  * **AC-NFR-07.2 (Độ phủ kiểm thử):** Đạt độ phủ mã nguồn (Code Coverage) $\ge 80\%$ đối với các logic nghiệp vụ quan trọng: Tính tiền giỏ hàng, cơ chế khóa dòng chống âm kho (`FR-05`) và cơ chế chống trùng thanh toán Idempotency (`FR-06`).

#### `NFR-08`: Khả năng Mở rộng Quy mô (Scalability)
* **Mức ưu tiên:** `Could`
* **Mô tả:** Cấu trúc ứng dụng cho phép mở rộng quy mô khi lượng người dùng tăng cao trong tương lai.
* **Tiêu chí chấp nhận có thể kiểm chứng (AC):**
  * **AC-NFR-08.1 (Kiến trúc Stateless):** API Server không lưu trữ phiên làm việc (Session) trong bộ nhớ ram của tiến trình máy chủ; phiên làm việc được lưu trong JWT phía Client, cho phép triển khai chạy đồng thời nhiều instance Backend phía sau Load Balancer mà không yêu cầu cơ chế sticky session.

---

## 5. Danh mục Yêu cầu Ngoài phạm vi (Won’t Have — Post-MVP / Roadmap)

Nhằm đảm bảo mục tiêu tập trung vào năng lực lõi của hệ thống, các yêu cầu sau đây được xác định rõ ràng là **nằm ngoài phạm vi thực hiện (Won't Have / Out-of-Scope)** cho phiên bản hiện tại (đồng bộ chính xác với mục 3.1 của tài liệu `context-and-scope.md`):

| Mã | Tên Yêu cầu Nằm Ngoài Phạm Vi | Lý do Không Thực Hiện Trong Đợt Này (Won't Have) | Hướng xử lý Tương lai (Roadmap) |
| :---: | :--- | :--- | :--- |
| **W-01** | Điều phối Giao hàng Bên thứ 3 (GrabExpress, Ahamove) | Mô hình phục vụ trọng tâm của BrewLite là Khách tự đến lấy (Take-away) hoặc tại bàn; không làm nghiệp vụ gọi tài xế bên ngoài. | Tích hợp Webhook đối tác vận chuyển ở phiên bản thương mại. |
| **W-02** | Cổng Thanh toán Thực tế (MoMo, VNPAY, ZaloPay, Stripe) | Tránh rủi ro pháp lý doanh nghiệp, phí dịch vụ ngân hàng và thủ tục hợp đồng merchant thực tế trong môi trường thử nghiệm. | Sử dụng kiến trúc Adapter Pattern để dễ dàng tích hợp cổng thanh toán thực tế sau này. |
| **W-03** | Nhắn tin & Gọi thoại Trực tiếp (Live Chat / VoIP) | Không cần thiết cho nghiệp vụ đặt nước tại quán; tránh làm phân mảnh thao tác tiếp nhận của nhân viên quầy. | Khách liên hệ trực tiếp tại quầy hoặc qua hotline cửa hàng. |
| **W-04** | Đăng nhập Mạng xã hội OAuth2 & OTP SMS | Tối ưu hóa hạ tầng định danh nội bộ bằng JWT; giảm thiểu phụ thuộc dịch vụ SMS Brandname của bên thứ ba. | Bổ sung ở giai đoạn thương mại hóa. |
| **W-05** | Quản lý Chuỗi Đa Chi nhánh & Nhượng quyền (Franchise) | Giữ phạm vi tập trung vào mô hình vận hành hoàn chỉnh của một cửa hàng độc lập. | Mở rộng bảng `Branch` và tách kho hàng đa điểm ở giai đoạn tiếp theo. |
| **W-06** | Tích hợp Máy POS Vật lý & Hóa đơn Điện tử (e-Invoice) | Yêu cầu thiết bị phần cứng chuyên dụng và kết nối cổng dịch vụ của cơ quan thuế nhà nước. | Xuất hóa đơn/biên nhận số qua định dạng web tiêu chuẩn. |
| **W-07** | Bảng Điều khiển Phân tích Doanh thu Chuyên sâu & Phân ca | Thuộc phạm vi phần mềm ERP/Quản trị nội bộ; MVP ưu tiên tập trung hoàn thiện luồng mua sắm của khách và xử lý đơn của quầy. | Thiết kế module Admin Portal riêng biệt ở Post-MVP. |
| **W-08** | Phân hạng Thành viên Nâng cao (Tier Loyalty: Bạc, Vàng, Kim Cương) | MVP tập trung kiểm chứng chu trình tích điểm và trừ tiền trực tiếp trên giỏ hàng; chính sách hạng thẻ nâng cao được dời sang giai đoạn tiếp theo. | Xây dựng chính sách thăng hạng thẻ và quyền lợi ưu tiên riêng ở phiên bản sau. |

---

## 6. Ma trận Phân bổ MoSCoW Toàn diện

Bảng tổng hợp phân bổ toàn bộ 22 yêu cầu (14 FRs + 8 NFRs) theo 4 mức ưu tiên MoSCoW:

```
                            TỔNG QUAN PHÂN BỔ YÊU CẦU THEO MOSCOW
┌────────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│     MUST HAVE (12 Yêu cầu)     │    SHOULD HAVE (6 Yêu cầu)    │    COULD HAVE (3 Yêu cầu)     │
│   (Bắt buộc cho MVP Cốt lõi)   │   (Quan trọng - Ưu tiên Cao)  │     (Mở rộng & Nâng cao)      │
├────────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ • FR-01: Duyệt Menu & Lọc DM   │ • FR-09: Cập nhật Trạng thái  │ • FR-13: Ghi chú riêng món    │
│ • FR-02: Chi tiết Món & Kho    │ • FR-11: Tìm kiếm Từ khóa     │ • FR-14: PWA Add to Screen    │
│ • FR-03: Tùy biến Món & Giỏ    │ • FR-12: Khách Hủy đơn PENDING│ • NFR-08: Khả năng Mở rộng    │
│ • FR-04: Đăng ký/nhập & JWT    │ • NFR-05: Tương thích Mobile  │                               │
│ • FR-05: Tạo Đơn & Khóa Kho    │ • NFR-06: Chuẩn Mã nguồn      │                               │
│ • FR-06: Mock Pay & Idempotency│ • NFR-07: CI/CD & Auto Test   │                               │
│ • FR-07: Biên nhận & Stepper   │                               │                               │
│ • FR-08: Xem Lịch sử Đơn       │                               │                               │
│ • FR-10: Tích lũy/Đổi Loyalty  │                               │                               │
│ • NFR-01: Hiệu năng & Độ trễ   │                               │                               │
│ • NFR-02: Toàn vẹn & ACID      │                               │                               │
│ • NFR-03: An toàn & Bảo mật    │                               │                               │
│ • NFR-04: Khả dụng & Healthcheck│                              │                               │
└────────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
                                 WON'T HAVE (8 Yêu cầu Post-MVP)
  W-01: Giao hàng bên thứ 3   • W-02: Cổng thanh toán thật   • W-03: Live Chat/VoIP
  W-04: OAuth2 / OTP SMS      • W-05: Quản lý Đa chi nhánh   • W-06: Máy POS & Hóa đơn đỏ
  W-07: Quản trị Báo cáo sâu  • W-08: Hạng thẻ VIP đa tầng
```

---

## 7. Khả năng Truy vết & Các Bước Kế tiếp (Traceability & Next Steps)

1. **Ma trận Truy vết Kỹ thuật (Technical Traceability Matrix):** Toàn bộ các mã yêu cầu `FR-01` đến `FR-10` và `NFR-01` đến `NFR-04` trong tài liệu này được ánh xạ trực tiếp sang các Use Case, Sơ đồ UML, File mã nguồn và Kịch bản Test tại tài liệu:
   $$\rightarrow \text{Liên kết: } \text{[docs/traceability-matrix.md](file:///e:/Hoc%20Tap/CNPM/BrewLite2/docs/traceability-matrix.md)}$$
2. **Cơ sở Xây dựng Mô hình Hệ thống (Task 2):** Các Tiêu chí chấp nhận (AC) là căn cứ định nghĩa hành vi và luồng tương tác để xây dựng trọn bộ các gói sơ đồ: Use Case Diagram, Activity Diagram, Sequence Diagram và Class Diagram tại thư mục `docs/diagrams/`.
3. **Chuẩn mực Nghiệm thu Phần mềm:** Mọi tính năng và bản sửa đổi mã nguồn chỉ được xem là hoàn tất (Definition of Done) khi thỏa mãn 100% các tiêu chí chấp nhận có thể kiểm chứng (AC) tương ứng được quy định trong tài liệu này.
