import PrescriptionPrintLayout from '@/Components/Prescription/PrescriptionPrintLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DoctorProfile, Hospital, PageProps, Patient, Prescription } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

type PreviewProps = PageProps<{
    prescription: Prescription & { patient?: Patient; doctor?: { id: number; name: string } };
    doctor_profile?: DoctorProfile | null;
    hospital?: Hospital | null;
    verify_url?: string | null;
    qr_svg?: string | null;
}>;

export default function Preview({ prescription, doctor_profile, hospital, verify_url, qr_svg }: PreviewProps) {
    const printAreaRef = useRef<HTMLDivElement>(null);
    const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);

    async function doPrint() {
        window.print();
        markPrinted();
    }

    async function savePng() {
        setBusy('png');
        try {
            const html2canvas = (await import('html2canvas')).default;
            const el = document.getElementById('rx-print-area');
            if (!el) return;
            const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
            const link = document.createElement('a');
            link.download = `${prescription.prescription_uid}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            markPrinted();
        } finally {
            setBusy(null);
        }
    }

    async function savePdfClient() {
        setBusy('pdf');
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);
            const el = document.getElementById('rx-print-area');
            if (!el) return;
            const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pageWidth / (canvas.width / 2), pageHeight / (canvas.height / 2));
            const w = (canvas.width / 2) * ratio;
            const h = (canvas.height / 2) * ratio;
            pdf.addImage(img, 'PNG', (pageWidth - w) / 2, 0, w, h);
            pdf.save(`${prescription.prescription_uid}.pdf`);
            markPrinted();
        } finally {
            setBusy(null);
        }
    }

    function savePdfServer() {
        window.open(`/doctor/prescriptions/${prescription.id}/download`, '_blank');
    }

    function shareWhatsApp() {
        if (!verify_url) return;
        const patientName = prescription.patient?.name ?? 'the patient';
        const doctorName = prescription.doctor?.name ?? '';
        const msg = `Prescription for ${patientName}${doctorName ? ` from ${doctorName}` : ''}: ${verify_url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }

    async function copyShareLink() {
        if (!verify_url) return;
        try {
            await navigator.clipboard.writeText(verify_url);
        } catch {
            /* noop */
        }
    }

    function markPrinted() {
        router.post(`/doctor/prescriptions/${prescription.id}/mark-printed`, {}, {
            preserveScroll: true,
            onError: () => { /* ignore */ },
        });
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Prescription Preview</h2>}>
            <Head title={`Rx ${prescription.prescription_uid}`} />

            <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-[220mm] flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div className="text-sm text-gray-700">
                        <span className="font-semibold">{prescription.prescription_uid}</span>
                        {prescription.status === 'printed' && prescription.printed_count ? (
                            <span className="ml-2 text-xs text-gray-500">Printed {prescription.printed_count}×</span>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/doctor/prescriptions/${prescription.id}/edit`}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={doPrint}
                            className="rounded bg-[#0f4c81] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0c3e6a]"
                        >
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={savePng}
                            disabled={busy !== null}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                            {busy === 'png' ? 'Generating…' : 'Save PNG'}
                        </button>
                        <button
                            type="button"
                            onClick={savePdfClient}
                            disabled={busy !== null}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                            title="Fast, client-side PDF (rendered from screen)"
                        >
                            {busy === 'pdf' ? 'Generating…' : 'Save PDF'}
                        </button>
                        <button
                            type="button"
                            onClick={savePdfServer}
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                            title="Server-side PDF (DomPDF)"
                        >
                            PDF (server)
                        </button>
                        {verify_url && (
                            <>
                                <button
                                    type="button"
                                    onClick={shareWhatsApp}
                                    className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100"
                                    title="Share via WhatsApp"
                                >
                                    WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={copyShareLink}
                                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                                    title="Copy public verify link"
                                >
                                    Copy link
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="rx-preview-wrap bg-gray-200 py-4" ref={printAreaRef}>
                <PrescriptionPrintLayout
                    prescription={prescription}
                    profile={doctor_profile}
                    hospital={hospital}
                    verifyUrl={verify_url}
                    qrSvg={qr_svg}
                />
            </div>
        </AuthenticatedLayout>
    );
}
