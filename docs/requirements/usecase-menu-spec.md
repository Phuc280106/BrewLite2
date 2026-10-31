# ĐẶC TẢ USE CASE: PHÂN HỆ THỰC ĐƠN & TÌM KIẾM ĐỒ UỐNG (MODULE 1)

## 1. Tổng quan
* **Mã chức năng:** FR-01, FR-02
* **Tên phân hệ:** Hiển thị Menu, Lọc theo Danh mục & Tìm kiếm đồ uống
* **Tác nhân chính (Primary Actor):** Khách hàng (Người dùng truy cập ứng dụng/web BrewLite)
* **Các Use Case thành phần:**
  1. `UC-01.1`: Xem menu (Use Case cơ sở)
  2. `UC-01.2`: Lọc theo danh mục (`<<extend>>` từ Xem menu)
  3. `UC-01.3`: Tìm kiếm món (`<<extend>>` từ Xem menu)
  4. `UC-01.4`: Xem chi tiết món (`<<extend>>` từ Xem menu)

---

## 2. Đặc tả chi tiết Use Case tổng hợp (UC-01)

| Mục | Nội dung chi tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-01** (Bao gồm FR-01, FR-02) |
| **Tên Use Case** | Xem thực đơn, Lọc danh mục và Tìm kiếm đồ uống |
| **Tác nhân (Actor)** | Khách hàng (kể cả khách vãng lai chưa đăng nhập và thành viên đã đăng nhập) |
| **Mô tả (Description)** | Cho phép khách hàng truy cập vào ứng dụng BrewLite để duyệt danh sách các món đồ uống hiện có, lọc món theo từng danh mục (Cà phê, Trà, Đá xay,...), tìm kiếm món theo từ khóa và xem thông tin chi tiết của một món cụ thể. |
| **Điều kiện tiên quyết (Pre-conditions)** | - Hệ thống Backend (`NestJS`) và Cơ sở dữ liệu (`PostgreSQL`) đang hoạt động.<br>- Database đã được nạp sẵn dữ liệu mẫu (Seed script: tối thiểu 8–10 món nước, topping và danh mục mẫu).<br>- Thiết bị của khách hàng có kết nối Internet và truy cập vào ứng dụng Web/PWA (`Next.js`). |
| **Điều kiện kích hoạt (Trigger)** | Khách hàng truy cập vào trang chủ hoặc điều hướng đến màn hình Thực đơn (`/menu`). |
| **Điều kiện sau (Post-conditions)** | - **Thành công:** Danh sách đồ uống hoặc thông tin chi tiết món được hiển thị đầy đủ, chính xác trên màn hình của khách hàng.<br>- **Thất bại:** Hệ thống hiển thị thông báo trạng thái trống (`EmptyState`) hoặc trạng thái lỗi (`ErrorState`) thân thiện với người dùng. |

---

## 3. Kịch bản hoạt động (Flows of Events)

### 3.1. Luồng sự kiện chính (Basic Flow) - `Xem menu`
1. **Khách hàng** truy cập vào màn hình Thực đơn (`/menu` - `src/app/menu/page.tsx`).
2. **Hệ thống (Frontend)** hiển thị hiệu ứng đang tải dữ liệu (`Skeleton` từ `UIStates.tsx`), đồng thời gửi yêu cầu `GET /api/v1/products` đến Backend.
3. **Hệ thống (Backend)** tiếp nhận yêu cầu tại `ProductsController`, kiểm tra tham số truy vấn qua `QueryProductDto` và gọi `ProductsService` để truy vấn danh sách đồ uống cùng danh mục từ cơ sở dữ liệu PostgreSQL.
4. **Hệ thống (Backend)** trả về danh sách các món đồ uống (tối thiểu 8–10 món) kèm mã trạng thái `HTTP 200 OK`.
5. **Hệ thống (Frontend)** ẩn hiệu ứng `Skeleton`, hiển thị thanh chọn danh mục (`CategoryFilter.tsx` - mặc định chọn "Tất cả") và danh sách các thẻ món uống (`ProductCard.tsx`) bao gồm: Hình ảnh, Tên món, Giá cơ bản và trạng thái còn hàng.
6. Use Case kết thúc khi danh sách thực đơn hiển thị hoàn tất trên màn hình.

### 3.2. Luồng mở rộng (Alternative / Extension Flows)
*(Tương ứng với các quan hệ `<<extend>>` trong sơ đồ Use Case)*

* **3.2.1. Luồng mở rộng 1A: `Lọc theo danh mục` (Tại bước 5 của Luồng chính)**
  1. Tại màn hình Menu, **Khách hàng** nhấn chọn một danh mục cụ thể trên thanh tab danh mục (`CategoryFilter.tsx`).
  2. **Hệ thống (Frontend)** hiển thị trạng thái `Skeleton` và gửi yêu cầu `GET /api/v1/products?categoryId=<id>` đến Backend.
  3. **Hệ thống (Backend)** xác thực tham số qua `QueryProductDto`, truy vấn các món thuộc danh mục được chọn và trả về kết quả.
  4. **Hệ thống (Frontend)** cập nhật lại danh sách `ProductCard` chỉ hiển thị các món thuộc danh mục đó.

* **3.2.2. Luồng mở rộng 1B: `Tìm kiếm món` (Tại bước 5 của Luồng chính)**
  1. Tại màn hình Menu, **Khách hàng** nhập từ khóa tên đồ uống vào ô tìm kiếm.
  2. **Hệ thống (Frontend)** hiển thị trạng thái `Skeleton` và gửi yêu cầu `GET /api/v1/products?search=<keyword>` (có thể kết hợp cùng `categoryId` hiện tại) đến Backend.
  3. **Hệ thống (Backend)** lọc danh sách sản phẩm có tên khớp với từ khóa tìm kiếm và trả về dữ liệu.
  4. **Hệ thống (Frontend)** cập nhật giao diện, hiển thị các thẻ món (`ProductCard`) khớp với từ khóa.

* **3.2.3. Luồng mở rộng 1C: `Xem chi tiết món` (Tại bước 5 của Luồng chính)**
  1. Tại danh sách thực đơn, **Khách hàng** nhấn vào một thẻ sản phẩm (`ProductCard.tsx`) bất kỳ.
  2. **Hệ thống (Frontend)** gửi yêu cầu `GET /api/v1/products/:id` đến Backend để lấy thông tin chi tiết của món.
  3. **Hệ thống (Backend)** truy vấn thông tin chi tiết của món (Mô tả, danh sách kích cỡ/Size, danh sách Topping đi kèm và giá tương ứng) và trả về cho Frontend.
  4. **Hệ thống (Frontend)** hiển thị giao diện/Modal chi tiết món để khách hàng xem thông tin đầy đủ (sẵn sàng chuyển tiếp sang chức năng Tùy biến món & Thêm vào giỏ hàng ở Module 2).

### 3.3. Luồng ngoại lệ (Exception Flows)

* **3.3.1. Ngoại lệ E1: Không tìm thấy món ăn nào (Empty State) - Tại bước 4 của Luồng chính hoặc Luồng 1A, 1B**
  1. **Hệ thống (Backend)** trả về danh sách rỗng `[]` (do danh mục chưa có món hoặc từ khóa tìm kiếm không khớp với bất kỳ món nào).
  2. **Hệ thống (Frontend)** hiển thị component `EmptyState` (từ `src/components/UIStates.tsx`) với thông báo *"Không tìm thấy đồ uống phù hợp"* kèm nút xóa bộ lọc tìm kiếm.

* **3.3.2. Ngoại lệ E2: Lỗi kết nối hoặc lỗi máy chủ (Error State) - Tại bước 3 của Luồng chính hoặc các Luồng mở rộng**
  1. Quá trình gọi API `GET /api/v1/products` hoặc `GET /api/v1/products/:id` thất bại (lỗi mạng, máy chủ trả về mã lỗi `500 Internal Server Error` hoặc `404 Not Found` khi không tìm thấy ID món).
  2. **Hệ thống (Frontend)** bắt lỗi và hiển thị component `ErrorState` (từ `src/components/UIStates.tsx`) thông báo lỗi thân thiện kèm nút *"Thử lại" (Retry)* để người dùng tải lại dữ liệu.

---

## 4. Yêu cầu phi chức năng & Tiêu chí nghiệm thu (Non-functional Requirements & Acceptance Criteria)
1. **Hiệu năng (Performance):** Thời gian phản hồi của các API `GET /api/v1/products` và `GET /api/v1/products/:id` phải đạt **< 300ms**.
2. **Trải nghiệm người dùng (UI/UX):** 
   * Giao diện thiết kế theo chuẩn **Mobile-first / Responsive**, hiển thị mượt mà trên cả điện thoại và máy tính.
   * Phải xử lý trọn vẹn và mượt mà 3 trạng thái giao diện: **Loading** (`Skeleton`), **Empty** (`EmptyState`), và **Error** (`ErrorState`).
3. **Dữ liệu kiểm thử (Seed Data & E2E Test):** 
   * Hiển thị tối thiểu **8 – 10 món thực tế** kèm danh mục và topping sau khi chạy script khởi tạo dữ liệu (Database Seed Script).
   * Vượt qua kịch bản kiểm thử tự động End-to-End (Playwright) cho luồng duyệt Menu và Xem chi tiết sản phẩm.