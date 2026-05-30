module.exports = (allowedRoles = []) => {
  const normalizedRoles = allowedRoles.map((role) => String(role).toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = String(req.user.role || '').toUpperCase();
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
