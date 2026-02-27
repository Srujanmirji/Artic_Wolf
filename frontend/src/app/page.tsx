import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-zinc-950">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Aagam AI <span className="text-blue-500">Engine</span>
        </h1>
        <div className="mt-8 flex gap-4">
          <Link href="/login" className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
            Login
          </Link>
          <Link href="/dashboard" className="rounded-md border border-zinc-200 bg-white px-4 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            View Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-2">Demand Forecasting</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Intelligent exponential smoothing and LightGBM models</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-2">Offline Queue</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">PWA capable with background queue sync and resolution</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold mb-2">News Intelligence</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Context aware sentiment-driven inventory recommendations</p>
        </div>
      </div>
    </main>
  );
}
