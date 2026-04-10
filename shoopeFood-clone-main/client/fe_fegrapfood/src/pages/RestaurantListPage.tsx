import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../constants/app'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { deleteRestaurant, getRestaurants } from '../services/api/restaurants'
import type { Restaurant } from '../types'

function formatCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(6) : '0.000000'
}

export default function RestaurantListPage() {
  useDocumentTitle(`${APP_NAME} | Restaurants`)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    void loadRestaurants()
  }, [])

  async function loadRestaurants() {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const items = await getRestaurants()
      setRestaurants(items)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the tai danh sach nha hang')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(restaurant: Restaurant) {
    const confirmed = window.confirm(`Xoa nha hang "${restaurant.name}"?`)
    if (!confirmed) {
      return
    }

    try {
      setDeletingId(restaurant.id)
      setErrorMessage(null)
      setSuccessMessage(null)
      await deleteRestaurant(restaurant.id)
      setSuccessMessage(`Da xoa nha hang #${restaurant.id}`)
      await loadRestaurants()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the xoa nha hang')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="restaurant-page">
      <div className="restaurant-page-header">
        <div>
          <h1>Quan ly restaurant</h1>
          <p>Xem danh sach, tao moi, cap nhat va xoa restaurant bang API backend that.</p>
        </div>

        <Link to="/restaurants/create" className="button-primary">
          Add restaurant
        </Link>
      </div>

      <div className="restaurant-panel">
        <div className="restaurant-toolbar">
          <div>
            <h2>Restaurant list</h2>
            <div className="restaurant-count">
              {isLoading ? 'Dang tai...' : `${restaurants.length} restaurant`}
            </div>
          </div>

          <button type="button" className="button-secondary" onClick={() => void loadRestaurants()} disabled={isLoading}>
            Reload
          </button>
        </div>

        {errorMessage ? <p className="restaurant-feedback error">{errorMessage}</p> : null}
        {successMessage ? <p className="restaurant-feedback success">{successMessage}</p> : null}

        <div className="restaurant-grid">
          {restaurants.map((restaurant) => (
            <article key={restaurant.id} className="restaurant-manage-card">
              <div className="restaurant-manage-top">
                <span className="restaurant-manage-id">ID #{restaurant.id}</span>
                <span className={`status-tag ${restaurant.isOpen ? 'open' : 'closed'}`}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <h3>{restaurant.name}</h3>
              <p className="restaurant-manage-address">{restaurant.address}</p>

              <div className="restaurant-manage-meta">
                <span>Owner: {restaurant.ownerId}</span>
                <span>Rating: {restaurant.ratingAvg.toFixed(2)}</span>
              </div>

              <p className="restaurant-location">
                Lat: {formatCoordinate(restaurant.latitude)} | Lng: {formatCoordinate(restaurant.longitude)}
              </p>

              <div className="restaurant-actions">
                <Link to={`/restaurants/${restaurant.id}/edit`} className="button-secondary">
                  Edit
                </Link>

                <button
                  type="button"
                  className="button-danger"
                  onClick={() => void handleDelete(restaurant)}
                  disabled={deletingId === restaurant.id}
                >
                  {deletingId === restaurant.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}

          {!isLoading && restaurants.length === 0 ? (
            <p className="empty-state">Chua co restaurant nao tu backend.</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
