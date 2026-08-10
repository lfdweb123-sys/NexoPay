"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Stats {
  pending: number;
  processing: number;
  success24h: number;
  failed24h: number;
  sims: { operateur: string; soldePrincipal: number; soldeCommission: number; seuilAlerte: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  async function load() {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // rafraîchissement auto toutes les 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-brandBg">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-brandBlack">Tableau de bord</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="En attente" value={stats?.pending} accent />
          <StatCard label="En traitement" value={stats?.processing} accent />
          <StatCard label="Réussies (24h)" value={stats?.success24h} />
          <StatCard label="Échecs (24h)" value={stats?.failed24h} danger />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brandBlack mb-3">Soldes SIM marchandes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.sims.map((sim) => {
              const bas = sim.soldePrincipal <= sim.seuilAlerte;
              return (
                <div
                  key={sim.operateur}
                  className={`rounded-2xl border p-5 ${
                    bas ? "border-red-300 bg-red-50" : "border-gray-200 bg-brandCard"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold uppercase text-brandBlack">{sim.operateur}</span>
                    {bas && (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        Solde bas
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-brandBlack">
                    {sim.soldePrincipal.toLocaleString("fr-FR")} FCFA
                  </p>
                  <p className="text-sm text-brandGray mt-1">
                    Commission : {sim.soldeCommission.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-brandCard p-5">
      <p className="text-sm text-brandGray mb-1">{label}</p>
      <p
        className={`text-3xl font-bold ${
          danger ? "text-red-600" : accent ? "text-brandOrange" : "text-brandBlack"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
