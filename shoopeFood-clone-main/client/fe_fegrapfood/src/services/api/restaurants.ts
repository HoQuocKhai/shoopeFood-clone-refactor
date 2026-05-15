import { httpDelete, httpGet, httpPost, httpPut, httpPatch } from './http'
import type {
  ApiResponse,
  Restaurant,
  RestaurantCreateInput,
  RestaurantUpdateInput,
  RestaurantChangeRequest,
} from '../../types'

// ==== PUBLIC API FUNCTIONS ====

export async function getRestaurants(includePending?: boolean) {
  const response = await httpGet<ApiResponse<Restaurant[]>>('/api/restaurants', {
    query: includePending ? { includePending: 'true' } : {},
  })
  return response.data
}

export async function getAllRestaurantsForAdmin() {
  const response = await httpGet<ApiResponse<Restaurant[]>>('/api/restaurants', {
    query: { includePending: 'true' },
  })
  return response.data
}

export async function getMyRestaurants() {
  const response = await httpGet<ApiResponse<Restaurant[]>>('/api/restaurants/mine')
  return response.data
}

export async function getRestaurantById(id: number) {
  const response = await httpGet<ApiResponse<Restaurant>>(`/api/restaurants/${id}`)
  return response.data
}

// ==== CRUD API FUNCTIONS ====

export async function createRestaurant(payload: RestaurantCreateInput) {
  const response = await httpPost<ApiResponse<Restaurant>>('/api/restaurants', payload)
  return response.data
}

export async function updateRestaurant(id: number, payload: RestaurantUpdateInput) {
  const response = await httpPut<ApiResponse<{ restaurant: Restaurant; changeRequest: RestaurantChangeRequest | null }>>(
    `/api/restaurants/${id}`,
    payload
  )
  return response.data
}

export async function deleteRestaurant(id: number) {
  const response = await httpDelete<ApiResponse<Restaurant>>(`/api/restaurants/${id}`)
  return response.data
}

// ==== STATUS API FUNCTIONS ====

export async function patchRestaurantStatus(id: number, isOpen: boolean) {
  const response = await httpPatch<ApiResponse<Restaurant>>(`/api/restaurants/${id}/status`, { isOpen })
  return response.data
}

export async function patchRestaurantTodayStatus(
  id: number,
  isOpenToday: boolean,
  reason?: string,
  temporaryClosedUntil?: string
) {
  const response = await httpPatch<ApiResponse<Restaurant>>(`/api/restaurants/${id}/today-status`, {
    isOpenToday,
    reason,
    temporaryClosedUntil,
  })
  return response.data
}

export async function patchRestaurantLocation(id: number, latitude: number, longitude: number) {
  const response = await httpPatch<ApiResponse<Restaurant>>(`/api/restaurants/${id}/location`, {
    latitude,
    longitude,
  })
  return response.data
}

// ==== ADMIN API FUNCTIONS ====

export async function getPendingRestaurants() {
  const response = await httpGet<ApiResponse<Restaurant[]>>('/api/restaurants/admin/pending')
  return response.data
}

export async function approveRestaurant(id: number, approvedBy?: number) {
  const response = await httpPatch<ApiResponse<Restaurant>>(`/api/restaurants/admin/${id}/approve`, {
    approvedBy,
  })
  return response.data
}

export async function rejectRestaurant(id: number, reason?: string) {
  const response = await httpPatch<ApiResponse<Restaurant>>(`/api/restaurants/admin/${id}/reject`, {
    reason,
  })
  return response.data
}

// ==== CHANGE REQUEST API FUNCTIONS ====

export async function getRestaurantChangeRequests(status?: string) {
  const response = await httpGet<ApiResponse<RestaurantChangeRequest[]>>('/api/restaurants/admin/change-requests', {
    query: status ? { status } : {},
  })
  return response.data
}

export async function approveRestaurantChangeRequest(id: number, reviewedBy?: number) {
  const response = await httpPatch<
    ApiResponse<{ changeRequest: RestaurantChangeRequest; restaurant: Restaurant }>
  >(`/api/restaurants/admin/change-requests/${id}/approve`, {
    reviewedBy,
  })
  return response.data
}

export async function rejectRestaurantChangeRequest(id: number, reason?: string) {
  const response = await httpPatch<ApiResponse<RestaurantChangeRequest>>(
    `/api/restaurants/admin/change-requests/${id}/reject`,
    {
      reason,
    }
  )
  return response.data
}
