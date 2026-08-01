import { useMemo, useState } from 'react';

/**
 * Two collapsible client-side calculators embedded in the Rx builder:
 *
 *  1. Paediatric weight-based dose — mg/kg × weight → per-dose mg, plus a
 *     per-day breakdown at common frequencies.
 *  2. LMP → EDD — 40-week (280-day) Naegele estimate + current gestational age.
 *
 * Both are pure UI. No API calls, no schema. Doctor reads the result and
 * types it into the appropriate section themselves.
 */
export default function SpecialtyTools() {
    return (
        <div className="mt-3 space-y-2">
            <PaediatricDoseCalc />
            <LmpEddCalc />
        </div>
    );
}

function PaediatricDoseCalc() {
    const [weight, setWeight] = useState('');
    const [mgPerKg, setMgPerKg] = useState('');
    const [freq, setFreq] = useState<'1' | '2' | '3' | '4'>('3');

    const w = parseFloat(weight);
    const mk = parseFloat(mgPerKg);
    const dailyMg = Number.isFinite(w) && Number.isFinite(mk) ? w * mk : null;
    const perDose = dailyMg !== null ? dailyMg / parseInt(freq, 10) : null;

    return (
        <details className="rounded border border-gray-200 bg-white">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Paediatric dose calculator
            </summary>
            <div className="grid gap-2 border-t border-gray-100 p-3 sm:grid-cols-4">
                <label className="text-xs text-gray-500">
                    Weight (kg)
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                </label>
                <label className="text-xs text-gray-500">
                    Dose (mg/kg/day)
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={mgPerKg}
                        onChange={(e) => setMgPerKg(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                </label>
                <label className="text-xs text-gray-500">
                    Divided into
                    <select
                        value={freq}
                        onChange={(e) => setFreq(e.target.value as '1' | '2' | '3' | '4')}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                        <option value="1">Once daily</option>
                        <option value="2">BD (twice)</option>
                        <option value="3">TDS (three)</option>
                        <option value="4">QID (four)</option>
                    </select>
                </label>
                <div className="rounded bg-teal-50 p-2 text-xs">
                    <div className="text-gray-500">Per day</div>
                    <div className="text-lg font-semibold text-teal-800">{dailyMg !== null ? dailyMg.toFixed(1) + ' mg' : '—'}</div>
                    <div className="text-gray-500">Per dose</div>
                    <div className="text-sm font-medium text-teal-700">{perDose !== null ? perDose.toFixed(1) + ' mg' : '—'}</div>
                </div>
            </div>
        </details>
    );
}

function LmpEddCalc() {
    const [lmp, setLmp] = useState('');

    const result = useMemo(() => {
        if (!lmp) return null;
        const lmpDate = new Date(lmp);
        if (isNaN(lmpDate.getTime())) return null;
        const edd = new Date(lmpDate);
        edd.setDate(edd.getDate() + 280);
        const diffMs = Date.now() - lmpDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const gaWeeks = Math.floor(diffDays / 7);
        const gaDays = diffDays - gaWeeks * 7;
        return { edd, gaWeeks, gaDays, diffDays };
    }, [lmp]);

    return (
        <details className="rounded border border-gray-200 bg-white">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                LMP → EDD calculator
            </summary>
            <div className="grid gap-2 border-t border-gray-100 p-3 sm:grid-cols-3">
                <label className="text-xs text-gray-500">
                    LMP (Last Menstrual Period)
                    <input
                        type="date"
                        value={lmp}
                        onChange={(e) => setLmp(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                </label>
                <div className="rounded bg-teal-50 p-2 text-xs">
                    <div className="text-gray-500">EDD (Naegele)</div>
                    <div className="text-lg font-semibold text-teal-800">
                        {result ? result.edd.toISOString().slice(0, 10) : '—'}
                    </div>
                </div>
                <div className="rounded bg-teal-50 p-2 text-xs">
                    <div className="text-gray-500">Current GA</div>
                    <div className="text-lg font-semibold text-teal-800">
                        {result
                            ? result.diffDays < 0
                                ? 'LMP in future'
                                : `${result.gaWeeks}w ${result.gaDays}d`
                            : '—'}
                    </div>
                </div>
            </div>
        </details>
    );
}
