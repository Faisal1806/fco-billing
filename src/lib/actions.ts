
'use server';

import { getClientDb } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';

// Generic function to save a document
export async function saveDocument(collectionName: string, id: string, data: any) {
  const db = getClientDb();
  await setDoc(doc(db, collectionName, id), data);
}

// Generic function to delete a document
export async function deleteDocument(collectionName: string, id: string) {
  const db = getClientDb();
  await deleteDoc(doc(db, collectionName, id));
}

// Generic function to fetch all documents from a collection
export async function getDocuments(collectionName: string) {
    const db = getClientDb();
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
