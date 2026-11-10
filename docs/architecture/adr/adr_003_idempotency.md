# ADR 003: Chống Trừ tiền Trùng lặp bằng Idempotency-Key và Cơ chế Hoàn kho khi Thanh toán Thất bại

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-17
* **Người phụ trách:** Nguyên (`nguyen`)
* **Liên kết yêu cầu / Thiết kế:** Task 2.1, Task 2.2, Task 2.3 (`Payment`, `Order`, `Ingredient`), Task 5.1, Task 5.2

---

## 1. Bối cảnh (Context)
Trong luồng đặt và thanh toán đơn hàng trên thiết bị di động (`Mobile-first / PWA`), có hai rủi ro kỹ thuật nghiêm trọng cần được kiểm soát:
1. **Rủi ro gửi trùng yêu cầu thanh toán (Duplicate Payment Requests):** Khi kết nối mạng 3G/4G/Wi-Fi của khách hàng bị chập chờn hoặc khách hàng sốt ruột nhấn liên tiếp nhiều lần vào nút "Thanh toán", ứng dụng Client có thể gửi nhiều request `POST /payments` cho cùng một đơn hàng, dẫn đến nguy cơ trừ tiền khách hàng nhiều lần.
2. **Rủi ro giam giữ tồn kho ảo khi thanh toán lỗi:** Vì nguyên liệu (`Ingredient`) đã được trừ tạm thời ở bước khởi tạo đơn hàng (`Order` ở trạng thái `PENDING`), nếu bước thanh toán qua `Mock Payment Service` thất bại (`PaymentStatus.FAILED`), lượng nguyên liệu đó sẽ bị giam giữ vĩnh viễn nếu không có cơ chế hoàn trả.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1:** Chỉ khóa nút bấm (Disable Button) ở giao diện Frontend khi đang gọi API thanh toán.
2. **Phương án 2:** Kết hợp khóa nút ở Frontend với cơ chế kiểm tra **`idempotencyKey`** bắt buộc tại tầng Backend/Database và thực hiện **Giao dịch bù trừ (`restoreStock`)** khi thanh toán thất bại.

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2**:
1. **Đảm bảo tính bất biến (Idempotency) bằng `idempotencyKey`:**
   - Thực thể `Payment` trong cơ sở dữ liệu được thiết kế có thuộc tính `idempotencyKey` (đánh chỉ mục duy nhất - `UNIQUE`).
   - Khi bắt đầu phiên thanh toán cho một `Order`, Frontend sinh một chuỗi định danh duy nhất (UUID v4) và đính kèm vào yêu cầu `POST /payments`.
   - Khi NestJS API nhận yêu cầu, hệ thống kiểm tra `idempotencyKey` trong bảng `Payment`:
     - Nếu `idempotencyKey` **đã tồn tại**: Hệ thống không gọi lại logic trừ tiền mà trả về ngay lập tức kết quả (`PaymentStatus` và `transactionId`) đã được lưu trước đó.
     - Nếu `idempotencyKey` **chưa tồn tại**: Hệ thống mới thực thi `processPayment()` qua `Mock Payment Service` và lưu bản ghi `Payment`.
2. **Cơ chế Hoàn kho nguyên liệu (Inventory Compensation) và Tích điểm:**
   - **Nhánh Thành công (`PaymentStatus.SUCCESS`):** Cập nhật trạng thái đơn hàng sang `OrderStatus.PAID`, đồng thời ghi nhận giao dịch cộng điểm thưởng vào bảng `Loyalty` và `LoyaltyTransaction` (`LoyaltyTransactionType.EARN`).
   - **Nhánh Thất bại (`PaymentStatus.FAILED`):** Cập nhật trạng thái đơn hàng sang `OrderStatus.PAYMENT_FAILED` và gọi phương thức `Ingredient.restoreStock(amount)` bên trong Transaction để cộng trả lại toàn bộ nguyên liệu của đơn hàng về kho.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **An toàn giao dịch tuyệt đối:** Ngăn chặn 100% lỗi trừ tiền trùng lặp ngay cả khi người dùng nhấn đúp, trình duyệt tự động retry khi mất mạng hoặc kẻ xấu cố tình gửi lặp request.
* **Đảm bảo tính nhất quán tồn kho:** Nguyên liệu được giải phóng ngay lập tức khi thanh toán thất bại, giúp các khách hàng khác có thể tiếp tục đặt món.

### Hạn chế & Đánh đổi (-)
* **Chi phí lưu trữ và kiểm tra:** Cần duy trì Unique Index trên cột `idempotencyKey` của bảng `Payment` và xử lý thêm bước tra cứu khóa trước mỗi giao dịch thanh toán.