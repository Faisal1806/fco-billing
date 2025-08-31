
// components/WatakCard.tsx
export default function WatakCard({ data }: { data: any }) {
  return (
    <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white">
      <h2 className="text-xl font-bold">Watak #{data.watakNo}</h2>
      <p className="mt-2 text-lg">{data.customerName}</p>
       {data.customerUrdu && <p className="mt-2 font-urdu text-lg">{data.customerUrdu}</p>}
      <p className="mt-1">Amount: ₹{data.netSale.toFixed(2)}</p>
      <p>Date: {new Date(data.date).toLocaleDateString()}</p>
    </div>
  );
}
