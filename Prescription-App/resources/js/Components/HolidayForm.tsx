import { HospitalHoliday } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props {
    submitUrl: string;
    method: 'post' | 'put';
    initial?: HospitalHoliday;
}

export default function HolidayForm({ submitUrl, method, initial }: Props) {
    const { data, setData, processing, errors } = useForm({
        date: initial?.date ?? '',
        title: initial?.title ?? '',
        is_recurring_yearly: initial?.is_recurring_yearly ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (method === 'put') {
            router.put(submitUrl, data);
        } else {
            router.post(submitUrl, data);
        }
    };

    return (
        <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600">Date</label>
                    <input
                        type="date"
                        value={data.date}
                        onChange={(e) => setData('date', e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600">Title</label>
                    <input
                        type="text"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="e.g., Independence Day"
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={data.is_recurring_yearly}
                    onChange={(e) => setData('is_recurring_yearly', e.target.checked)}
                />
                Recurring yearly (same month/day every year)
            </label>

            <div className="mt-5 flex justify-end gap-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {processing ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    );
}
