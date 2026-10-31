const crypto = require('crypto');
const SettingModel = require('../models/settingModel');
const { errorResponse } = require('../utils/apiResponse');

const PIN_SETTING_KEY = 'pin_hash';
const AUTH_SECRET = process.env.AUTH_SECRET || 'personal_organizer_default_secret_key_change_in_prod';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically signed HMAC token for PIN verification
 */
function generateToken(payload = {}) {
  const data = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify a token's HMAC signature and expiration
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Express Middleware: Protect routes if a PIN is configured
 */
async function requireAuth(req, res, next) {
  try {
    const pinHash = await SettingModel.get(PIN_SETTING_KEY);
    // If no PIN is configured on the system, pass through freely
    if (!pinHash) {
      return next();
    }

    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (authHeader) {
      token = authHeader.trim();
    }

    if (!token) {
      return errorResponse(res, 'กรุณายืนยันรหัส PIN ก่อนเข้าถึงข้อมูล (Unauthorized)', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse(res, 'เซสชันหมดอายุหรือรหัสยืนยันไม่ถูกต้อง กรุณาใส่ PIN อีกครั้ง', 401);
    }

    req.authSession = payload;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
  generateToken,
  verifyToken,
};
