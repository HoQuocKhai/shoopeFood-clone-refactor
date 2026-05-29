# Phân tích phần Người 5 - Order Ops + Payment Stub

**Repository:** https://github.com/thanhlong2023/shoopeFood-clone  
**Thời điểm phân tích:** 29/05/2026  
**Phạm vi chính:** `shoopeFood-clone-main/grab-food-monolith` và các file liên quan đến Order/Payment.

---

## 1. Kết luận nhanh

Phần **Người 5** được phân công làm nhóm chức năng **Order Ops + Payment Stub**. Qua các file hiện có trong repository, phần này **đã làm được khá nhiều phần lõi để demo local**, gồm:

- Có database/schema liên quan đến `orders`, `order_items`, `order_statuses`, `payments`, `payment_transactions`.
- Có API quản lý đơn hàng: lấy danh sách đơn, lấy chi tiết, tạo đơn, cập nhật trạng thái, xóa đơn.
- Có API payment stub: tạo payment, callback giả lập, lấy trạng thái payment.
- Có giao diện EJS dashboard cho Order Ops: lọc đơn, xem bảng đơn, cập nhật trạng thái, nhận socket notification.
- Có xử lý optimistic locking khi cập nhật trạng thái đơn bằng `expectedVersion`.

Tuy nhiên, phần này **chưa hoàn chỉnh theo hướng production/DoD đầy đủ**. Các điểm còn thiếu quan trọng nhất là:

- Chưa thấy phân quyền rõ ràng cho **admin/merchant** khi xem và cập nhật đơn.
- Chưa thấy kiểm soát luồng chuyển trạng thái hợp lệ, ví dụ không cho chuyển từ `COMPLETED` về `PENDING`.
- Chưa thấy ghi log lịch sử trạng thái vào bảng `order_status_logs` khi cập nhật trạng thái.
- Payment stub đã có API cơ bản nhưng còn thiếu UI quản lý/payment detail và xử lý idempotency chặt chẽ.
- Chưa thấy test tự động rõ ràng cho happy path, conflict 409, payment success/fail/timeout.
- Chưa có README/hướng dẫn riêng cho phần Order Ops + Payment Stub, ảnh/video minh chứng DoD.

**Ước lượng mức hoàn thành:** khoảng **65–70%** cho phần Người 5. Đủ nền tảng để demo backend + dashboard cơ bản, nhưng còn thiếu nhiều phần để đạt mức hoàn chỉnh.

---

## 2. Phân công ban đầu của Người 5

Theo file `PHAN_CONG_NHOM_5_NGUOI.md`, Người 5 phụ trách:

### 2.1. Database

- Bảng `orders` phục vụ vận hành đơn hàng.
- Liên kết `payment_method`.

### 2.2. Backend

- API danh sách đơn cho admin/merchant.
- API cập nhật trạng thái đơn:
  - xác nhận,
  - hủy,
  - đang giao,
  - hoàn tất.
- Stub thanh toán:
  - `CASH`,
  - `E-WALLET`,
  - log kết quả thanh toán.

### 2.3. UI

- Dashboard đơn hàng cho admin/merchant.
- Trang cập nhật trạng thái đơn.
- Bộ lọc đơn theo trạng thái/thời gian.

### 2.4. Definition of Done

- Có API + UI chạy local.
- Dữ liệu thật từ DB.
- Có ít nhất 1 video/screenshot.
- Merge vào `main` không conflict nghiêm trọng.

---

## 3. Hiện trạng repository

Repository hiện có cấu trúc chính:

```text
shoopeFood-clone-main/
├── client/
├── grab-food-monolith/
├── PHAN_CONG_NHOM_5_NGUOI.md
├── seed_all.sql
├── package-lock.json
└── .gitignore
```

Phần backend chính nằm trong:

```text
grab-food-monolith/
├── src/
├── .env.example
├── SRS.md
├── package.json
├── server.js
└── test_api.js
```

Bên trong `src` có các thư mục theo mô hình tương đối rõ:

```text
src/
├── config/
├── controllers/
├── factories/
├── middleware/
├── models/
├── public/
├── repositories/
├── routes/
├── services/
├── sockets/
├── utils/
├── views/
└── app.js
```

Các file quan trọng liên quan đến Người 5:

```text
src/controllers/orderController.js
src/controllers/paymentController.js
src/routes/orderRoutes.js
src/routes/paymentRoutes.js
src/views/orders-dashboard.ejs
src/models/Order.js
src/models/OrderItem.js
src/models/OrderStatus.js
src/models/Payment.js
src/models/PaymentTransaction.js
seed_all.sql
SRS.md
```

---

## 4. Phần đã làm được

### 4.1. Database/schema cho Order và Payment

Trong `seed_all.sql`, dự án đã có các bảng quan trọng:

- `order_statuses`
- `orders`
- `order_items`
- `payments`
- `payment_transactions`
- `order_status_logs`
- `driver_locations`

Điểm tốt:

- Có `order_statuses` thay vì hard-code hoàn toàn trạng thái trong bảng `orders`.
- Bảng `orders` có `version`, hỗ trợ optimistic locking.
- Bảng `payments` tách khỏi `payment_transactions`, phù hợp với mô hình payment có nhiều lần retry/callback.
- Có seed dữ liệu mẫu cho order, payment, transaction, status log.

Điểm chưa đủ:

- Dù SQL có bảng `order_status_logs`, trong source hiện chưa thấy model `OrderStatusLog.js` và chưa thấy logic ghi log mỗi lần update trạng thái.
- Nếu update trạng thái mà không ghi log, dashboard/operation sau này sẽ khó audit.

### 4.2. API Order

Trong `orderRoutes.js`, đã có các route:

```js
POST   /secure
GET    /
GET    /page
GET    /:id/tracking
GET    /:id
POST   /
PUT    /:id/status
PUT    /:id
DELETE /:id
```

Các API này đáp ứng phần lớn nền tảng cho Order Ops.

#### 4.2.1. Lấy danh sách đơn

`GET /api/orders` đã hỗ trợ nhiều filter:

- `statusId`
- `statusCode`
- `restaurantId`
- `customerId`
- `driverId`
- `fromDate`
- `toDate`

Điểm tốt:

- Đúng với yêu cầu có bộ lọc theo trạng thái/thời gian.
- Có thể mở rộng cho admin/merchant.

Điểm thiếu:

- Chưa thấy middleware phân quyền admin/merchant rõ ràng.
- Nếu API public hoặc chỉ filter bằng query thì merchant có thể xem đơn của restaurant khác nếu biết ID.
- Cần lấy merchant/restaurant từ user đang đăng nhập thay vì tin hoàn toàn vào query param.

#### 4.2.2. Cập nhật trạng thái đơn

`PUT /api/orders/:id/status` đã có:

- Tìm order theo ID.
- Resolve status theo `statusId` hoặc `statusCode`.
- Kiểm tra `expectedVersion`.
- Nếu version lệch thì trả `409 Conflict`.
- Cập nhật `statusId` và tăng `version`.
- Emit socket event:
  - `order:updated`
  - `order:{id}:updated`

Điểm tốt:

- Có optimistic locking, đây là điểm khá tốt cho bài toán nhiều người cùng thao tác đơn hàng.
- Có socket để dashboard cập nhật realtime.

Điểm thiếu:

- Chưa thấy kiểm tra luồng trạng thái hợp lệ.
- Chưa thấy ghi `order_status_logs`.
- Chưa thấy phân quyền người được phép đổi trạng thái.
- Chưa thấy validate theo vai trò, ví dụ:
  - merchant được xác nhận/hủy đơn,
  - driver được chuyển sang đang giao/hoàn tất,
  - admin có quyền toàn cục.

### 4.3. API Payment Stub

Trong `paymentRoutes.js`, đã có:

```js
POST /create
POST /callback
GET  /:orderId
```

Trong `paymentController.js`, đã có các chức năng:

#### `createPayment`

- Nhận `orderId`, `idempotencyKey`, `paymentMethod`.
- Kiểm tra order tồn tại.
- Tạo payment với amount lấy từ `order.totalAmount`.
- Nếu đã có payment theo order thì trả về payment hiện có.

#### `processPaymentCallback`

- Nhận `paymentId`.
- Giả lập delay 1–2 giây.
- Giả lập 5% lỗi/timeout.
- Tạo `PaymentTransaction`.
- Cập nhật payment sang `SUCCESS` hoặc `FAILED`.

#### `getPaymentStatus`

- Lấy payment theo `orderId`.
- Include danh sách transaction.

Điểm tốt:

- Đúng tinh thần payment stub cho demo.
- Có bảng log transaction.
- Có callback giả lập success/fail/timeout.

Điểm thiếu:

- Idempotency mới ở mức cơ bản, chưa thật sự chặt.
- Nếu cùng một order nhưng request khác `idempotencyKey` hoặc khác `paymentMethod`, hiện có nguy cơ trả payment cũ mà không báo conflict rõ.
- Chưa thấy UI gọi payment callback hoặc xem chi tiết payment transaction.
- Chưa thấy test riêng cho payment success/fail/timeout.
- Timeout hiện có thể bị quy về `FAILED`, nên cần làm rõ trạng thái `TIMEOUT` trong transaction/payment nếu muốn mô phỏng sát hơn.

### 4.4. UI Order Ops Dashboard

File `orders-dashboard.ejs` đã có dashboard với các phần:

- Tiêu đề `Order Ops Dashboard`.
- Filter:
  - status,
  - from date,
  - to date.
- Bảng đơn hàng:
  - Order ID/Code,
  - Customer,
  - Status,
  - Payment,
  - Total Amount,
  - Created At,
  - Action.
- Modal cập nhật trạng thái.
- Socket connection status.
- Lắng nghe event `new_order`.
- Gọi `GET /api/orders` để fetch danh sách.
- Gọi `PUT /api/orders/:id/status` để cập nhật trạng thái.
- Có xử lý lỗi `409 Conflict` bằng alert và refresh.

Điểm tốt:

- Đáp ứng yêu cầu UI dashboard cơ bản.
- Có lọc đơn theo status/time.
- Có modal update trạng thái.
- Có realtime socket.

Điểm thiếu:

- Chưa thấy UI phân biệt admin/merchant.
- Status trong UI có dấu hiệu hard-code ID, có thể lệch nếu seed DB thay đổi.
- Chưa có trang/khung xem lịch sử trạng thái đơn.
- Chưa có UI chi tiết payment transaction.
- Chưa có pagination hoàn chỉnh cho danh sách lớn.
- Chưa thấy liên kết rõ với frontend `client`, dashboard hiện là EJS trong backend.

---

## 5. Bảng đối chiếu yêu cầu và hiện trạng

| Yêu cầu Người 5 | Hiện trạng | Mức độ | Nhận xét |
|---|---:|---:|---|
| DB `orders` hỗ trợ vận hành | Đã có | Tốt | Có `orders`, `order_items`, `order_statuses`, `version` |
| Liên kết payment method | Đã có | Khá | Có `payments`, `payment_transactions`, method/status |
| API danh sách đơn cho admin/merchant | Có một phần | Trung bình | Có `GET /api/orders`, nhưng chưa rõ RBAC admin/merchant |
| API cập nhật trạng thái đơn | Đã có | Khá | Có `PUT /api/orders/:id/status`, optimistic locking, socket |
| Kiểm soát luồng trạng thái | Chưa rõ/chưa đủ | Thiếu | Cần validate transition hợp lệ |
| Log lịch sử trạng thái | DB có, logic chưa thấy | Thiếu | Cần model + service ghi `order_status_logs` |
| Payment stub CASH/E-WALLET | Có một phần | Khá | Có create/callback/status, nhưng idempotency còn đơn giản |
| Log kết quả payment | Đã có | Khá | Có `PaymentTransaction` |
| Dashboard admin/merchant | Có một phần | Khá | Có EJS dashboard nhưng chưa rõ phân quyền admin/merchant |
| Bộ lọc đơn theo status/time | Đã có | Tốt | UI và API đều có filter |
| UI cập nhật trạng thái | Đã có | Khá | Có modal update status |
| Test happy path | Chưa rõ/chưa đủ | Thiếu | Có `test_api.js` nhưng package không có script test rõ |
| Screenshot/video DoD | Chưa thấy | Thiếu | Cần bổ sung vào README hoặc thư mục docs |
| README hướng dẫn chạy phần Người 5 | Chưa thấy rõ | Thiếu | Cần viết hướng dẫn setup, seed, API, demo flow |

---

## 6. Những gì còn thiếu chi tiết

### 6.1. Thiếu phân quyền admin/merchant

Yêu cầu nói rõ dashboard/API dành cho admin/merchant. Hiện tại cần kiểm tra và hoàn thiện:

- Chỉ admin/merchant mới được vào `/orders-dashboard`.
- `GET /api/orders` phải giới hạn dữ liệu theo role.
- Merchant chỉ được xem đơn thuộc restaurant của mình.
- Admin được xem tất cả.
- Driver/customer không được dùng dashboard vận hành nếu không có quyền.

Gợi ý:

```js
router.get('/orders-dashboard', requireAuth, requireRole(['ADMIN', 'MERCHANT']), ...)
router.get('/api/orders', requireAuth, requireRole(['ADMIN', 'MERCHANT']), orderController.getOrders)
router.put('/api/orders/:id/status', requireAuth, requireRole(['ADMIN', 'MERCHANT', 'DRIVER']), orderController.updateOrderStatus)
```

### 6.2. Thiếu validate chuyển trạng thái

Cần có rule chuyển trạng thái, ví dụ:

```text
PENDING    -> CONFIRMED, CANCELED
CONFIRMED  -> PREPARING, CANCELED
PREPARING  -> SHIPPING, CANCELED
SHIPPING   -> COMPLETED, CANCELED
COMPLETED  -> không cho đổi tiếp
CANCELED   -> không cho đổi tiếp
```

Nếu chuyển sai, API nên trả:

```http
400 Bad Request
```

Ví dụ response:

```json
{
  "success": false,
  "message": "Invalid status transition: COMPLETED -> PENDING"
}
```

### 6.3. Thiếu ghi log trạng thái đơn

DB đã có `order_status_logs`, nhưng source hiện chưa thấy model/logic rõ. Cần bổ sung:

- `src/models/OrderStatusLog.js`
- Association với `Order`, `OrderStatus`, `User` nếu có.
- Khi update status thành công, insert log:
  - `order_id`
  - `old_status_id`
  - `new_status_id`
  - `changed_by`
  - `note`
  - `created_at`

Nên thực hiện update order và insert log trong cùng transaction.

### 6.4. Payment idempotency chưa chặt

Hiện flow payment đã có `idempotencyKey`, nhưng cần xử lý kỹ hơn:

- Nếu cùng `idempotencyKey`, trả lại payment cũ.
- Nếu cùng `orderId` nhưng khác `paymentMethod`, cần báo conflict hoặc tạo flow rõ ràng.
- Nếu payment đã `SUCCESS`, không cho callback lại thành `FAILED`.
- Nếu callback trùng, không tạo transaction rác.
- Cần phân biệt `FAILED` và `TIMEOUT` nếu muốn mô phỏng sát.

### 6.5. Thiếu UI payment detail

Dashboard có cột payment nhưng nên thêm:

- Nút xem payment detail.
- Modal hiển thị:
  - payment method,
  - payment status,
  - amount,
  - idempotency key,
  - danh sách payment transaction,
  - gateway response.
- Nút giả lập callback payment cho môi trường demo nếu cần.

### 6.6. Thiếu test/API demo script

Cần bổ sung test hoặc ít nhất script kiểm thử API:

- Lấy danh sách order.
- Lọc theo status/time.
- Cập nhật status thành công.
- Cập nhật status với `expectedVersion` sai -> 409.
- Chuyển trạng thái sai -> 400.
- Tạo payment.
- Callback payment success/fail/timeout.
- Lấy payment status.

### 6.7. Thiếu tài liệu hướng dẫn demo

Nên có README riêng:

```text
docs/order-payment-demo.md
```

Nội dung nên gồm:

- Cách chạy backend.
- Cách import database/seed.
- URL dashboard.
- Danh sách API.
- Demo flow:
  1. Mở dashboard.
  2. Lọc đơn PENDING.
  3. Update sang CONFIRMED.
  4. Tạo payment.
  5. Callback payment.
  6. Xem transaction log.
- Screenshot/video minh chứng.

---

## 7. Việc cần làm tiếp theo

### Giai đoạn 1 - Hoàn thiện để demo đúng yêu cầu

Ưu tiên cao nhất:

- [ ] Thêm middleware phân quyền admin/merchant cho dashboard và API order.
- [ ] Merchant chỉ thấy đơn của restaurant thuộc merchant đó.
- [ ] Thêm validate status transition.
- [ ] Tạo model `OrderStatusLog`.
- [ ] Khi update status, ghi log vào `order_status_logs`.
- [ ] Sửa UI status không phụ thuộc hard-code ID; nên load theo `statusCode` hoặc API `order-statuses`.
- [ ] Bổ sung thông báo loading/empty/error rõ hơn trên dashboard.

### Giai đoạn 2 - Hoàn thiện Payment Stub

- [ ] Làm rõ flow `CASH` và `E-WALLET`.
- [ ] Siết idempotency.
- [ ] Không cho callback làm đổi trạng thái payment đã final.
- [ ] Thêm modal payment detail trên dashboard.
- [ ] Hiển thị danh sách payment transaction.
- [ ] Thêm nút demo callback payment nếu cần.

### Giai đoạn 3 - Test và tài liệu

- [ ] Viết test hoặc script Postman/curl cho Order Ops.
- [ ] Test conflict `409` khi version sai.
- [ ] Test chuyển trạng thái sai.
- [ ] Test payment callback success/fail/timeout.
- [ ] Viết README hướng dẫn chạy local.
- [ ] Bổ sung screenshot/video demo.
- [ ] Ghi rõ các endpoint đã làm và cách kiểm thử.

---

## 8. Checklist task cụ thể cho Người 5

### Backend Order

- [ ] Tạo `src/models/OrderStatusLog.js`.
- [ ] Khai báo association trong model index/config hiện tại.
- [ ] Viết helper `validateStatusTransition(oldStatus, newStatus)`.
- [ ] Sửa `updateOrderStatus()`:
  - [ ] lấy trạng thái cũ,
  - [ ] validate transition,
  - [ ] kiểm tra role,
  - [ ] update order,
  - [ ] insert status log,
  - [ ] commit transaction,
  - [ ] emit socket.
- [ ] Trả lỗi rõ:
  - [ ] `400` nếu transition sai,
  - [ ] `403` nếu không có quyền,
  - [ ] `404` nếu order/status không tồn tại,
  - [ ] `409` nếu version conflict.

### Backend Payment

- [ ] Chuẩn hóa enum payment method: `CASH`, `E_WALLET` hoặc thống nhất với DB.
- [ ] Kiểm tra idempotency theo `idempotencyKey`.
- [ ] Không cho callback nhiều lần làm sai trạng thái final.
- [ ] Lưu gateway response rõ hơn.
- [ ] Tách payment logic sang service nếu controller đang quá nhiều logic.

### UI Dashboard

- [ ] Bảo vệ route `/orders-dashboard` bằng auth/role.
- [ ] Load danh sách status từ DB/API thay vì hard-code.
- [ ] Thêm payment detail modal.
- [ ] Thêm status history modal.
- [ ] Thêm pagination.
- [ ] Thêm trạng thái loading/error/empty.
- [ ] Hiển thị rõ lỗi 400/403/409.

### Test/Docs

- [ ] Tạo file Postman collection hoặc curl script.
- [ ] Thêm README demo.
- [ ] Thêm ảnh dashboard.
- [ ] Thêm video ngắn nếu cần nộp bài.

---

## 9. Gợi ý thứ tự triển khai nhanh

Nếu cần hoàn thiện nhanh để nộp/demonstration, nên làm theo thứ tự này:

1. **Status log + transition validation**  
   Đây là phần backend quan trọng nhất vì liên quan trực tiếp đến nghiệp vụ vận hành đơn.

2. **RBAC admin/merchant**  
   Đúng với yêu cầu ban đầu: dashboard/API cho admin/merchant.

3. **Sửa UI load status động**  
   Tránh lỗi hard-code status ID.

4. **Payment detail modal**  
   Giúp chứng minh payment stub và transaction log trên UI.

5. **Test script + README + screenshot**  
   Để hoàn thành Definition of Done.

---

## 10. Acceptance Criteria đề xuất

Phần Người 5 nên được xem là hoàn thành khi đạt các tiêu chí sau:

- [ ] Admin đăng nhập và xem được tất cả đơn.
- [ ] Merchant đăng nhập và chỉ xem được đơn của restaurant thuộc merchant đó.
- [ ] Dashboard lọc được theo trạng thái và thời gian.
- [ ] Cập nhật trạng thái hợp lệ thành công.
- [ ] Cập nhật trạng thái sai luồng trả `400`.
- [ ] Cập nhật với `expectedVersion` cũ trả `409`.
- [ ] Mỗi lần cập nhật trạng thái tạo một dòng trong `order_status_logs`.
- [ ] Payment create/callback/status hoạt động.
- [ ] Payment transaction được ghi lại đầy đủ.
- [ ] Dashboard hiển thị được trạng thái thanh toán.
- [ ] Có README hướng dẫn chạy và test.
- [ ] Có screenshot/video demo.

---

## 11. Nhận xét cuối

Người 5 đã làm được phần nền khá quan trọng: API order, payment stub, dashboard và realtime update. Đây là mức tốt để chứng minh hướng đi kỹ thuật. Tuy nhiên, để phần này thật sự đạt yêu cầu “Order Ops + Payment Stub” đầy đủ, cần tập trung hoàn thiện 4 điểm chính:

1. **Phân quyền admin/merchant.**
2. **Validate luồng trạng thái đơn.**
3. **Ghi log trạng thái đơn.**
4. **Test + tài liệu demo.**

Nếu hoàn thiện được các mục trên, phần Người 5 sẽ chuyển từ mức “demo cơ bản” sang mức “module vận hành đơn hàng tương đối hoàn chỉnh”.
