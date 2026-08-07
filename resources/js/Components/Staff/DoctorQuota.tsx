export type DoctorQuotaData = {
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    plan: string | null;
    /** True when a per-hospital override is in force instead of the plan limit. */
    is_override: boolean;
};

/**
 * Active-doctor usage against the effective plan limit.
 *
 * The limit is never zero — `unlimited` means the plan has no cap at all, which
 * renders as a plain count with no bar.
 */
export default function DoctorQuota({ quota, className = '' }: { quota: DoctorQuotaData; className?: string }) {
    const { used, limit, remaining, unlimited, plan, is_override } = quota;

    if (unlimited) {
        return (
            <div className={`rounded-lg border border-gray-200 bg-white px-4 py-3 ${className}`}>
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">Active doctors</span>
                    <span className="text-xs font-medium text-teal-700">Unlimited</span>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{used}</p>
                <p className="mt-1 text-xs text-gray-400">
                    {is_override ? 'Custom limit' : plan ? `${plan} plan` : 'No plan assigned'} — no cap.
                </p>
            </div>
        );
    }

    const cap = limit ?? 0;
    const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 100;
    const full = used >= cap;
    const nearlyFull = !full && pct >= 80;

    const barColor = full ? 'bg-red-500' : nearlyFull ? 'bg-amber-500' : 'bg-teal-600';

    return (
        <div className={`rounded-lg border border-gray-200 bg-white px-4 py-3 ${className}`}>
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-500">Active doctors</span>
                <span className={`text-xs font-medium ${full ? 'text-red-600' : 'text-gray-500'}`}>
                    {full ? 'Limit reached' : `${remaining} left`}
                </span>
            </div>

            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                {used}
                <span className="text-base font-medium text-gray-400"> / {cap}</span>
            </p>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>

            <p className="mt-1.5 text-xs text-gray-400">
                {is_override ? 'Custom limit for this hospital' : plan ? `Set by the ${plan} plan` : 'No plan assigned'}
            </p>
        </div>
    );
}
