# Refactor Audit - Phase 1: Baseline

## 1. Trạng thái Backend (`grab-food-monolith`)
- **Khởi động:** Backend đã cài đặt dependencies và có thể kết nối với cơ sở dữ liệu (`Database initialized successfully`).
- **Lỗi hiện tại:**
  - `EADDRINUSE: address already in use :::3000`: Cổng 3000 đã được sử dụng.
  - **Nguyên nhân:** Có thể ứng dụng node khác đang chạy hoặc phiên bản cũ của backend chưa được tắt.
  - **Khắc phục trong refactor:** Không cần sửa code, chỉ cần tắt process cũ hoặc đổi port trong `.env`.

## 2. Trạng thái Frontend (`client/fe_fegrapfood`)
- **Khởi động:** Build thất bại.
- **Lỗi hiện tại:** 
  ```
  src/pages/RestaurantListPage.tsx(138,42): error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'number'.
  ```
- **File lỗi:** `src/pages/RestaurantListPage.tsx`
- **Nguyên nhân:** Lỗi kiểm tra kiểu dữ liệu (TypeScript) khi truyền giá trị `boolean` vào nơi yêu cầu `number`.
- **Khắc phục trong refactor:** **Có**. Sẽ được xử lý trong Phase 6 khi refactor lại kiến trúc Frontend theo Feature module (sẽ viết lại thành `features/restaurants/pages/...`).

## 3. Seed Database
- Data seed file `seed_all.sql` gặp lỗi `Duplicate key name 'idx_driver_locations_driver_id'` nếu chạy trực tiếp trên database đã được khởi tạo/seed từ trước.
- **Tình trạng:** Data đã có sẵn, database đã được khởi tạo trước đó. Không ảnh hưởng đến luồng phát triển.

## 4. Danh sách Endpoint Backend (hiện có)
### Views (EJS / HTML)
- `GET /` - Home
- `GET /map` - Map
- `GET /foods-crud` - Quản lý Food
- `GET /categories-crud` - Quản lý Category
- `GET /dashboard-login` - Đăng nhập Dashboard
- `GET /orders-dashboard` - Dashboard Đơn hàng

### API Routes
- `GET /api/order-statuses`
- `GET /api/order-statuses/transitions`
- `USE /api/auth/*`
- `USE /api/users/*`
- `USE /api/drivers/*`
- `USE /api/orders/*`
- `USE /api/restaurants/*`
- `USE /api/categories/*`
- `USE /api/foods/*`
- `USE /api/payments/*`

## 5. Danh sách màn hình Frontend (hiện có)
Cấu trúc hiện tại nằm toàn bộ trong thư mục `src/pages`:
- `AdminPage.tsx`
- `DriverPage.tsx`
- `HomePage.tsx`
- `LoginPage.tsx`
- `RestaurantDetailPage.tsx`
- `RestaurantFormPage.tsx`
- `RestaurantListPage.tsx`
- `TrackingPage.tsx`

> **Note:** Sẽ được chuyển sang mô hình feature-based trong Phase 6 thay vì cấu trúc phẳng hiện tại.
