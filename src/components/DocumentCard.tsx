
// components/DocumentCard.tsx
import { Logo } from "./logo";

type Props = {
  type: "watak" | "bill" | "challan" | "receipt" | 'pesticide-bill';
  title: string;
  children: React.ReactNode;
};

const gradients: Record<string, string> = {
  watak: "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600",
  bill: "bg-gradient-to-r from-red-400 via-pink-500 to-rose-600",
  challan: "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600",
  receipt: "bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600",
  "pesticide-bill": "bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600",
};

export default function DocumentCard({ type, title, children }: Props) {
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
        {children}
      </div>
    </div>
  );
}
