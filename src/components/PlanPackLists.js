/** KYC pack + documentation-flow lists from a plan (or case snapshot). */

export default function PlanPackLists({ plan, kycDocs, workflowStages, className = "" }) {
  const docs = Array.isArray(kycDocs) ? kycDocs : Array.isArray(plan?.kycDocs) ? plan.kycDocs : [];
  const stages = Array.isArray(workflowStages)
    ? workflowStages
    : Array.isArray(plan?.workflowStages)
      ? plan.workflowStages
      : [];
  if (!docs.length && !stages.length) return null;

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      {docs.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            KYC pack · {docs.length}
          </div>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
            {docs.map((d) => (
              <li key={d.id || d.label} className="text-xs leading-relaxed text-white/70">
                {d.label}
                {d.required === false ? " (optional)" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {stages.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Documentation flow · {stages.length}
          </div>
          <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
            {stages.map((s, i) => (
              <li key={s.id || s.label} className="text-xs leading-relaxed text-white/70">
                {i + 1}. {s.label}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
