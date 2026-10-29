const env = require('../../config/env');
const service = require('./auth.service');

const COOKIE = 'refreshToken';
const cookieOptions = (expires) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  expires,
});

function sendSession(res, { user, accessToken, refresh }) {
  res.cookie(COOKIE, refresh.token, cookieOptions(refresh.expiresAt));
  res.json({ user, accessToken });
}

module.exports = {
  async login(req, res) {
    sendSession(res, await service.login(req.body.email, req.body.password));
  },
  async refresh(req, res) {
    sendSession(res, await service.rotate(req.cookies[COOKIE]));
  },
  async logout(req, res) {
    await service.logout(req.cookies[COOKIE]);
    res.clearCookie(COOKIE, cookieOptions());
    res.status(204).end();
  },
  async me(req, res) {
    res.json({ user: await service.me(req.user.id) });
  },
  async forgot(req, res) {
    await service.forgot(req.body.email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  },
  async reset(req, res) {
    await service.reset(req.body.token, req.body.password);
    res.json({ message: 'Password updated. Please sign in.' });
  },
};
