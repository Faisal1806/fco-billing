// This file is now a redirect. The functionality has been moved into src/app/sales/page.tsx under a tab.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReceiptsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/sales?tab=receipts');
    }, [router]);
    return null;
}

