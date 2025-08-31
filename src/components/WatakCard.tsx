// components/WatakCard.tsx
import { Logo } from "./logo";
import { WatakEntry } from "@/app/(app)/watak-register/page";

const gradients: Record<string, string> = {
  watak: "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600",
  bill: "bg-gradient-to-r from-red-400 via-pink-500 to-rose-600",
  challan: "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600",
  receipt: "bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600",
};

export default function WatakCard({ data }: { data: WatakEntry }) {
  const type = "watak";
  const title = `Watak #${data.watakNo}`;

  return (
    <div
      className={`rounded-2xl shadow-xl p-6 text-white ${gradients[type]} print:bg-white print:text-black print:shadow-none h-full flex flex-col`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-white/20 rounded-full p-1">
          <Logo className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-wide">{title}</h2>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-inner flex-grow">
        <p className="text-lg font-semibold">{data.customerName}</p>
        {data.customerUrdu && <p className="font-urdu text-xl mt-1">{data.customerUrdu}</p>}
        <p className="text-sm mt-2">Date: {new Date(data.date).toLocaleDate_String()}</p>
        <p className="text-2xl font-bold mt-4">₹{data.netSale.toFixed(2)}</p>
      </div>
    </div>
  );
}
