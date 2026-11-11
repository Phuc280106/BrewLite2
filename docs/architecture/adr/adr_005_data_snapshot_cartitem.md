# ADR 005: Lưu vết Dữ liệu Lịch sử Đơn hàng (Data Snapshot trên Order và OrderItem)

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-18
* **Người phụ trách:** Phúc (`phuc`) & Tuấn Thành (`tuan-thanh`)
* **Liên kết yêu cầu / Thiết kế:** Task 2.3 (`Order`, `OrderItem`, `Product`, `Size`, `Topping`, `Promotion`), Task 5.1

---

## 1. Bối cảnh (Context)
Trong quá trình vận hành thực tế của cửa hàng đồ uống **BrewLite**, thông tin danh mục sản phẩm luôn biến động theo thời gian:
- Cửa hàng có thể điều chỉnh giá gốc của sản phẩm (`Product.basePrice`), thay đổi phụ phí kích cỡ (`Size.priceAdjustment`), cập nhật giá `Topping` (`Topping.price`) hoặc đổi tên hiển thị của món (`Product.name`).
- Nếu bảng chi tiết đơn hàng (`OrderItem`) chỉ lưu khóa ngoại (`productId`, `sizeId`) và tính tổng tiền bằng cách `JOIN` trực tiếp sang bảng `Product` và `Size` hiện tại, thì toàn bộ biên nhận và lịch sử đơn hàng cũ của khách hàng sẽ bị thay đổi sai lệch mỗi khi cửa hàng cập nhật bảng giá mới.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1 (Chuẩn hóa hoàn toàn - 3NF):** Bảng `OrderItem` chỉ lưu `productId`, `sizeId` và `quantity`. Khi xem lịch sử đơn sẽ truy vấn ngược về bảng `Product` để lấy tên và giá.
2. **Phương án 2 (Data Snapshot / Controlled Denormalization):** Chụp ảnh trạng thái dữ liệu (tên món, đơn giá đã cộng phụ phí, tổng tiền giảm giá) tại đúng thời điểm đặt đơn và lưu cứng vào bảng `Order` và `OrderItem`.

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2 (Kỹ thuật Data Snapshot)**:
1. **Không tin tưởng giá từ Client & Tính toán tại Backend:**
   - Khi nhận yêu cầu `POST /orders`, Backend NestJS không sử dụng giá tiền do trình duyệt gửi lên mà truy vấn trực tiếp từ PostgreSQL (`Product.basePrice`, `Size.priceAdjustment`, `Topping.price`, `Promotion`, `Loyalty`) để tính toán số tiền chính xác tại thời điểm giao dịch.
2. **Lưu vết bất biến trên `OrderItem` và `Order`:**
   - Trên thực thể `OrderItem`: Lưu cứng tên sản phẩm tại thời điểm mua (`productName`) và đơn giá thực tế của 1 ly đã bao gồm phụ phí Size/Topping (`unitPrice`), bên cạnh các liên kết ghi nhận trạng thái với `Product`, `Size` và `Topping`.
   - Trên thực thể `Order`: Lưu cứng tổng tiền đơn hàng (`totalAmount`), số tiền được giảm giá từ khuyến mãi/điểm thưởng (`discountAmount`) và số điểm đã sử dụng (`pointsRedeemed`).

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **Tính toàn vẹn lịch sử tuyệt đối:** Biên nhận đơn hàng và màn hình Lịch sử đơn hàng (Task 5.1) luôn hiển thị đúng số tiền và tên món mà khách đã thanh toán tại thời điểm đặt, bất chấp việc menu sau này tăng/giảm giá.
* **Tăng tốc độ truy vấn Lịch sử đơn (`GET /orders`):** Khi hiển thị danh sách đơn hàng cũ, hệ thống có sẵn `productName`, `unitPrice` và `totalAmount` ngay trên `Order` và `OrderItem` mà không cần thực hiện các phép tính cộng dồn phức tạp lại từ đầu.

### Hạn chế & Đánh đổi (-)
* **Dư thừa dữ liệu có kiểm soát (Controlled Denormalization):** Tốn thêm một lượng nhỏ dung lượng lưu trữ cho trường `productName` và `unitPrice` trên mỗi dòng `OrderItem`, nhưng đây là sự đánh đổi bắt buộc trong mọi hệ thống thương mại điện tử và F&B.