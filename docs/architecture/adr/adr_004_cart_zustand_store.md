# ADR 004: Quản lý Trạng thái Giỏ hàng Kết hợp (Hybrid Cart: Client Zustand Store & Database Cart)

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-17
* **Người phụ trách:** Mai Thành (`mai-thanh`)
* **Liên kết yêu cầu / Thiết kế:** Task 2.1, Task 2.3 (`Cart`, `CartItem`, `Promotion`), Task 5.1

---

## 1. Bối cảnh (Context)
Theo yêu cầu nghiệp vụ của **BrewLite** (Mục 4.1 - Task 2.1), người dùng có thể truy cập ứng dụng, xem menu, tùy chọn `Size`/`Topping` và thêm đồ uống vào giỏ hàng ngay cả khi **chưa đăng nhập**, và chỉ bắt buộc xác thực (`JWT`) khi tiến hành Đặt đơn & Thanh toán. 

Đồng thời, mô hình miền dữ liệu (`class-domain.puml`) của hệ thống có các thực thể `Cart` và `CartItem` gắn với `User` để lưu trữ giỏ hàng bền vững. Nhóm cần một kiến trúc quản lý trạng thái giỏ hàng vừa mượt mà trên thiết bị di động (Mobile-first PWA), vừa hỗ trợ khách chưa đăng nhập, vừa đồng bộ được với cơ sở dữ liệu PostgreSQL.

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1 (Thuần Client State):** Chỉ lưu giỏ hàng trong `localStorage` bằng `Zustand Store`, không có bảng `Cart` trong Database.
2. **Phương án 2 (Thuần Server State):** Mọi thao tác thêm/sửa/xóa giỏ hàng đều bắt buộc gọi API lưu trực tiếp vào bảng `Cart` trong Database và yêu cầu đăng nhập ngay từ đầu.
3. **Phương án 3 (Hybrid Cart State Management):** Kết hợp **`Zustand Store`** tại Frontend Next.js và đồng bộ với bảng **`Cart` / `CartItem`** trong PostgreSQL khi người dùng đã xác thực.

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 3 (Mô hình Giỏ hàng Kết hợp - Hybrid Cart)**:
1. **Tại tầng Frontend (`Next.js` - `Zustand Store`):**
   - Sử dụng `Zustand` (kèm middleware `persist` lưu vào `localStorage`) để quản lý danh sách món đang chọn, phản hồi tức thời (0ms latency) trên giao diện khi khách tăng/giảm số lượng, đổi `Size` hoặc chọn thêm `Topping`.
   - Khi khách hàng **chưa đăng nhập**, toàn bộ dữ liệu giỏ hàng được giữ an toàn trong `Zustand Store`. Sau khi khách chuyển sang màn hình Đăng nhập và nhận được `JWT`, giỏ hàng không bị mất đi.
2. **Tại tầng Backend (`NestJS` & `PostgreSQL` - Thực thể `Cart` và `CartItem`):**
   - Khi người dùng đã đăng nhập (`User`), trạng thái giỏ hàng từ `Zustand Store` được đồng bộ xuống bảng `Cart` (`addItem`, `removeItem`, `updateQuantity`, `clearCart`, `calculateTotal`) và `CartItem` (tham chiếu tới `Product`, `Size`, `Topping`).
   - Việc kiểm tra mã khuyến mãi (`Promotion`) và điều kiện giá trị đơn tối thiểu (`minimumOrderAmount`) được xác thực bởi Backend API để đảm bảo tính chính xác trước khi chuyển sang bước Đặt đơn.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **Trải nghiệm người dùng (UX) tối ưu trên Mobile PWA:** Các thao tác thêm món, cập nhật số lượng trên màn hình điện thoại diễn ra mượt mà ngay lập tức nhờ `Zustand Store`.
* **Đáp ứng trọn vẹn luồng "Chưa đăng nhập":** Khách vãng lai thoải mái chọn món vào giỏ, chỉ cần đăng nhập một lần ở bước Checkout mà không phải chọn lại từ đầu.
* **Lưu trữ bền vững đa thiết bị:** Đối với thành viên đã đăng nhập, dữ liệu giỏ hàng được bảo toàn trong bảng `Cart` và `CartItem` của PostgreSQL.

### Hạn chế & Đánh đổi (-)
* **Chi phí đồng bộ trạng thái:** Cần xử lý hàm đồng bộ (sync/merge) dữ liệu từ `Zustand Store` lên bảng `Cart`/`CartItem` ngay sau sự kiện đăng nhập thành công và xóa đồng thời cả hai nơi (`clearCart()`) sau khi đặt đơn thành công.