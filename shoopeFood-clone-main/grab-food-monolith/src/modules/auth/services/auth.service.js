const { User, Role } = require('../../../models');
const { UnauthorizedError, ForbiddenError, NotFoundError } = require('../../../common/errors');
const { createAuthToken } = require('../../../utils/authToken');

class AuthService {
  async login({ phone, password, role }) {
    const user = await User.findOne({
      where: { phone },
      include: [
        { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });

    if (!user || String(user.password) !== password) {
      throw new UnauthorizedError('Invalid phone or password');
    }

    const roleNames = (user.roles || []).map((r) => r.name);
    if (!roleNames.includes(role)) {
      throw new ForbiddenError(`User does not have ${role} role`);
    }

    const token = createAuthToken({
      sub: user.id,
      phone: user.phone,
      role: role,
      roles: roleNames,
    });

    return { token, user };
  }

  async getMe(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
      ],
    });

    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

module.exports = new AuthService();
