exports.normalizeDriver = (item) => {
  const user = item.driverUser || item.User || null;

  return {
    id: item.userId,
    fullName: user ? user.fullName || '' : '',
    phone: user ? user.phone || '' : '',
    ratingAvg: Number(user ? user.ratingAvg || 0 : 0),
    vehicleType: item.vehicleType || '',
    licensePlate: item.licensePlate || '',
    isOnline: Boolean(item.isOnline),
    createdAt: user ? user.createdAt : null,
  };
};

exports.normalizeDriverLocation = (item) => ({
  id: item.id,
  driverId: item.driverId,
  orderId: item.orderId,
  latitude: Number(item.latitude || 0),
  longitude: Number(item.longitude || 0),
  heading: Number(item.heading || 0),
  speedKmh: Number(item.speedKmh || 0),
  createdAt: item.createdAt,
});
