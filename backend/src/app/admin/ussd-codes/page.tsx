"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

interface UssdCode {
  id: string;
  operateur: string;
  categorie: string;
  label: string;
  sequenceBrute: string;
  actif: boolean;
}

interface MessageUssd {
  id: string;
  operateur: string;
  type: string;
  motsClesDetection: string;
  messageAffichéClient: string;
  actif: boolean;
}

export default function UssdCodesPage() {
  const [tab, setTab] = useState<"codes" | "messages">("codes");
  const [codes, setCodes] = useState<UssdCode[]>([]);
  const [messages, setMessages] = useState<MessageUssd[]>([]);
  const [filtreOperateur, setFiltreOperateur] = useState<string>("tous");
  const [saving, setSaving] = useState<string | null>(null);

  async function loadCodes() {
    const res = await fetch("/api/admin/ussd-codes");
    if (res.ok) setCodes((await res.json()).codes);
  }
  async function loadMessages() {
    const res = await fetch("/api/admin/messages");
    if (res.ok) setMessages((await res.json()).messages);
  }

  useEffect(() => {
    loadCodes();
    loadMessages();
  }, []);

  async function saveCode(code: UssdCode) {
    setSaving(code.id);
    await fetch("/api/admin/ussd-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(code),
    });
    setSaving(null);
  }

  async function saveMessage(msg: MessageUssd) {
    setSaving(msg.id);
    await fetch("/api/admin/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    setSaving(null);
  }

  const codesFiltres = codes.filter((c) => filtreOperateur === "tous" || c.operateur === filtreOperateur);
  const messagesFiltres = messages.filter((m) => filtreOperateur === "tous" || m.operateur === filtreOperateur);

  return (
    <div className="min-h-screen bg-brandBg">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-brandBlack">Codes USSD & messages</h1>
          <div className="flex gap-2">
            {["tous", "mtn", "moov", "celtiis"].map((op) => (
              <button
                key={op}
                onClick={() => setFiltreOperateur(op)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium uppercase ${
                  filtreOperateur === op
                    ? "bg-brandOrange text-white"
                    : "bg-brandCard text-brandGray hover:bg-gray-100"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200">
          <TabButton active={tab === "codes"} onClick={() => setTab("codes")}>
            Codes USSD ({codesFiltres.length})
          </TabButton>
          <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
            Messages de détection ({messagesFiltres.length})
          </TabButton>
        </div>

        {tab === "codes" && (
          <div className="space-y-3">
            <p className="text-sm text-brandGray bg-brandCard rounded-lg px-4 py-3">
              Placeholders disponibles dans la séquence : <code>{"{numero}"}</code>,{" "}
              <code>{"{montant}"}</code>, <code>{"{code}"}</code>. Un code inactif n&apos;est jamais
              proposé aux clients dans l&apos;app.
            </p>
            {codesFiltres.map((code) => (
              <CodeRow key={code.id} code={code} onSave={saveCode} saving={saving === code.id} />
            ))}
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-3">
            <p className="text-sm text-brandGray bg-brandCard rounded-lg px-4 py-3">
              Mots-clés séparés par <code>|</code>. Le bot compare le texte de réponse USSD
              (en minuscule, sans accents) à ces mots-clés pour déterminer le statut de la
              transaction.
            </p>
            {messagesFiltres.map((msg) => (
              <MessageRow key={msg.id} msg={msg} onSave={saveMessage} saving={saving === msg.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
        active ? "border-brandOrange text-brandOrange" : "border-transparent text-brandGray"
      }`}
    >
      {children}
    </button>
  );
}

function CodeRow({
  code,
  onSave,
  saving,
}: {
  code: UssdCode;
  onSave: (c: UssdCode) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(code);
  const dirty = JSON.stringify(local) !== JSON.stringify(code);

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-brandCard space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-semibold uppercase text-brandOrange">{local.operateur}</span>
          <span className="text-xs text-brandGray ml-2">{local.categorie}</span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={local.actif}
            onChange={(e) => setLocal({ ...local, actif: e.target.checked })}
          />
          Actif
        </label>
      </div>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
        value={local.label}
        onChange={(e) => setLocal({ ...local, label: e.target.value })}
      />
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
        value={local.sequenceBrute}
        onChange={(e) => setLocal({ ...local, sequenceBrute: e.target.value })}
      />
      {dirty && (
        <button
          onClick={() => onSave(local)}
          disabled={saving}
          className="text-sm bg-brandOrange text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-brandOrangeDark disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
    </div>
  );
}

function MessageRow({
  msg,
  onSave,
  saving,
}: {
  msg: MessageUssd;
  onSave: (m: MessageUssd) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(msg);
  const dirty = JSON.stringify(local) !== JSON.stringify(msg);

  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-brandCard space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-semibold uppercase text-brandOrange">{local.operateur}</span>
          <span className="text-xs text-brandGray ml-2">{local.type}</span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={local.actif}
            onChange={(e) => setLocal({ ...local, actif: e.target.checked })}
          />
          Actif
        </label>
      </div>
      <div>
        <label className="text-xs text-brandGray">Mots-clés de détection</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          value={local.motsClesDetection}
          onChange={(e) => setLocal({ ...local, motsClesDetection: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-brandGray">Message affiché au client</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={local.messageAffichéClient}
          onChange={(e) => setLocal({ ...local, messageAffichéClient: e.target.value })}
        />
      </div>
      {dirty && (
        <button
          onClick={() => onSave(local)}
          disabled={saving}
          className="text-sm bg-brandOrange text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-brandOrangeDark disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
    </div>
  );
}
