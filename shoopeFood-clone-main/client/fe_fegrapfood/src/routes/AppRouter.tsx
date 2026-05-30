import { Route, Routes } from 'react-router-dom';
import RequireAuth from '../components/common/RequireAuth';
import MainLayout from '../layouts/MainLayout';
import AdminPage from '../features/admin/pages/AdminPage';
import HomePage from '../features/home/pages/HomePage';
import DriverPage from '../features/driver/pages/DriverPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RestaurantListPage from '../features/restaurants/pages/RestaurantListPage';
import RestaurantDetailPage from '../features/restaurants/pages/RestaurantDetailPage';
import RestaurantFormPage from '../features/restaurants/pages/RestaurantFormPage';
import TrackingPage from '../features/orders/pages/TrackingPage';

export default function AppRouter() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route
          path="/driver"
          element={
            <RequireAuth allowedRoles={['DRIVER', 'ADMIN']}>
              <DriverPage />
            </RequireAuth>
          }
        />
        <Route
          path="/restaurants"
          element={
            <RequireAuth allowedRoles={['CUSTOMER', 'MERCHANT', 'ADMIN']}>
              <RestaurantListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/restaurants/new"
          element={
            <RequireAuth allowedRoles={['MERCHANT', 'ADMIN']}>
              <RestaurantFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/restaurants/:id"
          element={
            <RequireAuth allowedRoles={['CUSTOMER', 'MERCHANT', 'ADMIN']}>
              <RestaurantDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/restaurants/:id/edit"
          element={
            <RequireAuth allowedRoles={['MERCHANT', 'ADMIN']}>
              <RestaurantFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={['ADMIN']}>
              <AdminPage />
            </RequireAuth>
          }
        />
      </Routes>
    </MainLayout>
  );
}
