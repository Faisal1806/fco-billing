
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

// This function cannot be a server action if it's called from client components on load.
// It is better to handle local storage fallback on the client side.
// However, if we want a server-side fetch, it must be used in Server Components.
export async function getDocuments(collectionName: string) {
    const db = getClientDb();
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
