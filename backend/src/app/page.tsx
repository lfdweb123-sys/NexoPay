import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-brandBlack">NexoPay — Backend</h1>
      <p className="text-brandGray">API + Dashboard administrateur</p>
      <Link
        href="/admin/login"
        className="px-6 py-3 bg-brandOrange text-white rounded-lg font-semibold hover:bg-brandOrangeDark transition"
      >
        Accéder à l&apos;administration
      </Link>
    </main>
  );
}
