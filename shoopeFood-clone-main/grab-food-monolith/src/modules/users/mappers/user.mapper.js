exports.normalizeUser = (item) => ({
  id: item.id,
  fullName: item.fullName || '',
  phone: item.phone || '',
  ratingAvg: Number(item.ratingAvg || 0),
  roles: item.roles ? item.roles.map((role) => role.name) : [],
  createdAt: item.createdAt,
});
