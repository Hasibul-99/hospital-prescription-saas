import PrescriptionPrintLayout from '@/Components/Prescription/PrescriptionPrintLayout';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { DoctorProfile, Hospital, PageProps, Patient, Prescription } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { App as AntApp, Button, Dropdown, Space, Tag, Tooltip } from 'antd';
import {
    DownOutlined,
    DownloadOutlined,
    EditOutlined,
    LinkOutlined,
    PrinterOutlined,
    ShareAltOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

type PreviewProps = PageProps<{
    prescription: Prescription & { patient?: Patient; doctor?: { id: number; name: string } };
    doctor_profile?: DoctorProfile | null;
    hospital?: Hospital | null;
    verify_url?: string | null;
    qr_svg?: string | null;
}>;

export default function Preview({ prescription, doctor_profile, hospital, verify_url, qr_svg }: PreviewProps) {
    const { message } = AntApp.useApp();
    const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);

    function doPrint() {
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
            message.success('Verify link copied.');
        } catch {
            message.error('Could not copy — your browser blocked clipboard access.');
        }
    }

    function markPrinted() {
        router.post(`/doctor/prescriptions/${prescription.id}/mark-printed`, {}, {
            preserveScroll: true,
            onError: () => { /* a failed counter bump must not interrupt printing */ },
        });
    }

    const downloadItems = [
        { key: 'png', label: 'PNG image', onClick: savePng },
        { key: 'pdf', label: 'PDF (fast, from screen)', onClick: savePdfClient },
        {
            key: 'pdf-server',
            label: 'PDF (server-rendered)',
            onClick: () => window.open(`/doctor/prescriptions/${prescription.id}/download`, '_blank'),
        },
        { type: 'divider' as const },
        {
            key: 'soap',
            label: 'SOAP note',
            onClick: () => window.open(`/doctor/prescriptions/${prescription.id}/soap-pdf`, '_blank'),
        },
        {
            key: 'handout',
            label: 'Patient handout',
            onClick: () => window.open(`/doctor/prescriptions/${prescription.id}/handout-pdf`, '_blank'),
        },
    ];

    const shareItems = [
        { key: 'whatsapp', icon: <WhatsAppOutlined />, label: 'WhatsApp', onClick: shareWhatsApp },
        { key: 'copy', icon: <LinkOutlined />, label: 'Copy verify link', onClick: copyShareLink },
    ];

    return (
        <DoctorLayout>
            <Head title={`Rx ${prescription.prescription_uid}`} />

            <div className="no-print sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-[220mm] flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <Space size={8}>
                        <span className="font-mono text-sm font-semibold text-gray-800">
                            {prescription.prescription_uid}
                        </span>
                        {prescription.status === 'printed' && !!prescription.printed_count && (
                            <Tooltip title="Times this prescription has been printed or exported">
                                <Tag className="!mr-0">Printed {prescription.printed_count}×</Tag>
                            </Tooltip>
                        )}
                    </Space>

                    <Space wrap>
                        <Link href={`/doctor/prescriptions/${prescription.id}/edit`}>
                            <Button icon={<EditOutlined />}>Edit</Button>
                        </Link>

                        <Dropdown menu={{ items: downloadItems }} trigger={['click']}>
                            <Button icon={<DownloadOutlined />} loading={busy !== null}>
                                <Space size={4}>
                                    {busy ? 'Generating…' : 'Download'}
                                    <DownOutlined className="text-xs" />
                                </Space>
                            </Button>
                        </Dropdown>

                        {verify_url && (
                            <Dropdown menu={{ items: shareItems }} trigger={['click']}>
                                <Button icon={<ShareAltOutlined />}>
                                    <Space size={4}>
                                        Share
                                        <DownOutlined className="text-xs" />
                                    </Space>
                                </Button>
                            </Dropdown>
                        )}

                        <Button type="primary" icon={<PrinterOutlined />} onClick={doPrint}>
                            Print
                        </Button>
                    </Space>
                </div>
            </div>

            <div className="rx-preview-wrap bg-gray-200 py-4">
                <PrescriptionPrintLayout
                    prescription={prescription}
                    profile={doctor_profile}
                    hospital={hospital}
                    verifyUrl={verify_url}
                    qrSvg={qr_svg}
                />
            </div>
        </DoctorLayout>
    );
}
