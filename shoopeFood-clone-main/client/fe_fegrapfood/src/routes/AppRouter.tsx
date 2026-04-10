import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import HomePage from '../pages/HomePage'
import RestaurantListPage from '../pages/RestaurantListPage'
import RestaurantFormPage from '../pages/RestaurantFormPage'

export default function AppRouter() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/restaurants/create" element={<RestaurantFormPage />} />
        <Route path="/restaurants/:id/edit" element={<RestaurantFormPage />} />
      </Routes>
    </MainLayout>
  )
}
