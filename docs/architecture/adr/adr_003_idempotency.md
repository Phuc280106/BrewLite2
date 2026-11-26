# ADR 003: Chống Ghi nhận Thanh toán Trùng lặp bằng khóa Idempotency (vnp_TxnRef) và Cơ chế Hoàn kho khi Quá hạn

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-17
* **Người phụ trách:** Nguyên (`nguyen`)
* **Liên kết yêu cầu / Thiết kế:** Task 2.1, Task 2.2, Task 2.3 (`Payment`, `Order`, `Ingredient`), Task 5.1, Task 5.2

> **Cập nhật 2026-11-25:** Thanh toán giả lập (`Mock Payment Service`, header `Idempotency-Key` do Client sinh) đã được thay bằng Cổng **VNPay Sandbox**. Nguyên tắc idempotency giữ nguyên nhưng khóa nay do Server sinh cho từng lượt thanh toán (`vnp_TxnRef`), vì khách thanh toán trên trang của VNPay chứ không gọi trực tiếp API thanh toán.

---

## 1. Bối cảnh (Context)
Trong luồng đặt và thanh toán đơn hàng trên thiết bị di động (`Mobile-first / PWA`), có hai rủi ro kỹ thuật nghiêm trọng cần được kiểm soát:
1. **Rủi ro ghi nhận trùng kết quả thanh toán (Duplicate Payment Results):** Khi kết nối mạng của khách hàng bị chập chờn, khách tải lại trang kết quả hoặc trình duyệt tự động gọi lại, ReturnUrl `GET /payments/vnpay/return` có thể được gọi nhiều lần cho cùng một giao dịch VNPay, dẫn đến nguy cơ ghi nhận thanh toán và cộng điểm thưởng nhiều lần.
2. **Rủi ro giam giữ tồn kho ảo khi thanh toán lỗi:** Vì nguyên liệu (`Ingredient`) đã được trừ tạm thời ở bước khởi tạo đơn hàng (`Order` ở trạng thái `PENDING`), nếu khách không thanh toán thành công qua Cổng VNPay, lượng nguyên liệu đó sẽ bị giam giữ vĩnh viễn nếu không có cơ chế hoàn trả.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1:** Chỉ chặn ở giao diện Frontend (khóa nút, không cho tải lại trang kết quả).
2. **Phương án 2:** Kiểm tra **`idempotencyKey`** (duy nhất theo từng lượt thanh toán VNPay) tại tầng Backend/Database và tự động **hoàn kho** khi đơn quá 15 phút chưa thanh toán thành công.

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2**:
1. **Đảm bảo tính bất biến (Idempotency) bằng `idempotencyKey`:**
   - Thực thể `Payment` trong cơ sở dữ liệu có thuộc tính `idempotencyKey` (đánh chỉ mục duy nhất - `UNIQUE`).
   - Khi khách bấm thanh toán, Backend sinh `vnp_TxnRef` duy nhất (`<orderId>_<timestamp>`) và gắn vào URL VNPay. Khi VNPay chuyển khách về ReturnUrl, `idempotencyKey` của giao dịch là `VNPAY_<vnp_TxnRef>`.
   - Khi NestJS API nhận ReturnUrl (sau khi xác minh chữ ký HMAC-SHA512), hệ thống kiểm tra `idempotencyKey` trong bảng `Payment`:
     - Nếu **đã tồn tại**: trả ngay kết quả (`PaymentStatus`, `transactionId`) đã lưu, không ghi thêm bản ghi và không cộng điểm lần nữa.
     - Nếu **chưa tồn tại**: đối soát số tiền với đơn hàng rồi mới lưu bản ghi `Payment`. Hai lần gọi song song bị Unique Index chặn, bên thua nhận lại kết quả của bên thắng.
2. **Cập nhật đơn hàng và Hoàn kho nguyên liệu (Inventory Compensation):**
   - **Nhánh Thành công (`PaymentStatus.SUCCESS`):** Trong cùng một Transaction, chuyển đơn từ `PENDING` sang `OrderStatus.PREPARING` (chỉ khi đơn vẫn còn `PENDING`, tránh đua với tiến trình tự hủy), ghi nhận cộng điểm vào `Loyalty` và `LoyaltyTransaction` (`LoyaltyTransactionType.EARN`).
   - **Nhánh Thất bại hoặc khách hủy trên cổng VNPay (`PaymentStatus.FAILED`):** Ghi nhận `Payment` FAILED và giữ đơn ở `PENDING` để khách thanh toán lại. Nếu quá 15 phút vẫn chưa thanh toán thành công, `OrderExpiryScheduler` chuyển đơn sang `CANCELLED` và hoàn trả toàn bộ nguyên liệu về kho trong Transaction.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **An toàn giao dịch tuyệt đối:** Ngăn chặn 100% lỗi trừ tiền trùng lặp ngay cả khi người dùng nhấn đúp, trình duyệt tự động retry khi mất mạng hoặc kẻ xấu cố tình gửi lặp request.
* **Đảm bảo tính nhất quán tồn kho:** Nguyên liệu được giải phóng ngay lập tức khi thanh toán thất bại, giúp các khách hàng khác có thể tiếp tục đặt món.

### Hạn chế & Đánh đổi (-)
* **Chi phí lưu trữ và kiểm tra:** Cần duy trì Unique Index trên cột `idempotencyKey` của bảng `Payment` và xử lý thêm bước tra cứu khóa trước mỗi giao dịch thanh toán.