const { User, Role } = require('../../../models');
const { NotFoundError } = require('../../../common/errors');

const userInclude = [
  { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
];

class UserService {
  async getUsers() {
    return User.findAll({ include: userInclude, order: [['id', 'ASC']] });
  }

  async getUserById(id) {
    const item = await User.findByPk(id, { include: userInclude });
    if (!item) throw new NotFoundError('User not found');
    return item;
  }

  async createUser(payload) {
    return User.create(payload);
  }

  async updateUser(id, payload) {
    const item = await User.findByPk(id);
    if (!item) throw new NotFoundError('User not found');

    await item.update(payload);
    return item;
  }

  async deleteUser(id) {
    const item = await User.findByPk(id);
    if (!item) throw new NotFoundError('User not found');
    await item.destroy();
    return item;
  }
}

module.exports = new UserService();
