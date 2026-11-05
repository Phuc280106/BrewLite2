| Mục | Nội dung |
|---|---|
| Tên use case | Thanh toán đơn hàng |
| Mã yêu cầu | FR-06 (mức ưu tiên Must) |
| Tác nhân chính | Khách hàng |
| Tác nhân phụ | Cổng thanh toán mô phỏng |
| API liên quan | POST /api/v1/payments (header Idempotency-Key) |
| Use case include | Chọn phương thức thanh toán; Sinh Idempotency-Key; Kiểm tra Idempotency-Key; Xử lý giao dịch mô phỏng; Cập nhật trạng thái thanh toán & đơn hàng |
| Use case extend | Trả về kết quả giao dịch cũ; Xử lý thanh toán thất bại; Hủy đơn & hoàn kho khi quá 15 phút |

## Mô tả use case thanh toán đơn hàng

**Tóm tắt:** Use case được kích hoạt khi khách hàng chọn thanh toán một đơn hàng đang ở trạng thái PENDING. Hệ thống cho phép khách hàng chọn thẻ hoặc ví điện tử giả lập, gửi yêu cầu thanh toán kèm Idempotency-Key và đảm bảo mỗi lượt thanh toán chỉ tạo một giao dịch duy nhất.

**Dòng sự kiện chính:**

1. Khách hàng ở màn hình Thanh toán với đơn hàng PENDING vừa tạo, chọn phương thức MOCK_CARD hoặc MOCK_WALLET.
2. Hệ thống sinh một Idempotency-Key (UUIDv4) riêng cho lượt thanh toán này.
3. Khách hàng nhấn nút "Thanh toán". Hệ thống vô hiệu hóa nút và hiển thị trạng thái đang xử lý.
4. Hệ thống gửi yêu cầu POST /api/v1/payments gồm mã đơn hàng, phương thức thanh toán, JWT và header Idempotency-Key.
5. Hệ thống kiểm tra Idempotency-Key và xác nhận key chưa được dùng trong 24 giờ qua.
6. Hệ thống kiểm tra đơn hàng tồn tại, thuộc về khách hàng và đang ở trạng thái PENDING.
7. Hệ thống gửi yêu cầu tới Cổng thanh toán mô phỏng và nhận kết quả giao dịch thành công.
8. Hệ thống tạo bản ghi Payment trạng thái SUCCESS gắn với Idempotency-Key, đồng thời cập nhật trạng thái đơn hàng từ PENDING sang PREPARING.
9. Hệ thống trả về HTTP 200 OK và chuyển khách hàng sang màn hình Biên nhận.

**Dòng sự kiện phụ:**

1. Idempotency-Key đã tồn tại (khách bấm nhiều lần hoặc mạng chập chờn nên client gửi lại): hệ thống trả ngay kết quả giao dịch cũ với HTTP 200 OK, không trừ tiền và không tạo bản ghi Payment mới.
2. Giao dịch mô phỏng bị từ chối (ví dụ thẻ bị từ chối): hệ thống ghi nhận Payment trạng thái FAILED, giữ nguyên đơn hàng ở PENDING, hiển thị thông báo lỗi để khách thanh toán lại.
3. Đơn hàng không hợp lệ (không tồn tại, đã thanh toán hoặc đã CANCELLED): hệ thống từ chối yêu cầu và thông báo cho khách hàng, không tạo giao dịch.
4. Quá 15 phút kể từ khi tạo đơn mà chưa thanh toán thành công: hệ thống tự động hoàn lại tồn kho đã giữ và chuyển đơn sang CANCELLED.
5. Yêu cầu thiếu JWT hợp lệ: hệ thống trả HTTP 401 Unauthorized. Yêu cầu thiếu Idempotency-Key: hệ thống từ chối với lỗi yêu cầu không hợp lệ.
6. Khách hàng thoát khỏi màn hình thanh toán trước khi bấm "Thanh toán": hệ thống không tạo giao dịch, đơn hàng vẫn ở PENDING.

**Tiền điều kiện:**

1. Khách hàng đã đăng nhập và có JWT hợp lệ.
2. Đơn hàng đã được tạo thành công ở trạng thái PENDING (FR-05) và chưa quá 15 phút.
3. Hệ thống tải được màn hình Thanh toán và các phương thức thanh toán giả lập.

**Hậu điều kiện:**

1. Thanh toán thành công: có đúng một bản ghi Payment SUCCESS ứng với Idempotency-Key, đơn hàng đã chuyển sang trạng thái tiếp theo và khách hàng được chuyển tới màn hình Biên nhận.
2. Thanh toán thất bại: có bản ghi Payment FAILED, đơn hàng vẫn PENDING để khách thanh toán lại.
3. Gửi lặp cùng Idempotency-Key: số bản ghi Payment trong cơ sở dữ liệu không tăng thêm.
