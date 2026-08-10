"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Job {
  id: string;
  clientPhone: string;
  type: string;
  operateur: string;
  montant: number;
  numeroClient: string;
  statut: string;
  reponseBrute?: string;
  erreur?: string | null;
  createdAt: number;
}

const STATUTS = ["tous", "pending", "processing", "success", "failed", "refunded"];
const OPERATEURS = ["tous", "mtn", "moov", "celtiis"];

const STATUT_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-yellow-100 text-yellow-700",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statut, setStatut] = useState("tous");
  const [operateur, setOperateur] = useState("tous");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statut !== "tous") params.set("statut", statut);
    if (operateur !== "tous") params.set("operateur", operateur);
    const res = await fetch(`/api/admin/jobs?${params.toString()}`);
    if (res.ok) setJobs((await res.json()).jobs);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [statut, operateur]);

  return (
    <div className="min-h-screen bg-brandBg">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-brandBlack">Transactions</h1>

        <div className="flex gap-6 flex-wrap">
          <FilterGroup label="Statut" options={STATUTS} value={statut} onChange={setStatut} />
          <FilterGroup label="Opérateur" options={OPERATEURS} value={operateur} onChange={setOperateur} />
        </div>

        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brandCard text-brandGray text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Numéro bénéf.</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-brandGray">
                    {new Date(job.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">{job.clientPhone}</td>
                  <td className="px-4 py-3 capitalize">{job.type}</td>
                  <td className="px-4 py-3 uppercase font-medium">{job.operateur}</td>
                  <td className="px-4 py-3">{job.montant.toLocaleString("fr-FR")} F</td>
                  <td className="px-4 py-3">{job.numeroClient}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        STATUT_STYLES[job.statut] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {job.statut}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brandGray">
                    Aucune transaction pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-brandGray mb-1.5">{label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase ${
              value === opt ? "bg-brandOrange text-white" : "bg-brandCard text-brandGray hover:bg-gray-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
