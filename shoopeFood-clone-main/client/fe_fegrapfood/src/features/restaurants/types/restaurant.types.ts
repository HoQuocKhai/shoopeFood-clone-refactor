export type Restaurant = {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
  isOpenToday: boolean;
  temporaryClosedReason: string | null;
  temporaryClosedUntil: string | null;
  imageUrl: string | null;
  ratingAvg: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: number | null;
  approvedAt: string | null;
  rejectReason: string | null;
  deletedAt: string | null;
};

export type RestaurantCreateInput = {
  ownerId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  isOpen?: boolean;
  isOpenToday?: boolean;
  temporaryClosedReason?: string | null;
  temporaryClosedUntil?: string | null;
  imageUrl?: string | null;
  ratingAvg?: number;
};

export type RestaurantUpdateInput = Partial<RestaurantCreateInput> & {
  requestedBy?: number;
};

export type RestaurantChangeRequest = {
  id: number;
  restaurantId: number;
  requestedBy: number;
  payload: Partial<RestaurantCreateInput>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy: number | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string | null;
};

export type RestaurantPayload = RestaurantCreateInput;
