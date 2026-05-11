
'use client';

export async function uploadFile(file: File, path: string): Promise<string> {
  console.warn('uploadFile is disabled because Firebase storage has been removed.');
  throw new Error('File upload disabled.');
}
