import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-20">
      <div className="grid gap-12 rounded-[2rem] border border-slate-200 bg-white p-12 shadow-xl sm:p-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-teal-600">BioLab AI</p>
          <h1 className="max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">Lab operations and research collaboration in one secured dashboard.</h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            BioLab AI provides secure access control, protocol management, and laboratory analytics for researchers, lab heads, and administrators.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-teal-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-teal-700">
            Sign in
          </Link>
          <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 transition hover:border-teal-400 hover:text-teal-700">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
