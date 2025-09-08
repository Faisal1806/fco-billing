
'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

// Hardcoded user ID for the single-tenant app structure.
const userId = 'default-user';

// Generic function to save a document under the user's collections
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const db = getClientDb();
    // The path is now correctly structured as users/{userId}/{collectionName}/{id}
    const docPath = `users/${userId}/${collectionName}/${id}`;
    await setDoc(doc(db, docPath), data, { merge: true });
    return { success: true };
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
