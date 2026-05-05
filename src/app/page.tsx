import { ChecklistForm } from "@/components/checklist-form";

export const runtime = "nodejs";
export const maxDuration = 30;

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1e3a5f] tracking-wide uppercase">
            CBV Practice Inspection Checklist
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Aspen Valuations — Valuation Practice Standards 100/110/120/130
          </p>
        </div>
        <ChecklistForm />
      </div>
    </main>
  );
}
