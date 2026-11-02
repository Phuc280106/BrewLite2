# ĐẶC TẢ USE CASE: QUẢN LÝ GIỎ HÀNG, TÍNH TỔNG TIỀN VÀ KHUYẾN MÃI (CART)
**Mã chức năng:** `FR-03`, `FR-10`  
**Phân hệ:** Giỏ hàng & Tùy biến (`Cart & Customization Module`)  
**Tài liệu tham chiếu:** `docs/requirements/srs-summary.md`, `docs/requirements/context-and-scope.md`  

---

## 1. Thông tin chung

* **Mã Use Case:** `UC-CART-01`
* **Tên Use Case:** Quản lý Giỏ hàng, Tính tổng tiền và Áp dụng Khuyến mãi / Điểm thưởng
* **Mã Yêu cầu liên quan:**
  * `FR-03`: Tùy biến món (Size/Topping) & Quản lý giỏ hàng (`AC-03.1` $\rightarrow$ `AC-03.5`)
  * `FR-10`: Tích lũy Điểm thưởng & Đổi Điểm Giảm giá (`AC-10.2`, `AC-10.3`, `AC-10.4`)
* **Yêu cầu phi chức năng liên quan:**
  * `NFR-01`: Hiệu năng & độ trễ tính toán client-side $\le 100\text{ms}$
  * `NFR-05`: Giao diện Mobile-first, nút thao tác touch target $\ge 44\text{px}$
  * `NFR-06`: Quản lý trạng thái client phân tầng rõ ràng qua Zustand Store và đồng bộ `localStorage`
* **Tác nhân chính (Primary Actor):** Khách hàng (kể cả khách vãng lai và thành viên đã đăng nhập)
* **Các Use Case thành phần:**
  1. `UC-CART-01.1`: Thêm món vào giỏ hàng (`AddToCart`)
  2. `UC-CART-01.2`: Xem giỏ hàng (`ViewCart`)
  3. `UC-CART-01.3`: Cập nhật số lượng món (`UpdateItemQuantity`)
  4. `UC-CART-01.4`: Xóa món khỏi giỏ hàng (`RemoveFromCart`)
  5. `UC-CART-01.5`: Làm rỗng giỏ hàng (`ClearCart`)
  6. `UC-CART-01.6`: Áp dụng đổi điểm thưởng / Giảm giá (`ApplyLoyaltyDiscount` - dành cho thành viên)

---

## 2. Tiền điều kiện & Hậu điều kiện

* **Tiền điều kiện:**
  * Người dùng đang mở ứng dụng web BrewLite trên trình duyệt máy tính hoặc thiết bị di động.
  * Danh mục sản phẩm đã được tải thành công từ Backend API.
* **Hậu điều kiện:**
  * **Thành công:**
    * Giỏ hàng trong Zustand store và `localStorage` được cập nhật đồng bộ, chính xác.
    * Tổng số lượng món hiển thị trên Badge Giỏ hàng của Header được cập nhật tức thì.
    * Tổng tiền đơn hàng tạm tính và tổng thanh toán sau chiết khấu được tính toán lại chính xác.
  * **Thất bại:** Trạng thái giỏ hàng trước đó được bảo toàn, hiển thị thông báo lỗi phù hợp cho người dùng nếu thao tác không hợp lệ.

---

## 3. Công thức tính toán tổng tiền nghiệp vụ

Tổng giá trị từng dòng sản phẩm (dòng món) được tính theo công thức:
$$\text{ItemTotal} = \left(\text{basePrice} + \text{sizePrice} + \sum \text{toppingPrices}\right) \times \text{quantity}$$

Tổng giá trị đơn hàng trước giảm giá (Tạm tính):
$$\text{Subtotal} = \sum_{i=1}^{n} \text{ItemTotal}_i$$

Số tiền giảm giá qua điểm thưởng (nếu người dùng đổi $D$ điểm thưởng, $1 \text{ điểm} = 1.000 \text{ VNĐ}$):
$$\text{Discount} = D \times 1.000 \text{ VNĐ} \quad (0 \le D \le \text{userPoints}, \, \text{Discount} \le \text{Subtotal})$$

Tổng tiền thanh toán cuối cùng:
$$\text{GrandTotal} = \max(0, \text{Subtotal} - \text{Discount})$$

---

## 4. Kịch bản hoạt động chi tiết (Flow of Events)

### 4.1. Luồng chính 1: Thêm món vào giỏ hàng (UC-CART-01.1)
1. Tại màn hình Thực đơn hoặc Chi tiết sản phẩm, Khách hàng tùy chọn Size, Sugar, Ice, Toppings và bấm **"Thêm vào giỏ"**.
2. Hệ thống (Frontend - `CartStore`) kiểm tra xem sản phẩm cùng bộ tùy chọn (Size, Đường, Đá, Toppings) đã tồn tại trong giỏ chưa:
   - **Trường hợp đã tồn tại:** Tăng trường `quantity` của mục tương ứng lên theo số lượng vừa thêm.
   - **Trường hợp chưa tồn tại (hoặc khác bất kỳ tùy biến nào):** Tạo một mục mới (`CartItem`) với `id` định danh duy nhất và đưa vào mảng items trong Zustand Store.
3. Hệ thống tự động tính lại tổng tiền (`subtotal`, `grandTotal`) và lưu trạng thái vào `localStorage`.
4. Header Badge cập nhật tổng số lượng món tức thì.
5. Hiển thị thông báo Toast *"Đã thêm món vào giỏ hàng thành công"*.

### 4.2. Luồng chính 2: Xem và điều chỉnh giỏ hàng (UC-CART-01.2, UC-CART-01.3, UC-CART-01.4)
1. Khách hàng bấm vào biểu tượng Giỏ hàng trên thanh Header điều hướng đến `/cart`.
2. Hệ thống đọc trạng thái từ Zustand Store (đồng bộ với `localStorage` nếu vừa tải lại trang):
   - Nếu giỏ hàng trống: Hiển thị giao diện giỏ hàng trống (`EmptyCart`) kèm nút *"Khám phá Menu ngay"*.
   - Nếu giỏ hàng có món: Hiển thị danh sách từng món kèm ảnh, tên, tùy chọn size/đường/đá/topping, đơn giá dòng món, bộ nút tăng `(+)` / giảm `(-)` số lượng, nút xóa `(Trash)`.
3. **Khách hàng tăng/giảm số lượng:**
   - Bấm `(+)`: `quantity = quantity + 1`. Hệ thống tính lại giá dòng món và tổng tiền giỏ hàng ngay lập tức.
   - Bấm `(-)`:
     - Nếu `quantity > 1`: Giảm `quantity = quantity - 1`.
     - Nếu `quantity == 1`: Hiển thị hộp thoại xác nhận xóa món khỏi giỏ hàng. Nếu người dùng chọn đồng ý, món sẽ được xóa khỏi giỏ.
4. **Khách hàng bấm xóa món:**
   - Hệ thống xóa `CartItem` đó khỏi mảng items.
   - Cập nhật lại toàn bộ `subtotal`, `discount`, `grandTotal` và đồng bộ `localStorage`.

### 4.3. Luồng chính 3: Áp dụng đổi điểm thưởng giảm giá (UC-CART-01.6)
1. Tại màn hình Giỏ hàng, hệ thống kiểm tra trạng thái đăng nhập của khách hàng:
   - Nếu chưa đăng nhập: Hiển thị thông báo gợi ý *"Đăng nhập để sử dụng điểm thưởng tích lũy"*.
   - Nếu đã đăng nhập: Hiển thị ô nhập điểm đổi thưởng kèm thông tin số dư điểm hiện có (`userPoints`).
2. Khách hàng nhập số điểm $D$ muốn quy đổi và nhấn **"Áp dụng"**.
3. Hệ thống kiểm tra tính hợp lệ:
   - $0 \le D \le \text{userPoints}$
   - $D \times 1.000 \le \text{Subtotal}$
4. Hệ thống ghi nhận mức giảm giá `discount = D * 1000` và tính lại `grandTotal = Subtotal - discount`.
5. Giao diện hiển thị dòng Chiết khấu điểm thưởng màu xanh lá: `"-X.000 đ"`.

### 4.4. Luồng chính 4: Chuyển tiếp sang Đặt hàng (Tiếp nối Module 5)
1. Khách hàng kiểm tra thông tin giỏ hàng và nhấn nút **"Tiến hành đặt hàng"**.
2. Hệ thống kiểm tra số lượng món trong giỏ:
   - Nếu giỏ rỗng: Khóa nút bấm và hiển thị cảnh báo.
   - Nếu hợp lệ: Điều hướng người dùng sang trang thanh toán/xác nhận đơn hàng `/checkout`, truyền dữ liệu giỏ hàng để Backend xử lý tạo đơn và khóa tồn kho (`FR-05`).

---

## 5. Các luồng ngoại lệ và xử lý biên (Exception Flows)

* **E1. Nhập số điểm đổi vượt quá số dư:**
  * Tại bước đổi điểm, khách hàng nhập $D > \text{userPoints}$.
  * Hệ thống hiển thị thông báo lỗi: *"Số điểm quy đổi không được vượt quá số dư hiện có"* và không áp dụng chiết khấu.
* **E2. Số điểm đổi vượt quá tổng tiền món:**
  * Khách hàng nhập số điểm có giá trị quy đổi lớn hơn `Subtotal`.
  * Hệ thống tự động giới hạn mức điểm tối đa có thể áp dụng bằng $\lfloor \text{Subtotal} / 1000 \rfloor$ điểm.
* **E3. Trình duyệt chặn hoặc lỗi bộ nhớ `localStorage`:**
  * Giỏ hàng vẫn duy trì trong bộ nhớ RAM qua Zustand Store cho phiên truy cập hiện tại. Khi lưu thất bại, hệ thống log warning nhẹ nhàng mà không gây crash trang.
