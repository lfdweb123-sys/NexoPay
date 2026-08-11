"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Tableau de bord" },
  { href: "/admin/jobs", label: "Transactions" },
  { href: "/admin/ussd-codes", label: "Codes USSD" },
  { href: "/admin/sims", label: "SIM marchandes" },
  { href: "/admin/contact", label: "Page Contact" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-brandBlack text-lg">
          Nexo<span className="text-brandOrange">Pay</span>
        </div>
        <nav className="flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-brandOrange text-white"
                  : "text-brandGray hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="text-sm text-brandGray hover:text-brandBlack font-medium"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
