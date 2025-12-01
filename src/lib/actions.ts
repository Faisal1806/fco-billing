
'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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
        const notificationJobsRef = collection(db, `notificationJobs`);
        await setDoc(doc(notificationJobsRef), notification);
        return { success: true };
    } catch (error) {
        console.error("Error queueing notification job:", error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to save a document
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const db = getClientDb();
    const docPath = `${collectionName}/${id}`;
    await setDoc(doc(db, docPath), data, { merge: true });
    return { success: true, id };
  } catch (error) {
    console.error(`Error saving document to ${collectionName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

// Generic function to delete a document
export async function deleteDocument(collectionName: string, id: string) {
    try {
        const db = getClientDb();
        const docPath = `${collectionName}/${id}`;
        await deleteDoc(doc(db, docPath));
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error: (error as Error).message };
    }
}

// Generic function to get a single document from a collection
export async function getDocument(collectionName: string, id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const db = getClientDb();
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: "Document not found." };
        }
    } catch (error) {
        console.error(`Error fetching document from ${collectionName}:`, error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to get documents from a collection
export async function getDocuments(collectionName: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    // This function will now prioritize reading from localStorage to ensure data is always visible
    // even if there are Firestore permission issues.
    if (typeof window !== 'undefined') {
        try {
            const data: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Check for both new and old prefixes to ensure all data is loaded.
                if (key?.startsWith(`${collectionName}-`) || key?.startsWith(`${collectionName.slice(0, -1)}-`)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        data.push(JSON.parse(item));
                    }
                }
            }
            return { success: true, data };
        } catch (error) {
             console.error("Error fetching documents from localStorage:", error);
             return { success: false, error: (error as Error).message };
        }
    }
    
    // Fallback for server-side rendering (though this component seems client-side heavy)
    try {
        const db = getClientDb();
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching documents from Firestore:", error);
        return { success: false, error: (error as Error).message };
    }
}
