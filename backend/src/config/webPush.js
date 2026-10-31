const webPush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@personalorganizer.app';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('⚠️ Web Push Warning: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in environment variables.');
}

module.exports = {
  webPush,
  vapidPublicKey,
};
