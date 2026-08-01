import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

export interface Vital {
    id: number;
    recorded_at: string;
    systolic: number | null;
    diastolic: number | null;
    pulse: number | null;
    temperature: string | number | null;
    weight_kg: string | number | null;
    height_cm: string | number | null;
    spo2: number | null;
    notes: string | null;
    recorder: { id: number; name: string } | null;
}

interface Props {
    patientId: number;
    vitals: Vital[];
    /** URL prefix for POST/DELETE — e.g. `/doctor` or `/receptionist`. */
    scope: 'doctor' | 'receptionist';
}

export default function PatientVitalsPanel({ patientId, vitals, scope }: Props) {
    const [systolic, setSys] = useState('');
    const [diastolic, setDia] = useState('');
    const [pulse, setPulse] = useState('');
    const [temperature, setTemp] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [spo2, setSpo2] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        setBusy(true);
        router.post(
            `/${scope}/patients/${patientId}/vitals`,
            { systolic, diastolic, pulse, temperature, weight_kg: weight, height_cm: height, spo2, notes },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSys(''); setDia(''); setPulse(''); setTemp('');
                    setWeight(''); setHeight(''); setSpo2(''); setNotes('');
                },
                onFinish: () => setBusy(false),
            },
        );
    }

    function remove(id: number) {
        if (!confirm('Delete this vital record?')) return;
        router.delete(`/${scope}/vitals/${id}`, { preserveScroll: true });
    }

    // Trend chart data — reverse to oldest → newest, coerce decimals to floats
    const chartData = vitals
        .slice()
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map((v) => ({
            date: new Date(v.recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            systolic: v.systolic,
            diastolic: v.diastolic,
            pulse: v.pulse,
            weight_kg: v.weight_kg !== null && v.weight_kg !== undefined ? Number(v.weight_kg) : null,
        }));

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Vitals</h3>

            {/* Add form */}
            <form onSubmit={submit} className="grid gap-2 rounded bg-gray-50 p-3 text-sm sm:grid-cols-4">
                <label className="text-xs text-gray-500">
                    Systolic
                    <input type="number" value={systolic} onChange={(e) => setSys(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="mmHg" />
                </label>
                <label className="text-xs text-gray-500">
                    Diastolic
                    <input type="number" value={diastolic} onChange={(e) => setDia(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="mmHg" />
                </label>
                <label className="text-xs text-gray-500">
                    Pulse
                    <input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="bpm" />
                </label>
                <label className="text-xs text-gray-500">
                    SpO₂
                    <input type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="%" />
                </label>
                <label className="text-xs text-gray-500">
                    Temp
                    <input type="number" step="0.1" value={temperature} onChange={(e) => setTemp(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="°F" />
                </label>
                <label className="text-xs text-gray-500">
                    Weight
                    <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="kg" />
                </label>
                <label className="text-xs text-gray-500">
                    Height
                    <input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="cm" />
                </label>
                <div className="flex items-end">
                    <button type="submit" disabled={busy}
                        className="w-full rounded bg-teal-600 px-3 py-1.5 text-white hover:bg-teal-700 disabled:bg-gray-300">
                        {busy ? 'Saving…' : 'Add vitals'}
                    </button>
                </div>
                <label className="text-xs text-gray-500 sm:col-span-4">
                    Notes
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1" placeholder="Optional" />
                </label>
            </form>

            {/* Trend chart */}
            {chartData.length >= 2 && (
                <div className="mt-4">
                    <div className="mb-2 text-xs text-gray-500">Trend across visits</div>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 12, bottom: 5, left: -12 }}>
                                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                <XAxis dataKey="date" style={{ fontSize: 11 }} />
                                <YAxis style={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="systolic"  stroke="#dc2626" dot={{ r: 3 }} connectNulls />
                                <Line type="monotone" dataKey="diastolic" stroke="#0f766e" dot={{ r: 3 }} connectNulls />
                                <Line type="monotone" dataKey="pulse"     stroke="#7c3aed" dot={{ r: 3 }} connectNulls />
                                <Line type="monotone" dataKey="weight_kg" stroke="#c2410c" dot={{ r: 3 }} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-2 py-1">When</th>
                            <th className="px-2 py-1">BP</th>
                            <th className="px-2 py-1">Pulse</th>
                            <th className="px-2 py-1">Temp</th>
                            <th className="px-2 py-1">Weight</th>
                            <th className="px-2 py-1">SpO₂</th>
                            <th className="px-2 py-1">By</th>
                            <th className="px-2 py-1"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {vitals.length === 0 ? (
                            <tr><td colSpan={8} className="px-2 py-3 text-center text-gray-400">No vitals recorded yet.</td></tr>
                        ) : vitals.slice().reverse().map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-2 py-1 text-gray-600">
                                    {new Date(v.recorded_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-2 py-1">{v.systolic ?? '—'}/{v.diastolic ?? '—'}</td>
                                <td className="px-2 py-1">{v.pulse ?? '—'}</td>
                                <td className="px-2 py-1">{v.temperature ?? '—'}</td>
                                <td className="px-2 py-1">{v.weight_kg ?? '—'}</td>
                                <td className="px-2 py-1">{v.spo2 ?? '—'}</td>
                                <td className="px-2 py-1 text-gray-500">{v.recorder?.name ?? '—'}</td>
                                <td className="px-2 py-1 text-right">
                                    <button onClick={() => remove(v.id)} className="text-red-600 hover:underline">delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
