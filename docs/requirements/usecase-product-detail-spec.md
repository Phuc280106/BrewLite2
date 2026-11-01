# Tài liệu Đặc tả Use Case: Chọn và Tùy chỉnh Món ăn

## 1. Tóm tắt (Brief Description)

Use Case được kích hoạt khi khách hàng bắt đầu chọn 1 món. Hệ thống sẽ cho phép khách hàng chọn món kèm tùy chỉnh theo yêu cầu sử dụng.

## 2. Tiền điều kiện (Preconditions)

* Hệ thống load thành công danh sách chứa các món ăn trên màn hình menu.

## 3. Dòng sự kiện (Flow of Events)

### 3.1. Dòng sự kiện chính (Basic Flow)

1. Khách hàng chọn một món ăn trên menu.

2. Hệ thống hiển thị hộp thoại tùy chỉnh món ăn.

3. Khách hàng lựa chọn các tùy chỉnh theo nhu cầu.

4. Mỗi khi một tùy chỉnh được chọn, hệ thống tự động cập nhật lại giá cuối cùng của sản phẩm đó.

5. Khách hàng nhấn nút **"Đặt món"** sau khi hoàn tất tùy chỉnh.

6. Hệ thống ghi nhận món ăn vào giỏ hàng, hiển thị thông báo thành công và cập nhật số lượng món hiển thị trên giỏ hàng.

7. Hệ thống đóng hộp thoại chọn món ăn và chuyển quay về màn hình menu.

### 3.2. Dòng sự kiện phụ & Ngoại lệ (Alternative Flows & Exceptions)

#### **A1. Khách hàng đóng hộp thoại mà không đặt món**

* Tại bất kỳ thời điểm nào trước khi nhấn nút "Đặt món", nếu khách hàng đóng hộp thoại tùy chỉnh:

  1. Hệ thống hủy các tùy chỉnh vừa chọn và không thêm món vào giỏ hàng.

  2. Hệ thống quay về màn hình menu chính.

## 4. Hậu điều kiện (Postconditions)

* Món ăn đã chọn (kèm tùy chỉnh) được thêm thành công vào giỏ hàng.

* Trạng thái giỏ hàng (số lượng, tổng tiền) được cập nhật.

* Hệ thống quay về màn hình menu, sẵn sàng cho khách hàng thực hiện chọn món ăn mới.