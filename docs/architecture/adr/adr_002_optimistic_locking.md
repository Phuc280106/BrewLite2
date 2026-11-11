# ADR 002: Quản lý Tồn kho theo Công thức Nguyên liệu và Kiểm soát Đồng thời bằng Khóa Lạc quan (Optimistic Locking)

* **Trạng thái:** Đã chấp nhận (Accepted)
* **Ngày quyết định:** 2026-10-16
* **Người phụ trách:** Phúc (`phuc`)
* **Liên kết yêu cầu / Thiết kế:** Task 2.1, Task 2.2, Task 2.3 (`Product`, `Size`, `Ingredient`, `RecipeItems`), Task 5.1

---

## 1. Bối cảnh (Context)
Trong nghiệp vụ đặt đồ uống trực tuyến của **BrewLite**, bài toán quản lý tồn kho gặp hai thách thức thực tế:
1. **Định mức tiêu hao theo kích cỡ (Size):** Một sản phẩm đồ uống (`Product`) có nhiều kích cỡ (`Size` S, M, L). Mỗi kích cỡ tiêu thụ một lượng nguyên liệu pha chế (`Ingredient` như hạt cà phê, sữa tươi, trân châu) khác nhau. Nếu chỉ lưu một cột số lượng tồn kho tĩnh trên bảng `Product` sẽ không phản ánh chính xác lượng nguyên liệu thực tế tại cửa hàng.
2. **Xung đột đồng thời vào giờ cao điểm (Race Condition):** Khi nhiều khách hàng cùng bấm đặt đơn (`POST /orders`) cho các món dùng chung nguyên liệu sắp hết vào cùng một thời điểm, hệ thống có nguy cơ đọc cùng một giá trị tồn kho cũ và dẫn đến tình trạng bán âm kho (Overselling).

---

## 2. Các Phương án Cân nhắc (Considered Options)
1. **Phương án 1:** Lưu cột `stock` cố định trên bảng `Product` và dùng Khóa bi quan (Pessimistic Locking - `SELECT ... FOR UPDATE` qua Raw SQL).
2. **Phương án 2:** Quản lý tồn kho theo Công thức Nguyên liệu (`Ingredient` + `RecipeItems`) kết hợp **Khóa lạc quan (Optimistic Concurrency Control)** qua trường `version` trong `Database Transaction`.

---

## 3. Quyết định (Decision)
Nhóm quyết định chọn **Phương án 2**:
1. **Mô hình hóa tồn kho theo công thức (`Ingredient` & `RecipeItems`):**
   - Thực thể `Ingredient` lưu trữ số lượng tồn kho thực tế (`stock`) theo đơn vị (`unit`) và phiên bản bản ghi (`version`).
   - Thực thể `RecipeItems` định nghĩa định mức nguyên liệu cần thiết (`requiredAmount`) cho từng cặp `productId` và `sizeId`.
   - Trạng thái còn hàng (`Product.isInStock(sizeId)`) và số lượng có thể phục vụ (`Product.calculateAvailableStock(sizeId)`) được tính toán động dựa trên tỷ lệ giữa `Ingredient.stock` và `RecipeItems.requiredAmount`.
2. **Kiểm soát đồng thời bằng Khóa lạc quan (`version`) trong ACID Transaction:**
   - Khi khách hàng khởi tạo đơn hàng (`POST /orders`), hệ thống mở một `Prisma Interactive Transaction`.
   - Hệ thống đọc giá trị `stock` và `version` hiện tại (`currentVersion`) của các `Ingredient` liên quan.
   - Gọi phương thức `Ingredient.deductStock(amount, currentVersion)`: thực thi lệnh `UPDATE` với điều kiện kép `WHERE ingredientId = ? AND version = currentVersion AND stock >= requiredAmount`, đồng thời giảm `stock` và tăng `version = version + 1`.
   - Nếu bất kỳ nguyên liệu nào không cập nhật được (do `stock < requiredAmount` hoặc `version` đã bị thay đổi bởi một giao dịch khác vừa hoàn tất trước đó), toàn bộ Transaction sẽ **Rollback** ngay lập tức và trả về mã lỗi `409 Conflict (Out of Stock / Concurrency Conflict)`.

---

## 4. Hệ quả và Sự đánh đổi (Consequences & Trade-offs)

### Ưu điểm (+)
* **Phản ánh đúng nghiệp vụ F&B:** Quản lý chính xác nguyên liệu dùng chung giữa nhiều món và nhiều kích cỡ (`Size`).
* **Không gây nghẽn (Non-blocking) cơ sở dữ liệu:** Không khóa cứng các dòng dữ liệu trong PostgreSQL khi thực hiện truy vấn đọc, giúp hệ thống duy trì tốc độ phản hồi cao khi nhiều người dùng cùng xem menu và đặt món.
* **Tương thích hoàn hảo với Prisma ORM:** Triển khai trực tiếp qua cơ chế kiểm tra `version` và `updateMany` trong `prisma.$transaction` mà không phụ thuộc vào các câu lệnh Raw SQL phức tạp.

### Hạn chế & Đánh đổi (-)
* **Phức tạp hóa truy vấn tính tồn kho:** Khi hiển thị chi tiết món, hệ thống cần kết nối (`JOIN`) qua bảng `RecipeItems` và `Ingredient` để tính toán `calculateAvailableStock(sizeId)`.
* **Xử lý thử lại khi xung đột:** Khi hai giao dịch chạm vào cùng một nguyên liệu tại đúng một mili-giây, giao dịch đến sau sẽ bị từ chối (`409 Conflict`) và yêu cầu người dùng xác nhận lại.