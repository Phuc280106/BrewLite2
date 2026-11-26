| Mục | Nội dung |
|---|---|
| Tên use case | Thanh toán đơn hàng |
| Mã yêu cầu | FR-06 (mức ưu tiên Must) |
| Tác nhân chính | Khách hàng |
| Tác nhân phụ | Cổng VNPay Sandbox |
| API liên quan | POST /api/v1/payments/initiate (JWT); GET /api/v1/payments/vnpay/return (ReturnUrl, xác thực bằng chữ ký HMAC-SHA512) |
| Use case include | Chọn phương thức thanh toán VNPay; Sinh URL thanh toán VNPay; Xác minh chữ ký ReturnUrl; Kiểm tra giao dịch đã xử lý (khóa theo vnp_TxnRef); Cập nhật trạng thái thanh toán & đơn hàng |
| Use case extend | Trả về kết quả giao dịch cũ; Xử lý thanh toán thất bại / khách hủy trên cổng VNPay; Hủy đơn & hoàn kho khi quá 15 phút |

## Mô tả use case thanh toán đơn hàng

**Tóm tắt:** Use case được kích hoạt khi khách hàng chọn thanh toán một đơn hàng đang ở trạng thái PENDING. Hệ thống chuyển khách sang Cổng VNPay Sandbox (VNPAY-QR, thẻ ATM nội địa hoặc thẻ quốc tế), sau đó nhận kết quả khi VNPay chuyển khách về ReturnUrl, xác minh chữ ký số và đảm bảo mỗi lượt thanh toán (`vnp_TxnRef`) chỉ được ghi nhận một lần.

**Dòng sự kiện chính:**

1. Khách hàng ở màn hình Thanh toán với đơn hàng PENDING vừa tạo, chọn một phương thức VNPay (Cổng VNPay, VNPAY-QR, Thẻ ATM nội địa hoặc Thẻ quốc tế).
2. Khách hàng nhấn nút "Thanh toán qua VNPay". Hệ thống vô hiệu hóa nút và hiển thị trạng thái đang kết nối cổng VNPay.
3. Hệ thống gửi yêu cầu POST /api/v1/payments/initiate gồm mã đơn hàng, mã tab VNPay (nếu có) và JWT.
4. Hệ thống kiểm tra đơn hàng tồn tại, thuộc về khách hàng, đang ở trạng thái PENDING, chưa quá 15 phút và có giá trị tối thiểu 5.000đ.
5. Hệ thống sinh `vnp_TxnRef` duy nhất (`<orderId>_<timestamp>`), ký HMAC-SHA512 và trả về URL thanh toán VNPay Sandbox.
6. Trình duyệt chuyển khách sang Cổng VNPay; khách thanh toán thành công trên cổng.
7. VNPay chuyển khách về trang `/payment/vnpay-return`; trang này gọi GET /api/v1/payments/vnpay/return kèm toàn bộ tham số `vnp_*`.
8. Hệ thống xác minh chữ ký, kiểm tra `vnp_TxnRef` chưa được xử lý, kiểm tra đơn hàng và đối soát số tiền VNPay ghi nhận với giá trị đơn.
9. Hệ thống tạo bản ghi Payment trạng thái SUCCESS gắn với khóa chống trùng `VNPAY_<vnp_TxnRef>`, đồng thời cập nhật trạng thái đơn hàng từ PENDING sang PREPARING và cộng điểm thưởng.
10. Hệ thống trả về HTTP 200 OK; trang kết quả hiển thị thanh toán thành công và dẫn khách tới màn hình Biên nhận.

**Dòng sự kiện phụ:**

1. `vnp_TxnRef` đã được xử lý (khách tải lại trang kết quả hoặc ReturnUrl bị gọi lặp): hệ thống trả ngay kết quả giao dịch cũ với HTTP 200 OK, không tạo bản ghi Payment mới và không cộng điểm lần hai.
2. VNPay báo giao dịch không thành công (ví dụ không đủ số dư, sai OTP) hoặc khách bấm Hủy trên cổng VNPay: hệ thống ghi nhận Payment trạng thái FAILED, giữ nguyên đơn hàng ở PENDING, hiển thị thông báo lỗi để khách thanh toán lại.
3. Chữ ký số trên ReturnUrl không hợp lệ hoặc số tiền không khớp giá trị đơn hàng: hệ thống từ chối với HTTP 400, không tạo giao dịch và không đổi trạng thái đơn.
4. Đơn hàng không hợp lệ (không tồn tại, của người khác, đã thanh toán, đã CANCELLED, quá 15 phút, dưới 5.000đ): hệ thống từ chối yêu cầu khởi tạo thanh toán và thông báo cho khách hàng, không sinh URL.
5. Quá 15 phút kể từ khi tạo đơn mà chưa thanh toán thành công: hệ thống tự động hoàn lại tồn kho đã giữ và chuyển đơn sang CANCELLED.
6. Yêu cầu khởi tạo thiếu JWT hợp lệ: hệ thống trả HTTP 401 Unauthorized.
7. Khách hàng thoát khỏi màn hình thanh toán hoặc đóng cổng VNPay mà không quay về: hệ thống không tạo giao dịch, đơn hàng vẫn ở PENDING.

**Tiền điều kiện:**

1. Khách hàng đã đăng nhập và có JWT hợp lệ.
2. Đơn hàng đã được tạo thành công ở trạng thái PENDING (FR-05), chưa quá 15 phút và có giá trị từ 5.000đ trở lên.
3. Backend đã cấu hình kết nối VNPay Sandbox (`VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`).

**Hậu điều kiện:**

1. Thanh toán thành công: có đúng một bản ghi Payment SUCCESS ứng với `vnp_TxnRef`, đơn hàng đã chuyển sang trạng thái PREPARING và khách hàng được chuyển tới màn hình Biên nhận.
2. Thanh toán thất bại hoặc khách hủy trên cổng VNPay: có bản ghi Payment FAILED, đơn hàng vẫn PENDING để khách thanh toán lại.
3. Gọi lặp ReturnUrl với cùng `vnp_TxnRef`: số bản ghi Payment trong cơ sở dữ liệu không tăng thêm và điểm thưởng không bị cộng thêm.
