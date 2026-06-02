
// components/DocumentCard.tsx
import { Logo } from "./logo";
import { Receipt, FileText, Truck, SprayCan } from "lucide-react";

type Props = {
  type: "watak" | "bill" | "challan" | "receipt" | 'pesticide-bill';
  title: string;
  children: React.ReactNode;
};

const gradients: Record<string, string> = {
  watak: "bg-gradient-to-br from-red-400 to-rose-600",
  bill: "bg-gradient-to-br from-green-400 to-teal-600",
  challan: "bg-gradient-to-br from-blue-400 to-purple-600",
  receipt: "bg-gradient-to-br from-yellow-400 to-amber-600",
  "pesticide-bill": "bg-gradient-to-br from-cyan-400 to-sky-600",
};

const icons: Record<string, React.ElementType> = {
    watak: FileText,
    bill: Truck,
    challan: Truck,
    receipt: Receipt,
    "pesticide-bill": SprayCan,
}

export default function DocumentCard({ type, title, children }: Props) {
  const Icon = icons[type];
  return (
    <div
      className={`rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-5 text-white ${gradients[type]} h-full flex flex-col`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/25 rounded-lg p-2">
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold tracking-wide">{title}</h2>
      </div>

      <div className="bg-black/10 backdrop-blur-sm p-4 rounded-md shadow-inner flex-grow text-sm">
        {children}
      </div>
    </div>
  );
}


