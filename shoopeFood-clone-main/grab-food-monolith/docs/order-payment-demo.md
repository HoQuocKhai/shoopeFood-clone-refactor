# Hướng Dẫn Demo Tính Năng Người 5 (Order Ops & Payment Stub)

Tài liệu này hướng dẫn cách test toàn bộ hệ thống Order Ops và Thanh toán sau khi đã tích hợp RBAC, Idempotency và Atomic Update.

## 1. Kiểm tra API bằng Script Tự động

Bạn có thể chạy toàn bộ test case bằng lệnh:

```bash
npm run test:ops
# Hoặc
node test_order_payment.js
```

Script này sẽ tự động:

1. Đăng nhập bằng `ADMIN`, `MERCHANT`, và `CUSTOMER` để lấy token.
2. Kiểm tra quyền truy cập (RBAC): Merchant chỉ xem được đơn hàng của nhà hàng mình.
3. Kiểm tra Status Transition: Chuyển trạng thái hợp lệ, xung đột version (version conflict), và trạng thái không hợp lệ.
4. Lấy lịch sử thay đổi trạng thái (Audit logs).
5. Kiểm tra Payment Idempotency: Tạo thanh toán mới, gọi lại với cùng Idempotency Key, và thử dùng Key khác.
6. Kiểm tra Webhook/Callback: Giả lập gọi từ cổng thanh toán với `x-stub-secret`.

## 2. Trải Nghiệm Qua Dashboard UI

Dashboard mới được nâng cấp tại `http://localhost:3000/dashboard-login`.

### Demo Phân Quyền

1. Đăng nhập bằng **Admin** (SĐT: `0900000005` / MK: `123456`).
   - Bạn sẽ thấy TẤT CẢ các đơn hàng.
2. Bấm "Đăng xuất" và Đăng nhập lại bằng **Merchant** (SĐT: `0900000003` / MK: `123456`).
   - Bạn chỉ thấy các đơn hàng thuộc về nhà hàng của merchant này.

### Demo Cập Nhật Trạng Thái

1. Ở cột Thao tác, bấm **✏️ Trạng thái** trên một đơn hàng đang ở trạng thái `PENDING` hoặc `CONFIRMED`.
2. Modal hiện ra, bạn chỉ có thể chọn các trạng thái hợp lệ tiếp theo (ví dụ: đang `CONFIRMED` thì chỉ chọn được `PICKING_UP` hoặc `CANCELLED`).
3. Ghi lý do và bấm "Lưu thay đổi".
4. Hệ thống hiển thị thông báo Toast màu xanh khi thành công. (Giao diện dùng `version` để ngăn ngừa xung đột - nếu có ai đó update đơn này cùng lúc, bạn sẽ nhận được thông báo lỗi đỏ 409).

### Demo Payment

1. Ở cột Thao tác, bấm **💳 Payment**.
2. Xem chi tiết thông tin thanh toán (Amount, Status, Idempotency Key).
3. Xem danh sách các lần thực hiện giao dịch (Transactions).
4. Nếu đăng nhập bằng Admin, bạn sẽ thấy nút **🔄 Simulate Callback** để giả lập cổng thanh toán webhook trả về kết quả thành công/thất bại.

### Demo Lịch Sử (Audit Log)

1. Ở cột Thao tác, bấm **📋 Lịch sử**.
2. Xem tất cả các lần đơn hàng thay đổi trạng thái, người thay đổi và lý do.
