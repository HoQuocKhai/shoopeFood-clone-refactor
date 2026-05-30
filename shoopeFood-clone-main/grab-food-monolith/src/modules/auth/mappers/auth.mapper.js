exports.normalizeAuthUser = (user, selectedRole) => {
  const roles = (user.roles || []).map((role) => role.name);

  return {
    id: user.id,
    fullName: user.fullName || '',
    phone: user.phone || '',
    ratingAvg: Number(user.ratingAvg || 0),
    roles,
    role: selectedRole || roles[0] || 'CUSTOMER',
    createdAt: user.createdAt,
  };
};
