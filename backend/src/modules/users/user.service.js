const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');
const { audit } = require('../audit/audit.model');
const Customer = require('../customers/customer.model');
const User = require('./user.model');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function list({ page, limit, role, q }) {
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ email: new RegExp(escapeRegex(q), 'i') }, { name: new RegExp(escapeRegex(q), 'i') }];
  return paginate(User, filter, { page, limit, sort: { role: 1, email: 1 }, populate: { path: 'customerId', select: 'name' } });
}

async function create(actor, { password, ...data }) {
  if (data.role !== 'customer') delete data.customerId;
  if (data.customerId && !(await Customer.exists({ _id: data.customerId }))) throw new AppError(400, 'Customer not found');
  const user = await User.create({ ...data, passwordHash: await bcrypt.hash(password, 10) });
  await audit(actor.id, 'user.create', 'user', user._id, { email: user.email, role: user.role });
  const { passwordHash, ...rest } = user.toObject();
  return rest;
}

async function update(actor, id, changes) {
  if (id === actor.id && (changes.isActive === false || (changes.role && changes.role !== 'admin'))) {
    throw new AppError(400, 'You cannot deactivate or demote yourself');
  }
  const update = { ...changes };
  if (update.customerId === null) {
    delete update.customerId;
    update.$unset = { customerId: 1 };
  }
  const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  if (!user) throw new AppError(404, 'User not found');
  await audit(actor.id, 'user.update', 'user', user._id, changes);
  return user;
}

module.exports = { list, create, update };
