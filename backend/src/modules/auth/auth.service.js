const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const { sendMail } = require('../../utils/mailer');
const User = require('../users/user.model');
const RefreshToken = require('./refreshToken.model');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function publicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId ? String(user.customerId) : null,
  };
}

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}

async function issueRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, tokenHash: sha256(token), expiresAt });
  return { token, expiresAt };
}

async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  // Compare even when the user is missing so response timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(password, user ? user.passwordHash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok || !user.isActive) throw new AppError(401, 'Invalid email or password');

  const refresh = await issueRefreshToken(user._id);
  return { user: publicUser(user), accessToken: signAccessToken(user), refresh };
}

async function rotate(oldToken) {
  if (!oldToken) throw new AppError(401, 'Missing refresh token');
  const existing = await RefreshToken.findOneAndDelete({ tokenHash: sha256(oldToken) });
  if (!existing || existing.expiresAt < new Date()) throw new AppError(401, 'Invalid refresh token');

  const user = await User.findById(existing.userId);
  if (!user || !user.isActive) throw new AppError(401, 'Account not available');

  const refresh = await issueRefreshToken(user._id);
  return { user: publicUser(user), accessToken: signAccessToken(user), refresh };
}

async function logout(token) {
  if (token) await RefreshToken.deleteOne({ tokenHash: sha256(token) });
}

async function me(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');
  return publicUser(user);
}

async function forgot(email) {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return;
  const token = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = sha256(token);
  user.resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    text: `Reset your password: ${env.CLIENT_ORIGIN}/reset-password?token=${token}\nThis link expires in 1 hour.`,
  });
}

async function reset(token, password) {
  const user = await User.findOne({ resetTokenHash: sha256(token), resetTokenExp: { $gt: new Date() } });
  if (!user) throw new AppError(400, 'Reset link is invalid or expired');
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenHash = undefined;
  user.resetTokenExp = undefined;
  await user.save();
  await RefreshToken.deleteMany({ userId: user._id });
}

module.exports = { login, rotate, logout, me, forgot, reset, publicUser };
