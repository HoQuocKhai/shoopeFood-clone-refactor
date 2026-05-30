import type { Order } from './order.types';
import type { Restaurant } from '../../restaurants/types/restaurant.types';
import type { Driver, DriverLocation } from '../../driver/types/driver.types';

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type OrderTracking = {
  order: Order;
  restaurant: Pick<
    Restaurant,
    'id' | 'name' | 'address' | 'latitude' | 'longitude' | 'isOpen'
  > | null;
  driver: Driver | null;
  driverLocation: DriverLocation | null;
  destination: RoutePoint;
  routePoints: RoutePoint[];
  routeProgress: number;
};
