import AdminLayout from '@/Layouts/AdminLayout';
import { Hospital } from '@/types';
import { ReactNode } from 'react';

interface Props {
    stats: {
        total_hospitals: number;
        total_doctors: number;
        total_prescriptions: number;
        active_subscriptions: number;
    };
    recent_hospitals: Hospital[];
}

export default function Dashboard({ stats, recent_hospitals }: Props) {
    const cards = [
        { label: 'Total Hospitals', value: stats.total_hospitals, color: 'bg-blue-500' },
        { label: 'Total Doctors', value: stats.total_doctors, color: 'bg-green-500' },
        { label: 'Total Prescriptions', value: stats.total_prescriptions, color: 'bg-purple-500' },
        { label: 'Active Subscriptions', value: stats.active_subscriptions, color: 'bg-orange-500' },
    ];

    return (
        <>
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h2>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <div key={card.label} className="rounded-lg bg-white p-5 shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{card.label}</p>
                                <p className="mt-1 text-3xl font-bold text-gray-800">{card.value}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-full ${card.color} flex items-center justify-center text-white text-lg`}>
                                {card.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Hospitals */}
            <div className="rounded-lg bg-white p-5 shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Recent Hospitals</h3>
                {recent_hospitals.length === 0 ? (
                    <p className="text-gray-500">No hospitals registered yet.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-gray-500">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Plan</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent_hospitals.map((h) => (
                                <tr key={h.id} className="border-b last:border-0">
                                    <td className="py-3 font-medium text-gray-800">{h.name}</td>
                                    <td className="py-3">
                                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                            {h.subscription_plan}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs ${
                                                h.subscription_status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : h.subscription_status === 'trial'
                                                      ? 'bg-yellow-100 text-yellow-700'
                                                      : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {h.subscription_status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-500">
                                        {new Date(h.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
