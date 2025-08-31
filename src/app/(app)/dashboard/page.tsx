
'use client'

import DocumentCard from "@/components/DocumentCard";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 p-2 md:grid-cols-2 lg:grid-cols-3">
      <DocumentCard type="watak" title="Watak">
        <p className="font-semibold">Grower: XYZ</p>
        <p>Quantity: 120 boxes</p>
        <p>Rate: ₹500</p>
      </DocumentCard>

      <DocumentCard type="bill" title="Bill">
        <p className="font-semibold">To: M/S Ahmad Traders</p>
        <p>Total Sale: ₹60,000</p>
        <p>Commission (12%): ₹7,200</p>
      </DocumentCard>

      <DocumentCard type="challan" title="Challan">
        <p className="font-semibold">Challan No: 1023</p>
        <p>Truck No: JK05 1234</p>
        <p>Freight: ₹4,500</p>
      </DocumentCard>

      <DocumentCard type="receipt" title="Receipt">
        <p className="font-semibold">Received from: Firdous Ahmad</p>
        <p>Amount: ₹25,000</p>
        <p>Balance: ₹12,000</p>
      </DocumentCard>
       <DocumentCard type="pesticide-bill" title="Pesticide Bill">
        <p className="font-semibold">Customer: Apple Orchards Inc.</p>
        <p>Items: 3</p>
        <p>Total: ₹1,800</p>
      </DocumentCard>
    </div>
  );
}
