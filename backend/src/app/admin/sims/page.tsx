"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Sim {
  operateur: string;
  numero: string;
  soldePrincipal: number;
  soldeCommission: number;
  seuilAlerte: number;
  actif: boolean;
}

export default function SimsPage() {
  const [sims, setSims] = useState<Sim[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/sims");
    if (res.ok) setSims((await res.json()).sims);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(sim: Sim) {
    setSaving(sim.operateur);
    await fetch("/api/admin/sims", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sim),
    });
    setSaving(null);
    load();
  }

  return (
    <div className="min-h-screen bg-brandBg">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-brandBlack">SIM marchandes</h1>
        <p className="text-sm text-brandGray">
          Mets à jour manuellement les soldes après vérification USSD (
          <code>*840#</code>, <code>*811#</code>, <code>*889#</code>), ou désactive une SIM en cas
          de panne pour arrêter d&apos;y envoyer des jobs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sims.map((sim) => (
            <SimCard key={sim.operateur} sim={sim} onSave={save} saving={saving === sim.operateur} />
          ))}
        </div>
      </main>
    </div>
  );
}

function SimCard({
  sim,
  onSave,
  saving,
}: {
  sim: Sim;
  onSave: (s: Sim) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(sim);
  const dirty = JSON.stringify(local) !== JSON.stringify(sim);

  return (
    <div className="border border-gray-200 rounded-2xl p-5 bg-brandCard space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase text-brandBlack">{local.operateur}</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={local.actif}
            onChange={(e) => setLocal({ ...local, actif: e.target.checked })}
          />
          Active
        </label>
      </div>
      <Field label="Numéro" value={local.numero} onChange={(v) => setLocal({ ...local, numero: v })} />
      <Field
        label="Solde principal (FCFA)"
        type="number"
        value={String(local.soldePrincipal)}
        onChange={(v) => setLocal({ ...local, soldePrincipal: Number(v) })}
      />
      <Field
        label="Solde commission (FCFA)"
        type="number"
        value={String(local.soldeCommission)}
        onChange={(v) => setLocal({ ...local, soldeCommission: Number(v) })}
      />
      <Field
        label="Seuil d'alerte (FCFA)"
        type="number"
        value={String(local.seuilAlerte)}
        onChange={(v) => setLocal({ ...local, seuilAlerte: Number(v) })}
      />
      {dirty && (
        <button
          onClick={() => onSave(local)}
          disabled={saving}
          className="w-full text-sm bg-brandOrange text-white font-semibold py-2 rounded-lg hover:bg-brandOrangeDark disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-brandGray">{label}</label>
      <input
        type={type}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
