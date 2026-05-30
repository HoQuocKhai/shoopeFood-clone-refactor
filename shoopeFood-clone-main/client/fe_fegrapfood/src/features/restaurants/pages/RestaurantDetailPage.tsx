import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { APP_NAME } from '../../../constants/app';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { getRestaurantById } from '../api/restaurants';
import { getFoods } from '../../menu/api/foods';
import { getCategories } from '../../menu/api/categories';
import type { Restaurant, Food, Category } from '../../../types';

function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '-';
  return timeString.slice(0, 5);
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN');
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);

  useDocumentTitle(`${APP_NAME} | Chi tiết nhà hàng`);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isRestaurantLoading, setIsRestaurantLoading] = useState(true);
  const [isFoodsLoading, setIsFoodsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(restaurantId)) {
      setErrorMessage('ID nhà hàng không hợp lệ');
      return;
    }

    let ignore = false;

    async function loadData() {
      try {
        setIsRestaurantLoading(true);
        setErrorMessage(null);

        const restaurantData = await getRestaurantById(restaurantId);

        if (!ignore) {
          setRestaurant(restaurantData);

          setIsFoodsLoading(true);
          setIsCategoriesLoading(true);
          setCategoryError(null);
          setFoodError(null);

          try {
            const [foodsData, categoriesData] = await Promise.all([
              getFoods({ restaurantId: Number(restaurantId) }),
              getCategories({ restaurantId: Number(restaurantId) }),
            ]);

            if (!ignore) {
              setFoods(foodsData);
              setCategories(categoriesData);
            }
          } catch (error) {
            if (!ignore) {
              const msg = error instanceof Error ? error.message : 'Không thể tải dữ liệu';
              setFoodError(msg);
              setCategoryError(msg);
            }
          } finally {
            if (!ignore) {
              setIsFoodsLoading(false);
              setIsCategoriesLoading(false);
            }
          }
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Không thể tải thông tin nhà hàng'
          );
        }
      } finally {
        if (!ignore) {
          setIsRestaurantLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [restaurantId]);

  if (isRestaurantLoading) {
    return (
      <section className="restaurant-page">
        <div className="loading-state">
          <p>Đang tải thông tin nhà hàng...</p>
        </div>
      </section>
    );
  }

  if (errorMessage || !restaurant) {
    return (
      <section className="restaurant-page">
        <div className="error-state">
          <p>{errorMessage || 'Không tìm thấy nhà hàng'}</p>

          <Link to="/restaurants" className="button-secondary">
            ← Quay lại danh sách
          </Link>
        </div>
      </section>
    );
  }

  const foodsByCategory: Record<number, Food[]> = {};

  foods.forEach((food) => {
    const catId = food.categoryId || 0;

    if (!foodsByCategory[catId]) {
      foodsByCategory[catId] = [];
    }

    foodsByCategory[catId].push(food);
  });

  const categoryMap: Record<number, Category | undefined> = {};

  categories.forEach((cat) => {
    categoryMap[cat.id] = cat;
  });

  return (
    <section className="restaurant-page">
      <div className="restaurant-page-header">
        <Link to="/restaurants" className="button-secondary">
          ← Quay lại danh sách
        </Link>
      </div>

      <div className="restaurant-detail-card">
        <div className="restaurant-detail-header">
          {restaurant.imageUrl && (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="restaurant-detail-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="restaurant-detail-info">
            <h1>{restaurant.name}</h1>

            <div className="detail-status-badges">
              <span className={`status-badge ${restaurant.approvalStatus.toLowerCase()}`}>
                {restaurant.approvalStatus === 'PENDING'
                  ? 'Chờ phê duyệt'
                  : restaurant.approvalStatus === 'APPROVED'
                    ? 'Đã duyệt'
                    : 'Bị từ chối'}
              </span>

              <span className={`status-badge ${restaurant.isOpen ? 'open' : 'closed'}`}>
                {restaurant.isOpen ? 'Mở cửa' : 'Đóng cửa'}
              </span>

              <span className={`status-badge ${restaurant.isOpenToday ? 'open' : 'closed'}`}>
                {restaurant.isOpenToday ? 'Mở hôm nay' : 'Đóng hôm nay'}
              </span>
            </div>

            <p className="restaurant-detail-address">📍 {restaurant.address}</p>

            <div className="restaurant-detail-metrics">
              <span>⭐ {restaurant.ratingAvg.toFixed(2)}</span>

              <span>
                🕒 {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
              </span>

              <span>ID: #{restaurant.id}</span>
            </div>

            {restaurant.isOpenToday === false && restaurant.temporaryClosedReason && (
              <div className="alert alert-warning">
                <strong>Đóng tạm thời:</strong> {restaurant.temporaryClosedReason}
                {restaurant.temporaryClosedUntil && (
                  <p>Hết lý do lúc: {formatDateTime(restaurant.temporaryClosedUntil)}</p>
                )}
              </div>
            )}

            {restaurant.approvalStatus === 'REJECTED' && restaurant.rejectReason && (
              <div className="alert alert-error">
                <strong>Lý do từ chối:</strong> {restaurant.rejectReason}
              </div>
            )}

            {restaurant.approvalStatus === 'APPROVED' && (
              <p className="detail-meta">
                Phê duyệt bởi: Admin #{restaurant.approvedBy} vào{' '}
                {formatDateTime(restaurant.approvedAt)}
              </p>
            )}
          </div>
        </div>

        <div className="restaurant-map-section">
          <h2>Vị trí địa lý</h2>

          <div className="restaurant-coordinates">
            <span>
              📌 Vĩ độ: <strong>{restaurant.latitude.toFixed(6)}</strong>
            </span>

            <span>
              📌 Kinh độ: <strong>{restaurant.longitude.toFixed(6)}</strong>
            </span>
          </div>

          <div className="restaurant-map-placeholder">
            Bản đồ sẽ được hiển thị tại vị trí ({restaurant.latitude}, {restaurant.longitude})
          </div>
        </div>

        <div className="restaurant-foods-section">
          <h2>Danh sách đồ ăn</h2>

          {foodError && <p className="restaurant-feedback error">{foodError}</p>}

          {categoryError && <p className="restaurant-feedback error">{categoryError}</p>}

          {isFoodsLoading || isCategoriesLoading ? (
            <p className="loading-state">Đang tải danh sách đồ ăn...</p>
          ) : foods.length === 0 ? (
            <p className="empty-state">Chưa có đồ ăn nào</p>
          ) : (
            <div className="foods-by-category">
              {Object.entries(foodsByCategory).map(([catIdStr, categoryFoods]) => {
                const catId = Number(catIdStr);
                const category = categoryMap[catId];
                const categoryName = category ? category.name : 'Không có danh mục';

                return (
                  <div key={catId} className="food-category-group">
                    <h3>{categoryName}</h3>

                    <div className="food-grid">
                      {categoryFoods.map((food) => (
                        <div key={food.id} className="food-card">
                          <div className="food-card-header">
                            <h4>{food.name}</h4>

                            <span
                              className={`availability-badge ${
                                food.isAvailable ? 'available' : 'unavailable'
                              }`}
                            >
                              {food.isAvailable ? 'Còn' : 'Hết'}
                            </span>
                          </div>

                          <div className="food-card-details">
                            <p>
                              💰 <strong>{food.price.toLocaleString('vi-VN')} ₫</strong>
                            </p>

                            <p>
                              📦 Hiện có: {food.currentQuantity}/{food.defaultQuantity}
                            </p>

                            {food.quantityResetDate && (
                              <p>🔄 Reset lúc: {formatDateTime(food.quantityResetDate)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
