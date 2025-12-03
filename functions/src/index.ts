/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin SDK
initializeApp();

/**
 * Cloud Function that triggers when a new document is created in the
 * 'notificationJobs' collection. It sends a push notification using FCM.
 */
export const sendPushNotification = onDocumentCreated(
  "notificationJobs/{jobId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }

    const job = snapshot.data();
    const { tokens, title, body, url } = job;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      logger.error("No valid FCM tokens found in the job payload.");
      return;
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      webpush: {
        fcmOptions: {
          link: url || "https://swiftsale-ewd7o.web.app/dashboard",
        },
        notification: {
          icon: "https://swiftsale-ewd7o.web.app/icons/icon-192x192.png"
        }
      },
      tokens: tokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);
      logger.log("Successfully sent message:", response);
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        logger.warn("List of tokens that caused failures:", failedTokens);
      }
    } catch (error) {
      logger.error("Error sending message:", error);
    }
  }
);
