// This file is now a redirect. The functionality has been moved into src/app/sales/page.tsx under a tab.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChallanRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/sales?tab=challan');
    }, [router]);
    return null;
}
