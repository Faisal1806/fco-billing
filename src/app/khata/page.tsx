// This file is now a redirect. The functionality has been moved into src/app/statement/page.tsx.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KhataRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/statement');
    }, [router]);
    return null;
}
