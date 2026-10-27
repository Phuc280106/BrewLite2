# TÀI LIỆU BỐI CẢNH, STAKEHOLDER VÀ PHẠM VI (CONTEXT & SCOPE)
**Dự án:** Hệ thống Đặt món Nước trực tuyến BrewLite  
**Môn học:** Công nghệ Phần mềm — Học kỳ I, Năm học 2026–2027  
**Phiên bản:** 1.1 (Cập nhật chuẩn 7 chức năng MVP cho 7 thành viên)  
**Tệp:** `docs/requirements/context-and-scope.md`  

---

## 1. Giới thiệu & Bối cảnh nghiệp vụ (Business Context)

### 1.1. Bối cảnh dự án
BrewLite là hệ thống phần mềm hỗ trợ vận hành và đặt món dành cho chuỗi cửa hàng đồ uống (cà phê, trà trái cây, trà sữa) hiện đại. Trong thời đại số hóa, trải nghiệm khách hàng tại quán không chỉ dừng lại ở hương vị đồ uống mà còn ở tốc độ phục vụ, tính tiện lợi khi đặt món, độ chính xác trong pha chế và chính sách chăm sóc khách hàng thân thiết (Loyalty).

### 1.2. Vấn đề nghiệp vụ cần giải quyết (Problem Statement)
Trước khi áp dụng BrewLite, cửa hàng gặp phải các bài toán nghiệp vụ nan giải:
1. **Ùn tắc giờ cao điểm:** Vào khung giờ cao điểm (sáng 7h30–9h00, trưa 11h30–13h00), lượng khách dồn về quầy quá đông khiến thời gian xếp hàng gọi món và thanh toán kéo dài (trung bình 10–15 phút/lượt), gây bức xúc cho khách hàng và giảm doanh thu tiềm năng.
2. **Sai sót đơn hàng:** Việc nhân viên quầy tiếp nhận order thủ công qua lời nói và ghi chú tay dễ dẫn đến nhầm lẫn về kích cỡ (size), lượng đường/đá hoặc danh sách topping đính kèm, dẫn đến lãng phí nguyên liệu và giảm chất lượng dịch vụ.
3. **Quá tải nhân sự quầy:** Nhân viên quầy vừa phải tư vấn menu, ghi nhận tùy chọn, thu tiền/quẹt thẻ, vừa phải chuyển tiếp thông tin đơn vào quầy pha chế, gây phân mảnh và áp lực công việc lớn.
4. **Thiếu thông tin minh bạch:** Khách hàng sau khi thanh toán không nắm được đơn hàng của mình đang ở giai đoạn nào (đang chờ, đang pha chế hay đã sẵn sàng lấy món).
5. **Rào cản tải ứng dụng (App Friction):** Khách hàng vãng lai thường ngại cài đặt các ứng dụng native cồng kềnh (iOS/Android) từ App Store chỉ để mua một ly nước. Do đó, một giải pháp nền tảng Web theo định hướng **Mobile-First / PWA (Progressive Web App)** cho phép truy cập nhanh qua quét mã QR hoặc trình duyệt là nhu cầu cấp thiết.
6. **Giữ chân khách hàng thân thiết:** Cửa hàng chưa có kênh số hóa tích lũy điểm thưởng tự động mỗi khi mua nước, dẫn đến việc khó giữ chân khách hàng quen và khó tạo động lực quay lại mua hàng.

### 1.3. Mục tiêu của BrewLite
* Cung cấp luồng đặt món số hóa khép kín: **Xem menu → Tùy chọn món → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn hàng & Tích lũy điểm thưởng**.
* Giảm thiểu thời gian chờ đợi tại quầy xuống dưới 3 phút đối với khách tự đặt trước hoặc quét mã tại bàn.
* Đảm bảo tính nhất quán và tự động đồng bộ trạng thái đơn hàng giữa khách hàng và nhân viên pha chế.
* Tích hợp cơ chế chăm sóc khách hàng thân thiết: Tự động tích lũy điểm thưởng và cho phép đổi điểm trực tiếp để giảm giá đơn hàng.

---

## 2. Bảng phân tích các bên liên quan (Stakeholder Analysis)

Hệ thống BrewLite xác định 6 nhóm stakeholder chính với các mục tiêu và kỳ vọng tương ứng:

| STT | Stakeholder | Vai trò trong hệ thống | Mục tiêu chính | Kỳ vọng đối với BrewLite |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Khách hàng** *(Customer)* | Người dùng cuối trực tiếp đặt đồ uống qua trình duyệt web di động / PWA. | Đặt đồ uống nhanh chóng, đúng khẩu vị mong muốn, được tích điểm đổi giảm giá mà không phải xếp hàng. | - Giao diện mobile-first mượt mà, tải nhanh.<br>- Dễ dàng tùy chọn size, lượng đường, đá, topping.<br>- Thanh toán online tiện lợi, an toàn.<br>- Theo dõi rõ ràng trạng thái chế biến của đơn hàng.<br>- Tích lũy điểm và đổi điểm giảm tiền trực tiếp trên giỏ hàng. |
| **2** | **Nhân viên quầy** *(Barista / Cashier)* | Tiếp nhận thông tin order, cập nhật tiến độ pha chế và bàn giao sản phẩm. | Nắm bắt danh sách đơn hàng kịp thời, hạn chế nhầm lẫn công thức pha chế. | - Bảng điều khiển đơn hàng (Order Queue) cập nhật nhanh, rõ ràng.<br>- Hiển thị đầy đủ chi tiết từng món và ghi chú topping.<br>- Thao tác đổi trạng thái đơn (Đang pha -> Sẵn sàng giao) chỉ bằng 1 chạm. |
| **3** | **Quản lý cửa hàng** *(Store Manager)* | Giám sát vận hành cửa hàng, quản lý chính sách khách hàng thân thiết. | Nâng cao hiệu quả kinh doanh, tối ưu hóa nguyên vật liệu và giữ chân khách hàng quen. | - Hệ thống tự động vận hành trơn tru không lỗi tồn kho.<br>- Chính sách tích điểm loyalty rõ ràng, minh bạch.<br>- Giảm tỷ lệ khách phàn nàn do sai sót đơn hoặc chờ lâu. |
| **4** | **Giảng viên / Khách hàng nghiệm thu** *(Evaluator / Client)* | Đánh giá chất lượng kỹ thuật, quy trình phát triển và kết quả bàn giao dự án. | Đảm bảo dự án tuân thủ đúng chuẩn kỹ nghệ phần mềm và các yêu cầu đề bài. | - Quy trình tuần tự rõ ràng từ Task 1 đến Task 5.<br>- Khả năng truy vết (Traceability) xuyên suốt từ SRS đến Code & Test.<br>- Sản phẩm deploy chạy thực tế trên production có HTTPS, CI/CD tự động.<br>- 7 chức năng phân chia công bằng, rõ ràng cho 7 thành viên. |
| **5** | **Nhóm phát triển** *(Development Team)* | Thiết kế kiến trúc, cài đặt mã nguồn frontend/backend, viết test và vận hành CI/CD. | Xây dựng hệ thống ổn định, dễ bảo trì, mở rộng và bàn giao đúng tiến độ. | - Kiến trúc phân tầng rõ ràng (Next.js, NestJS, PostgreSQL).<br>- Quy ước code, git flow và Definition of Done (DoD) thống nhất.<br>- Pipeline CI/CD tự động kiểm tra lint, test, build để tránh lỗi hồi quy. |
| **6** | **Đơn vị thanh toán** *(Payment Provider / Mock Service)* | Cung cấp cổng/dịch vụ xử lý giao dịch thanh toán trực tuyến. | Xử lý giao dịch tài chính chính xác, an toàn, đối soát tin cậy. | - Tích hợp theo chuẩn RESTful API / Webhook.<br>- Đảm bảo tính Idempotency (không bị trừ tiền 2 lần khi gửi lại request).<br>- Cơ chế phản hồi rõ ràng cho cả 2 kịch bản: Thành công và Thất bại. |

---

## 3. Phạm vi sản phẩm (Product Scope)

Định nghĩa rõ ràng ranh giới phạm vi, **đưa Chức năng Tích điểm đổi quà (Loyalty) vào MVP** (phục vụ trọn vẹn 7 chức năng cho 7 thành viên), đồng thời chuyển phần Quản trị và Báo cáo nâng cao sang phạm vi mở rộng.

### 3.1. Bảng phân định phạm vi chuẩn cho 7 chức năng

| Phạm vi trong MVP (Sprint 1 & 2) — 7 Chức năng cốt lõi | Phạm vi mở rộng (Post-MVP / Roadmap) | Nội dung không thực hiện (Out-of-Scope) |
| :--- | :--- | :--- |
| **1. Hiển thị Menu & Lọc theo Danh mục (FR-01, FR-02):**<br>- Xem danh sách món theo phân loại (Cà phê, Trà, Đá xay...).<br>- Xem chi tiết món, giá, ảnh, trạng thái còn/hết hàng. | **1. Quản trị & Báo cáo nâng cao:**<br>- Màn hình Dashboard quản trị doanh thu, biểu đồ phân tích theo ngày/tháng.<br>- Phân ca làm việc của nhân viên. | **1. Không tích hợp vận chuyển ngoài:**<br>- Không điều phối tài xế giao hàng qua các bên thứ 3 (GrabExpress, AhaMove...). Khách nhận tại quầy (Take-away) hoặc tại bàn. |
| **2. Tùy biến Món & Quản lý Giỏ hàng (FR-03):**<br>- Chọn Size (S/M/L), mức đường, đá, chọn nhiều topping.<br>- Giỏ hàng tính tổng tiền tức thì, lưu trạng thái localStorage. | **2. Khuyến mãi & Voucher phức tạp:**<br>- Hệ thống mã coupon giảm giá bậc thang, flash-sale theo khung giờ vàng. | **2. Không tích hợp giao tiếp trực tiếp:**<br>- Không làm tính năng gọi điện thoại hoặc Live Chat thời gian thực giữa khách và quán. |
| **3. Đăng ký, Đăng nhập & Xác thực JWT (FR-04):**<br>- Đăng ký, đăng nhập tài khoản/mật khẩu.<br>- Băm mật khẩu bcrypt và cấp token JWT bảo vệ API. | **3. Đăng nhập mạng xã hội & OTP:**<br>- Đăng nhập nhanh bằng Google/Facebook OAuth2.<br>- Quên mật khẩu qua mã OTP SMS/Email. | **3. Không quản lý chuỗi đa chi nhánh:**<br>- Không hỗ trợ đồng bộ kho liên chi nhánh hay mô hình nhượng quyền (Franchise). |
| **4. Khởi tạo Đơn hàng & Khóa tồn kho (FR-05):**<br>- Xác nhận đơn, nhập số điện thoại, ghi chú.<br>- Tự động trừ tồn kho an toàn bằng Database Transaction (chống âm kho). | **4. Thông báo đẩy thời gian thực (Push Notification):**<br>- Web Push Notification thông báo lên màn hình điện thoại khi món nước pha xong. | **4. Không tích hợp máy POS & Hóa đơn đỏ:**<br>- Không tích hợp máy quẹt thẻ vật lý tại quầy.<br>- Không tích hợp hệ thống xuất hóa đơn đỏ điện tử (e-Invoice) của cơ quan thuế. |
| **5. Thanh toán mô phỏng & Chống trùng lặp (FR-06):**<br>- Mock Payment Service hỗ trợ Thẻ / Ví điện tử.<br>- Cơ chế Idempotency Key chống thanh toán trùng lặp. | **5. Cổng thanh toán thực tế:**<br>- Tích hợp các cổng thanh toán thật (MoMo, VNPAY, ZaloPay, Stripe) qua đối tác doanh nghiệp. | |
| **6. Biên nhận, Lịch sử Đơn & Theo dõi Trạng thái (FR-07, FR-08):**<br>- Xem màn hình biên nhận thành công.<br>- Theo dõi tiến trình làm món: `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED` / `CANCELLED`.<br>- Xem danh sách lịch sử các đơn hàng đã đặt. | **6. Đánh giá & Phản hồi:**<br>- Khách hàng chấm điểm sao (Rating) và viết nhận xét chi tiết sau khi dùng nước. | |
| **7. Tích lũy Điểm thưởng & Đổi quà / Giảm giá (FR-10):**<br>- Tự động cộng điểm thưởng vào tài khoản sau mỗi đơn hàng thành công.<br>- Hiển thị số dư điểm trên Header.<br>- Cho phép nhập số điểm muốn đổi để giảm trừ tiền trực tiếp trên giỏ hàng/thanh toán.<br>- Ghi nhận lịch sử giao dịch vào bảng `LoyaltyTransaction`. | **7. Hạng thành viên nâng cao (Tier Loyalty):**<br>- Nâng hạng thẻ Đồng, Bạc, Vàng, Kim Cương kèm quyền lợi ưu tiên riêng. | |

---

## 4. Giả định và Ràng buộc (Assumptions & Constraints)

### 4.1. Giả định ban đầu (Assumptions)
1. **Thiết bị & Môi trường người dùng:** Khách hàng sử dụng điện thoại thông minh hoặc máy tính có trình duyệt hiện đại (Chrome, Safari, Edge) hỗ trợ JavaScript và CSS Flexbox/Grid, có kết nối Internet ổn định.
2. **Mô phỏng thanh toán:** Vì phạm vi học phần, dịch vụ thanh toán được mô phỏng (Mock Payment) qua webhook/API giả lập nhưng vẫn đảm bảo đầy đủ chu trình kỹ thuật (chờ xử lý, xác nhận, timeout, idempotency key).
3. **Quy tắc tích điểm:** 
   * Tỷ lệ tích điểm: 10.000 VNĐ chi tiêu = 1 Điểm thưởng.
   * Tỷ lệ đổi điểm: 1 Điểm thưởng = 1.000 VNĐ giảm giá trực tiếp vào đơn hàng.
   * Số dư điểm thưởng không bao giờ được phép âm.
4. **Dữ liệu khởi tạo (Seed Data):** Hệ thống khởi tạo sẵn danh mục thực đơn mẫu, các tùy chọn topping, size chuẩn và một số tài khoản thử nghiệm (Customer có sẵn điểm thưởng, Admin) thông qua script Database Seed.
5. **Nghiệp vụ lấy món:** Mô hình phục vụ trọng tâm là Take-away (Khách tự đến quầy lấy nước khi đơn chuyển trạng thái `READY`) hoặc phục vụ tại bàn qua số đơn.

### 4.2. Ràng buộc kỹ thuật & Quy trình (Constraints)
1. **Ràng buộc công nghệ bắt buộc (Technical Constraints):**
   * **Frontend:** Bắt buộc xây dựng bằng **Next.js** (App Router/Pages Router), thiết kế theo phong cách **Mobile-First / PWA**.
   * **Backend:** Bắt buộc xây dựng bằng **NestJS** theo cấu trúc module/domain rõ ràng, tuân thủ Dependency Injection.
   * **Cơ sở dữ liệu:** Bắt buộc sử dụng **PostgreSQL**, quản lý cấu trúc bảng và lịch sử thay đổi thông qua cơ chế **Database Migration** (Prisma / TypeORM).
   * **Đóng gói & Chạy môi trường:** Bắt buộc có `docker-compose.yml` để chạy toàn bộ hệ thống (Web, API, DB) tại máy local.
2. **Ràng buộc môi trường Production & CI/CD:**
   * Hệ thống phải được triển khai lên nền tảng đám mây (Render, Railway, Fly.io, VPS,...) và truy cập được qua giao thức an toàn **HTTPS**.
   * Database Production phải được bảo vệ trong mạng nội bộ, **tuyệt đối không public trực tiếp ra Internet**.
   * Không lưu trữ secret/mật khẩu trong git repository; toàn bộ biến môi trường phải dùng `.env.example` và thiết lập qua secret của CI/CD.
3. **Ràng buộc quy trình phát triển:**
   * Dự án phải tuân thủ nghiêm ngặt **Quy tắc thực hiện tuần tự**: Hoàn thành Task 1 -> Task 2 -> Task 3 -> Task 4 (Sprint 1) -> Task 5 (Sprint 2 & Deploy).
   * Mọi yêu cầu và chức năng phải có khả năng **truy vết 100% (Traceability)** tại `docs/traceability-matrix.md`.
   * Pull Request trên Git không được phép merge nếu pipeline CI (Lint, Unit Test, Build) thất bại.

---

## 5. Đánh giá rủi ro ban đầu (Initial Risk Assessment)

| STT | Rủi ro nhận diện | Khả năng | Tác động | Kế hoạch giảm thiểu / Ứng phó |
| :---: | :--- | :---: | :---: | :--- |
| **R-01** | **Bất đồng bộ tồn kho (Race condition):** Nhiều khách hàng cùng đặt 1 món cuối cùng trong cùng 1 thời điểm dẫn đến âm kho. | Trung bình | Cao | Sử dụng Database Transaction kết hợp khóa dòng (`SELECT FOR UPDATE`) kiểm tra số lượng tồn kho trước khi commit tạo đơn. |
| **R-02** | **Trùng lặp giao dịch thanh toán (Double Charge):** Khách hàng nhấn nút thanh toán nhiều lần do mạng chậm hoặc webhook thanh toán gửi lại nhiều lần. | Cao | Cao | Áp dụng cơ chế **Idempotency Key** dựa trên `order_id` duy nhất; kiểm tra trạng thái đơn trước khi ghi nhận tiền. |
| **R-03** | **Lỗi tính toán điểm thưởng (Loyalty Glitch):** Khách hàng đổi điểm bị âm hoặc vừa dùng điểm vừa hủy đơn không được hoàn lại điểm. | Trung bình | Trung bình | Đưa toàn bộ thao tác trừ điểm/cộng điểm vào chung Database Transaction với lệnh tạo/hủy đơn; thiết lập ràng buộc `CHECK (points >= 0)` trong PostgreSQL. |
| **R-04** | **Quá tải tiến độ giữa 2 Sprint:** Dồn quá nhiều tính năng sang Sprint 2 dẫn đến không kịp hoàn thiện CI/CD và triển khai. | Cao | Cao | Tuân thủ chặt chẽ mục tiêu Sprint 1: Chỉ tập trung khung kỹ thuật, database seed, API menu và giao diện xem món. Các tính năng đặt, thanh toán và loyalty hoàn thiện ở Sprint 2. |
| **R-05** | **Rò rỉ thông tin nhạy cảm:** Vô tình đẩy file `.env` chứa credential production lên GitHub repository. | Thấp | Nghiêm trọng | Cấu hình `.gitignore` nghiêm ngặt ngay từ khởi tạo repo; sử dụng Git pre-commit hooks hoặc secret scanner trong pipeline CI. |
