
'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Sends push notifications to specified FCM tokens.
 * This function now correctly queues a job in Firestore which a separate service
 * (not part of this codebase) would listen to for sending notifications via FCM.
 */
export async function sendPushNotification(notification: {
    title: string;
    body: string;
    tokens: string[];
    url?: string;
}) {
    if (notification.tokens.length === 0) {
        console.log("No FCM tokens found. Skipping notification.");
        return { success: true, message: "No tokens provided." };
    }

    try {
        const db = getClientDb();
        const notificationJobsRef = collection(db, 'notificationJobs');
        await addDoc(notificationJobsRef, {
            ...notification,
            createdAt: serverTimestamp(),
            status: 'pending',
        });
        return { success: true, message: "Notification job queued successfully." };
    } catch (error) {
        console.error("Error queueing notification job:", error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to save a document
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const db = getClientDb();
    await setDoc(doc(db, collectionName, id), data, { merge: true });
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
        await deleteDoc(doc(db, collectionName, id));
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
            return { success: false, error: "Document not found in the cloud." };
        }
    } catch (error) {
        console.error(`Error fetching document from ${collectionName}:`, error);
        return { success: false, error: (error as Error).message };
    }
}


// Generic function to get documents from a collection
export async function getDocuments(collectionName: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const db = getClientDb();
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { success: true, data };
    } catch (error) {
        console.error(`Error fetching documents from ${collectionName}:`, error);
        return { success: false, error: (error as Error).message };
    }
}
