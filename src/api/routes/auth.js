const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { validateBody } = require('../../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../../validation/authSchemas');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} = require('../../lib/authTokens');

const router = express.Router();
const BCRYPT_ROUNDS = 12;

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });
  return { accessToken, refreshToken };
}

router.post('/register', validateBody(registerSchema), async (req, res) => {
  const { name, email, password, role, phone, timezone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      phone,
      timezone: timezone || undefined,
    },
  });

  const tokens = await issueTokenPair(user);
  logger.info({ userId: user.id, role: user.role }, 'user registered');

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  });
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  const validUser = user && (await bcrypt.compare(password, user.passwordHash));
  if (!validUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const tokens = await issueTokenPair(user);
  logger.info({ userId: user.id }, 'user logged in');

  return res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  });
});

router.post('/refresh', validateBody(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;
  const tokenHash = hashRefreshToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  const tokens = await issueTokenPair(user);

  return res.status(200).json(tokens);
});

router.post('/logout', validateBody(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;
  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return res.status(204).send();
});

module.exports = router;
