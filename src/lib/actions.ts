'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

// Generic function to save a document
export async function saveDocument(collectionName: string, id: string, data: any) {
  try {
    const db = getClientDb();
    await setDoc(doc(db, collectionName, id), data);
    return { success: true };
  } catch (error) {
    console.error("Error saving document:", error);
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

export async function getDocuments(collectionName: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const db = getClientDb();
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching documents:", error);
        return { success: false, error: (error as Error).message };
    }
}
