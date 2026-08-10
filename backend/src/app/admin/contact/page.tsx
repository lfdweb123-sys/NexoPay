"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface Contact {
  telephoneMobile: string;
  telephoneFixe: string;
  whatsapp?: string;
  email?: string;
  adresse?: string;
  horaires?: string;
}

export default function ContactAdminPage() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contact")
      .then((r) => r.json())
      .then((d) => setContact(d.contact));
  }, []);

  async function save() {
    if (!contact) return;
    setSaving(true);
    await fetch("/api/admin/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!contact) return null;

  return (
    <div className="min-h-screen bg-brandBg">
      <AdminNav />
      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-brandBlack">Page Contact (client)</h1>
        <p className="text-sm text-brandGray">
          Ces informations s&apos;affichent dans l&apos;app mobile, page &quot;Nous contacter&quot;.
        </p>

        <div className="space-y-4 bg-brandCard border border-gray-200 rounded-2xl p-6">
          <Field
            label="Téléphone mobile"
            value={contact.telephoneMobile}
            onChange={(v) => setContact({ ...contact, telephoneMobile: v })}
          />
          <Field
            label="Téléphone fixe"
            value={contact.telephoneFixe}
            onChange={(v) => setContact({ ...contact, telephoneFixe: v })}
          />
          <Field
            label="WhatsApp"
            value={contact.whatsapp ?? ""}
            onChange={(v) => setContact({ ...contact, whatsapp: v })}
          />
          <Field
            label="Email"
            value={contact.email ?? ""}
            onChange={(v) => setContact({ ...contact, email: v })}
          />
          <Field
            label="Adresse"
            value={contact.adresse ?? ""}
            onChange={(v) => setContact({ ...contact, adresse: v })}
          />
          <Field
            label="Horaires"
            value={contact.horaires ?? ""}
            onChange={(v) => setContact({ ...contact, horaires: v })}
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-brandOrange text-white font-semibold py-2.5 rounded-lg hover:bg-brandOrangeDark disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer"}
          </button>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-brandGray">{label}</label>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
