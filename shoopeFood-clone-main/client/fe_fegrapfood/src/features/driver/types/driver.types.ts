export type Driver = {
  id: number;
  fullName: string;
  phone: string;
  ratingAvg?: number;
  vehicleType: string;
  licensePlate: string;
  isOnline: boolean;
};

export type DriverLocation = {
  id: number | null;
  driverId: number;
  orderId: number | null;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
  createdAt: string | null;
};

export type UpdateDriverLocationPayload = {
  orderId?: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
};
