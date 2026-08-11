"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur de connexion");
      }
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brandBg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-brandBlack">Administration NexoPay</h1>
          <p className="text-sm text-brandGray">Connectez-vous pour continuer</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email administrateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brandOrange"
          />
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brandOrange"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brandOrange text-white font-semibold py-2.5 rounded-lg hover:bg-brandOrangeDark transition disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
