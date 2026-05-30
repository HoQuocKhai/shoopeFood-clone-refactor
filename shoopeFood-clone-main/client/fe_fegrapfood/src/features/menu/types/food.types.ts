export type Food = {
  id: number;
  categoryId: number | null;
  name: string;
  price: number;
  isAvailable: boolean;
  defaultQuantity: number;
  currentQuantity: number;
  quantityResetDate: string | null;
};
