
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ProductsPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>This feature is coming soon. You will be able to manage your product inventory here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
            <p>Product management is under construction.</p>
        </div>
      </CardContent>
    </Card>
  );
}
