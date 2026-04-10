import { httpDelete, httpGet, httpPost, httpPut } from './http'
import type { ApiResponse, Restaurant, RestaurantPayload } from '../../types'

export async function getRestaurants() {
  const response = await httpGet<ApiResponse<Restaurant[]>>('/api/restaurants')
  return response.data
}

export async function getRestaurantById(id: number) {
  const response = await httpGet<ApiResponse<Restaurant>>(`/api/restaurants/${id}`)
  return response.data
}

export async function createRestaurant(payload: RestaurantPayload) {
  const response = await httpPost<ApiResponse<Restaurant>>('/api/restaurants', payload)
  return response.data
}

export async function updateRestaurant(id: number, payload: RestaurantPayload) {
  const response = await httpPut<ApiResponse<Restaurant>>(`/api/restaurants/${id}`, payload)
  return response.data
}

export async function deleteRestaurant(id: number) {
  const response = await httpDelete<ApiResponse<Restaurant>>(`/api/restaurants/${id}`)
  return response.data
}
