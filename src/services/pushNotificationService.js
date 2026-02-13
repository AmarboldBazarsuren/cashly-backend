/**
 * Push Notification Service
 * Firebase Cloud Messaging ашиглан push notification илгээх
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Firebase initialize
let firebaseApp;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  logger.warn('Firebase configuration missing');
}

/**
 * Push notification илгээх
 * @param {String} fcmToken - User-ийн FCM token
 * @param {Object} notification - {title, body}
 * @param {Object} data - Нэмэлт өгөгдөл
 */
exports.sendPushNotification = async (fcmToken, notification, data = {}) => {
  try {
    if (!firebaseApp || !fcmToken) {
      logger.warn('Firebase not configured or FCM token missing');
      return { success: false };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'cashly_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Олон хүнд зэрэг илгээх
 * @param {Array} fcmTokens - FCM tokens array
 * @param {Object} notification - {title, body}
 */
exports.sendMulticastNotification = async (fcmTokens, notification, data = {}) => {
  try {
    if (!firebaseApp || !fcmTokens || fcmTokens.length === 0) {
      return { success: false };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data,
      tokens: fcmTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Multicast sent: ${response.successCount}/${fcmTokens.length}`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    logger.error('Multicast notification error:', error);
    return { success: false, error: error.message };
  }
};