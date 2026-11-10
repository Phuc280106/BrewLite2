# MA TRẬN TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX)
**Dự án:** Hệ thống đặt đồ uống trực tuyến BrewLite  
**Giai đoạn hiện tại:** Hoàn thành Task 1 (Yêu cầu) & Task 2 (Mô hình hóa)  
**Tập tin:** `docs/traceability-matrix.md`  

---

### Bảng Ma trận Truy vết (Theo mẫu Mục 8.1 - Assignment 2)

| Mã yêu cầu | Use-case / Đặc tả đã có | Thiết kế / Sơ đồ hiện có (PlantUML) | Code / API (Kế hoạch) | Test (Kế hoạch) |
| :---: | :--- | :--- | :--- | :--- |
| **FR-01** | `docs/requirements/usecase-menu-spec.md`<br>(Duyệt menu & lọc theo danh mục) | • `docs/diagrams/menu/usecase-menu.puml`<br>• `docs/diagrams/menu/activity-menu.puml`<br>• `docs/diagrams/menu/sequence-menu-filter.puml`<br>• `docs/diagrams/menu/sequence-menu-view.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Category`, `Product`) | `GET /products`<br>*(Chờ Sprint 1 - Task 4.3)* | `API-T01`<br>*(Chờ Task 5.2)* |
| **FR-02** | `docs/requirements/usecase-product-detail-spec.md`<br>(Xem chi tiết món & size/topping) | • `docs/diagrams/product-detail/usecase-product-detail.puml`<br>• `docs/diagrams/product-detail/activity-product-detail.puml`<br>• `docs/diagrams/product-detail/sequence-product-detail.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Product`, `Size`, `Topping`) | `GET /products/:id`<br>*(Chờ Sprint 1 - Task 4.3)* | `API-T02`<br>*(Chờ Task 5.2)* |
| **FR-03** | `docs/requirements/usecase-cart-spec.md`<br>(Tùy biến món & quản lý giỏ hàng) | • `docs/diagrams/cart/usecase-cart.puml`<br>• `docs/diagrams/cart/activity-cart.puml`<br>• `docs/diagrams/cart/sequence-cart.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Cart`, `CartItem`) | `cartStore.ts` (Zustand)<br>*(Chờ Sprint 2 - Task 5.1)* | `UNIT-T01`<br>*(Chờ Task 5.2)* |
| **FR-04** | `docs/requirements/usecase-auth-spec.md`<br>(Đăng ký, đăng nhập & JWT) | • `docs/diagrams/auth/usecase-auth.puml`<br>• `docs/diagrams/auth/activity-auth-login.puml`<br>• `docs/diagrams/auth/activity-auth-logout.puml`<br>• `docs/diagrams/auth/activity-auth-register.puml`<br>• `docs/diagrams/auth/sequence-auth-login.puml`<br>• `docs/diagrams/auth/sequence-auth-logout.puml`<br>• `docs/diagrams/auth/sequence-auth-register.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`User`) | `POST /auth/register`<br>`POST /auth/login`<br>*(Chờ Sprint 2 - Task 5.1)* | `API-T03`<br>*(Chờ Task 5.2)* |
| **FR-05** | `docs/requirements/usecase-checkout-spec.md`<br>*(Đặc tả trọng tâm Task 1.3 - Tạo đơn hàng)* | • `docs/diagrams/make-order/usecasem_make_order.puml`<br>• `docs/diagrams/make-order/activity_make_order.puml`<br>• `docs/diagrams/make-order/sequence_make_order.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Order`, `OrderItem`, `Ingredient`, `RecipeItems`) | `POST /orders`<br>*(Chờ Sprint 2 - Task 5.1)* | `INT-T01`<br>*(Chờ Task 5.2)* |
| **FR-06** | `docs/requirements/usecase-payment-spec.md`<br>(Thanh toán mô phỏng & Idempotency) | • `docs/diagrams/payment/usecase-payment.puml`<br>• `docs/diagrams/payment/activity-payment.puml`<br>• `docs/diagrams/payment/sequence-payment.puml`<br>• `docs/diagrams/payment/sequence-payment-timeout.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Payment`, `PaymentStatus`) | `POST /payments`<br>*(Chờ Sprint 2 - Task 5.1)* | `INT-T02`<br>*(Chờ Task 5.2)* |
| **FR-07** | `docs/requirements/usecase-order-history-spec.md`<br>(Biên nhận đơn & theo dõi trạng thái) | • `docs/diagrams/transaction/usecase-order-history.puml`<br>• `docs/diagrams/transaction/activity-order-history.puml`<br>• `docs/diagrams/transaction/sequence-order-history.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Order`, `OrderStatus`) | `GET /orders/:id`<br>*(Chờ Sprint 2 - Task 5.1)* | `E2E-T01`<br>*(Chờ Task 5.2)* |
| **FR-08** | `docs/requirements/usecase-order-history-spec.md`<br>(Lịch sử đơn hàng cá nhân) | • `docs/diagrams/transaction/usecase-order-history.puml`<br>• `docs/diagrams/transaction/activity-order-history.puml`<br>• `docs/diagrams/transaction/sequence-order-history.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`User`, `Order`) | `GET /orders/me`<br>*(Chờ Sprint 2 - Task 5.1)* | `API-T04`<br>*(Chờ Task 5.2)* |
| **FR-09** | `docs/requirements/srs-summary.md` (Mục 3)<br>(Cập nhật trạng thái pha chế) | • `docs/diagrams/transaction/sequence-order-history.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Order`, `OrderStatus`) | `PATCH /orders/:id/status`<br>*(Chờ Sprint 2 - Task 5.1)* | `API-T05`<br>*(Chờ Task 5.2)* |
| **FR-10** | `docs/requirements/srs-summary.md` (Mục 3)<br>(Tích lũy & đổi điểm thưởng loyalty) | • `docs/diagrams/cart/usecase-cart.puml`<br>• `docs/diagrams/cart/activity-cart.puml`<br>• `docs/diagrams/class-domain/class-domain.puml` (`Loyalty`, `LoyaltyTransaction`) | `GET /loyalty/me`<br>`POST /loyalty/redeem`<br>*(Chờ Sprint 2 - Task 5.1)* | `INT-T03`<br>*(Chờ Task 5.2)* |

---

### Ghi chú trạng thái các tạo phẩm:
1. **Task 1 (Yêu cầu & Đặc tả):** Đã hoàn tất 100% tài liệu `context-and-scope.md`, `srs-summary.md` và 7 file đặc tả usecase trong `docs/requirements/`.
2. **Task 2 (Mô hình hóa):** Đã hoàn tất các file sơ đồ `.puml` và `.svg` trong các thư mục con tương ứng (`menu`, `product-detail`, `cart`, `auth`, `make-order`, `payment`, `transaction`, `class-domain`).
3. **Task 4 & Task 5 (Code & Test):** Sẽ được triển khai và cập nhật link mã nguồn thực tế khi bước vào các Sprint tương ứng.
