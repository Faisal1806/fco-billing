// src/components/Sidebar.tsx
import Link from "next/link";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Invoices", href: "/invoices" },
  { name: "Purchases", href: "/purchases" },
  { name: "Sales", href: "/sales" },
  { name: "Khata Ledger", href: "/khata" },
  { name: "Market Rates", href: "/market" },
  { name: "Supplies", href: "/supplies" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col p-4">
      <div className="text-2xl font-bold mb-6">F.Co</div>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="block rounded-md px-3 py-2 hover:bg-gray-700"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}