const { z } = require('zod');

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8).max(128);

module.exports = {
  login: { body: z.object({ email, password: z.string().min(1) }) },
  forgot: { body: z.object({ email }) },
  reset: { body: z.object({ token: z.string().min(10), password }) },
};
