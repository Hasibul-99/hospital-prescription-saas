import { Chamber, User } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props {
    doctors: Pick<User, 'id' | 'name'>[];
    submitUrl: string;
    method: 'post' | 'put';
    initial?: Chamber;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ChamberForm({ doctors, submitUrl, method, initial }: Props) {
    const initialSchedule: Record<string, { start: string; end: string; active: boolean }> = DAYS.reduce((acc, d) => {
        const existing = (initial?.schedule as any)?.[d];
        acc[d] = existing ?? { start: '', end: '', active: false };
        return acc;
    }, {} as Record<string, { start: string; end: string; active: boolean }>);

    const { data, setData, processing, errors } = useForm({
        doctor_id: initial?.doctor_id ?? (doctors[0]?.id ?? ''),
        name: initial?.name ?? '',
        room_number: initial?.room_number ?? '',
        floor: initial?.floor ?? '',
        building: initial?.building ?? '',
        is_active: initial?.is_active ?? true,
        schedule: initialSchedule,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (method === 'put') {
            router.put(submitUrl, data);
        } else {
            router.post(submitUrl, data);
        }
    };

    function updateSchedule(day: string, key: 'start' | 'end' | 'active', value: string | boolean) {
        setData('schedule', { ...data.schedule, [day]: { ...data.schedule[day], [key]: value } });
    }

    return (
        <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600">Doctor</label>
                    <select value={data.doctor_id} onChange={(e) => setData('doctor_id', Number(e.target.value))} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                        {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.doctor_id && <p className="mt-1 text-xs text-red-600">{errors.doctor_id}</p>}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600">Chamber Name</label>
                    <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div><label className="block text-xs font-medium text-gray-600">Room</label><input type="text" value={data.room_number ?? ''} onChange={(e) => setData('room_number', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600">Floor</label><input type="text" value={data.floor ?? ''} onChange={(e) => setData('floor', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600">Building</label><input type="text" value={data.building ?? ''} onChange={(e) => setData('building', e.target.value)} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm" /></div>
            </div>

            <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-gray-700">Weekly Schedule</div>
                <div className="divide-y rounded border">
                    {DAYS.map((d) => (
                        <div key={d} className="flex items-center gap-3 px-3 py-2">
                            <label className="flex w-16 items-center gap-1 text-sm">
                                <input type="checkbox" checked={data.schedule[d].active} onChange={(e) => updateSchedule(d, 'active', e.target.checked)} />
                                {d}
                            </label>
                            <input
                                type="time"
                                value={data.schedule[d].start}
                                disabled={!data.schedule[d].active}
                                onChange={(e) => updateSchedule(d, 'start', e.target.value)}
                                className="rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                            />
                            <span className="text-gray-400">–</span>
                            <input
                                type="time"
                                value={data.schedule[d].end}
                                disabled={!data.schedule[d].active}
                                onChange={(e) => updateSchedule(d, 'end', e.target.value)}
                                className="rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                Active
            </label>

            <div className="mt-5 flex justify-end gap-2">
                <button type="submit" disabled={processing} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400">
                    {processing ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
