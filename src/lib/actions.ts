
'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

// Hardcoded user ID for the single-tenant app structure.
const userId = 'default-user';

/**
 * Sends push notifications to specified FCM tokens.
 * NOTE: This is a simplified, client-relayed implementation for demonstration.
 * In a production environment, this should be handled by a secure server
 * with the Firebase Admin SDK.
 */
export async function sendPushNotification(notification: {
    title: string;
    body: string;
    tokens: string[];
    url?: string;
}) {
    // This is a placeholder for server-side push notification logic.
    // The actual sending will be triggered via a client-side effect that
    // reads from a 'notificationsToSend' collection, as we cannot use the Admin SDK here.
    console.log("Queueing notification:", notification);
    
    if (notification.tokens.length === 0) {
        console.log("No tokens to send notification to.");
        return { success: true, message: "No tokens provided." };
    }

    try {
        const db = getClientDb();
        const notificationJobsRef = collection(db, `users/${userId}/notificationJobs`);
        await setDoc(doc(notificationJobsRef), notification);
        return { success: true };
    } catch (error) {
        console.error("Error queueing notification job:", error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to save a document under the user's collections
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const db = getClientDb();
    // The path is now correctly structured as users/{userId}/{collectionName}/{id}
    const docPath = `users/${userId}/${collectionName}/${id}`;
    await setDoc(doc(db, docPath), data, { merge: true });
    return { success: true, id };
  } catch (error) {
    console.error(`Error saving document to ${collectionName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

// Generic function to delete a document from the user's collections
export async function deleteDocument(collectionName: string, id: string) {
    try {
        const db = getClientDb();
        const docPath = `users/${userId}/${collectionName}/${id}`;
        await deleteDoc(doc(db, docPath));
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error: (error as Error).message };
    }
}

// Generic function to get a single document from a user's collection
export async function getDocument(collectionName: string, id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const db = getClientDb();
        const docPath = `users/${userId}/${collectionName}/${id}`;
        const docSnap = await getDoc(doc(db, docPath));
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        
        return { success: false, error: "Document not found." };
    } catch (error) {
        console.error("Error fetching document:", error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to get documents from a user's collection
export async function getDocuments(collectionName: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const db = getClientDb();
        const collectionPath = `users/${userId}/${collectionName}`;
        const querySnapshot = await getDocs(collection(db, collectionPath));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching documents:", error);
        return { success: false, error: (error as Error).message };
    }
}
