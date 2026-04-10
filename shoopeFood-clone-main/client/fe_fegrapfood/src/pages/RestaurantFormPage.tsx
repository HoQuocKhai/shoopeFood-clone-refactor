import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_NAME } from '../constants/app'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { createRestaurant, getRestaurantById, updateRestaurant } from '../services/api/restaurants'
import type { RestaurantPayload } from '../types'

type RestaurantFormState = {
  ownerId: string
  name: string
  address: string
  latitude: string
  longitude: string
  isOpen: boolean
  imageUrl: string
  ratingAvg: string
}

type FormErrors = Partial<Record<keyof RestaurantFormState, string>>

const initialFormState: RestaurantFormState = {
  ownerId: '1',
  name: '',
  address: '',
  latitude: '0',
  longitude: '0',
  isOpen: true,
  imageUrl: '',
  ratingAvg: '5',
}

export default function RestaurantFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const restaurantId = id ? Number(id) : null
  const isEditMode = restaurantId !== null && Number.isFinite(restaurantId)

  useDocumentTitle(`${APP_NAME} | ${isEditMode ? 'Edit restaurant' : 'Create restaurant'}`)

  const [formData, setFormData] = useState<RestaurantFormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditMode || restaurantId === null) {
      setFormData(initialFormState)
      return
    }

    const nextRestaurantId = restaurantId
    let ignore = false

    async function loadRestaurant() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const restaurant = await getRestaurantById(nextRestaurantId)

        if (!ignore) {
          setFormData({
            ownerId: String(restaurant.ownerId),
            name: restaurant.name,
            address: restaurant.address,
            latitude: String(restaurant.latitude),
            longitude: String(restaurant.longitude),
            isOpen: restaurant.isOpen,
            imageUrl: restaurant.imageUrl ?? '',
            ratingAvg: String(restaurant.ratingAvg),
          })
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : 'Khong the tai chi tiet restaurant')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadRestaurant()

    return () => {
      ignore = true
    }
  }, [isEditMode, restaurantId])

  function handleFieldChange<K extends keyof RestaurantFormState>(field: K, value: RestaurantFormState[K]) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  function validateForm(): RestaurantPayload | null {
    const nextErrors: FormErrors = {}
    const trimmedName = formData.name.trim()
    const trimmedAddress = formData.address.trim()
    const ownerId = Number(formData.ownerId)
    const latitude = Number(formData.latitude)
    const longitude = Number(formData.longitude)
    const ratingAvg = Number(formData.ratingAvg)

    if (!trimmedName) {
      nextErrors.name = 'Name la bat buoc'
    }

    if (!trimmedAddress) {
      nextErrors.address = 'Address la bat buoc'
    }

    if (!Number.isFinite(ownerId)) {
      nextErrors.ownerId = 'OwnerId phai la so'
    }

    if (!Number.isFinite(latitude)) {
      nextErrors.latitude = 'Latitude phai parse duoc sang number'
    }

    if (!Number.isFinite(longitude)) {
      nextErrors.longitude = 'Longitude phai parse duoc sang number'
    }

    if (!Number.isFinite(ratingAvg)) {
      nextErrors.ratingAvg = 'RatingAvg phai parse duoc sang number'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return null
    }

    return {
      ownerId,
      name: trimmedName,
      address: trimmedAddress,
      latitude,
      longitude,
      isOpen: formData.isOpen,
      imageUrl: formData.imageUrl.trim() || null,
      ratingAvg,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = validateForm()
    if (!payload) {
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      if (isEditMode && restaurantId !== null) {
        await updateRestaurant(restaurantId, payload)
      } else {
        await createRestaurant(payload)
      }

      navigate('/restaurants')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khong the luu restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="restaurant-page">
      <div className="restaurant-form-card">
        <h1>{isEditMode ? 'Edit restaurant' : 'Create restaurant'}</h1>
        <p>Nhap day du thong tin restaurant va submit truc tiep len backend.</p>
      </div>

      <div className="restaurant-form-card">
        {isLoading ? <p className="restaurant-status-text">Dang tai du lieu restaurant...</p> : null}
        {errorMessage ? <p className="restaurant-feedback error">{errorMessage}</p> : null}

        {!isLoading ? (
          <form className="restaurant-form" onSubmit={handleSubmit}>
            <div className="restaurant-form-grid">
              <div className="restaurant-field">
                <label htmlFor="ownerId">Owner ID</label>
                <input
                  id="ownerId"
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={(event) => handleFieldChange('ownerId', event.target.value)}
                />
                {errors.ownerId ? <p className="field-error">{errors.ownerId}</p> : null}
              </div>

              <div className="restaurant-field">
                <label htmlFor="ratingAvg">Rating Avg</label>
                <input
                  id="ratingAvg"
                  name="ratingAvg"
                  value={formData.ratingAvg}
                  onChange={(event) => handleFieldChange('ratingAvg', event.target.value)}
                />
                {errors.ratingAvg ? <p className="field-error">{errors.ratingAvg}</p> : null}
              </div>

              <div className="restaurant-field full">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(event) => handleFieldChange('name', event.target.value)}
                />
                {errors.name ? <p className="field-error">{errors.name}</p> : null}
              </div>

              <div className="restaurant-field full">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(event) => handleFieldChange('address', event.target.value)}
                />
                {errors.address ? <p className="field-error">{errors.address}</p> : null}
              </div>

              <div className="restaurant-field">
                <label htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={(event) => handleFieldChange('latitude', event.target.value)}
                />
                {errors.latitude ? <p className="field-error">{errors.latitude}</p> : null}
              </div>

              <div className="restaurant-field">
                <label htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={(event) => handleFieldChange('longitude', event.target.value)}
                />
                {errors.longitude ? <p className="field-error">{errors.longitude}</p> : null}
              </div>

              <div className="restaurant-field full">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={(event) => handleFieldChange('imageUrl', event.target.value)}
                />
              </div>

              <div className="restaurant-field full">
                <label htmlFor="isOpen">Trang thai mo cua</label>
                <label className="restaurant-checkbox" htmlFor="isOpen">
                  <input
                    id="isOpen"
                    name="isOpen"
                    type="checkbox"
                    checked={formData.isOpen}
                    onChange={(event) => handleFieldChange('isOpen', event.target.checked)}
                  />
                  <span>{formData.isOpen ? 'Dang mo cua' : 'Tam dong cua'}</span>
                </label>
              </div>
            </div>

            <div className="restaurant-form-actions">
              <Link to="/restaurants" className="button-secondary">
                Back to list
              </Link>

              <button type="submit" className="button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Update restaurant' : 'Create restaurant'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  )
}
