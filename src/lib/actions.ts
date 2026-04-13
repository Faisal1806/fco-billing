'use client';

import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Initialize Firestore on the client side
const db = getFirestore(app);

/**
 * Sends push notifications to specified FCM tokens by queueing a job.
 */
export async function sendPushNotification(notification: {
    title: string;
    body: string;
    tokens: string[];
    url?: string;
}) {
    if (notification.tokens.length === 0) return { success: true };

    const notificationJobsRef = collection(db, 'notificationJobs');
    const jobData = {
        ...notification,
        createdAt: serverTimestamp(),
        status: 'pending',
    };

    return addDoc(notificationJobsRef, jobData)
        .then((docRef) => ({ success: true, id: docRef.id }))
        .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: notificationJobsRef.path,
                operation: 'create',
                requestResourceData: jobData,
            } satisfies SecurityRuleContext));
            return { success: false, error: error.message };
        });
}

/**
 * Saves a document to Firestore with non-blocking error handling.
 */
export async function saveDocument(collectionName: string, id: string, data: any) {
    const docRef = doc(db, collectionName, id);
    const cleanData = JSON.parse(JSON.stringify(data)); // Strip non-serializable content

    return setDoc(docRef, cleanData, { merge: true })
        .then(() => ({ success: true, id }))
        .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'write',
                requestResourceData: cleanData,
            } satisfies SecurityRuleContext));
            return { success: false, error: error.message };
        });
}

/**
 * Deletes a document from Firestore.
 */
export async function deleteDocument(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    return deleteDoc(docRef)
        .then(() => ({ success: true }))
        .catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            } satisfies SecurityRuleContext));
            return { success: false, error: error.message };
        });
}

/**
 * Fetches a single document from Firestore.
 */
export async function getDocument(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        return { success: false, error: "Document not found." };
    } catch (error: any) {
        const contextualError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', contextualError);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches all documents from a collection.
 */
export async function getDocuments(collectionName: string) {
    const colRef = collection(db, collectionName);
    try {
        const querySnapshot = await getDocs(colRef);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, data };
    } catch (error: any) {
        const contextualError = new FirestorePermissionError({
            path: colRef.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', contextualError);
        return { success: false, error: error.message };
    }
}