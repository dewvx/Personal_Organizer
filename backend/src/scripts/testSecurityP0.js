const assert = require('assert');
const { generateToken, verifyToken } = require('../middlewares/authGuard');

async function testSecurity() {
  console.log('🧪 Testing P0 Security & Token Guard...');

  // 1. Generate valid token
  const token = generateToken({ verified: true, role: 'owner' });
  assert(token && typeof token === 'string', 'Token should be a string');
  assert(token.includes('.'), 'Token should have payload.signature format');

  // 2. Verify valid token
  const payload = verifyToken(token);
  assert(payload !== null, 'Payload should not be null');
  assert(payload.verified === true, 'Token should contain verified: true');
  assert(payload.role === 'owner', 'Token should contain role');
  console.log('  ✅ PASS: Valid token verified successfully');

  // 3. Reject tampered token
  const tamperedToken = token.slice(0, -3) + 'abc';
  const tamperedPayload = verifyToken(tamperedToken);
  assert(tamperedPayload === null, 'Tampered token must be rejected');
  console.log('  ✅ PASS: Tampered token rejected');

  // 4. Reject malformed token
  assert(verifyToken('') === null, 'Empty token rejected');
  assert(verifyToken('invalidtokenformat') === null, 'Token without dot rejected');
  console.log('  ✅ PASS: Malformed tokens rejected');

  console.log('🎉 All Security & Token Guard tests passed successfully!\n');
}

testSecurity().catch((err) => {
  console.error('❌ Security test failed:', err);
  process.exit(1);
});
