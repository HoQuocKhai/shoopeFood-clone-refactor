export type OrderItemPayload = {
  foodId: number;
  quantity: number;
};

export type CreateOrderPayload = {
  customerId: number;
  restaurantId: number;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;
  distanceKm: number;
  shippingType?: 'STANDARD' | 'FAST' | 'ECO';
  discountAmount?: number;
  taxAmount?: number;
  items: OrderItemPayload[];
};

export type OrderItem = {
  id: number;
  orderId: number;
  foodId: number;
  foodName: string | null;
  quantity: number;
  priceAtOrder: number;
  lineTotal: number;
};

export type Order = {
  id: number;
  orderCode: string;
  customerId: number;
  restaurantId: number;
  receiverAddress: string;
  distanceKm: number;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  statusCode: string | null;
  statusLabel: string | null;
  items: OrderItem[];
  version: number;
  createdAt: string;
};

export type UpdateOrderPayload = Partial<{
  customerId: number;
  restaurantId: number;
  receiverAddress: string;
  receiverLat: number;
  receiverLng: number;
  distanceKm: number;
  baseFee: number;
  statusCode: string;
  discountAmount: number;
  taxAmount: number;
  shippingType: 'STANDARD' | 'FAST' | 'ECO';
  driverId: number | null;
  voucherId: number | null;
  expectedVersion: number;
}>;
