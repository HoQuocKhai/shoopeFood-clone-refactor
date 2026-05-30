exports.normalizeFood = (item) => ({
  id: item.id,
  categoryId: item.categoryId,
  name: item.name,
  price: Number(item.price),
  isAvailable: Boolean(item.isAvailable),
  defaultQuantity: Number(item.defaultQuantity || 0),
  currentQuantity: Number(item.currentQuantity || 0),
  quantityResetDate: item.quantityResetDate || null,
});
