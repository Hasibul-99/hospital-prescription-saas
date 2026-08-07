import { Appointment, Patient } from '@/types';
import { Avatar, Badge, Button, Descriptions, Tag, Tooltip } from 'antd';
import { HistoryOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Props {
    patient: Patient;
    date: string;
    appointment?: Appointment | null;
    medicineCount: number;
    onOpenPreviousRx: () => void;
    /** Narrow viewports only — the side columns become drawers below xl. */
    onOpenTemplates: () => void;
    onOpenRxColumn: () => void;
}

const GENDER_COLOR: Record<string, string> = { male: 'blue', female: 'magenta', other: 'default' };

function ageStr(p: Patient): string {
    const parts: string[] = [];
    if (p.age_years) parts.push(`${p.age_years}y`);
    if (p.age_months) parts.push(`${p.age_months}m`);
    if (p.age_days) parts.push(`${p.age_days}d`);
    return parts.join(' ') || '—';
}

export default function PatientInfoBar({
    patient,
    date,
    appointment,
    medicineCount,
    onOpenPreviousRx,
    onOpenTemplates,
    onOpenRxColumn,
}: Props) {
    return (
        <div className="sticky top-0 z-20 border-b border-[#e3e7e3] bg-white px-4 py-2">
            <div className="flex flex-wrap items-center gap-3">
                <Avatar
                    size={36}
                    src={patient.profile_image ? `/storage/${patient.profile_image}` : undefined}
                    icon={<UserOutlined />}
                >
                    {patient.name.charAt(0).toUpperCase()}
                </Avatar>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-[#0f1a14]">{patient.name}</span>
                        <Tag color={GENDER_COLOR[patient.gender] ?? 'default'} className="!mr-0 capitalize">
                            {patient.gender}
                        </Tag>
                        {patient.blood_group && (
                            <Tag color="red" className="!mr-0">
                                {patient.blood_group}
                            </Tag>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#6a7a72]">
                        <span className="font-mono">{patient.patient_uid}</span>
                        <span>· {ageStr(patient)}</span>
                        <span>· {patient.phone}</span>
                    </div>
                </div>

                <Descriptions
                    size="small"
                    colon={false}
                    className="ml-2 hidden md:block"
                    column={appointment ? 2 : 1}
                    items={[
                        {
                            key: 'date',
                            label: <span className="text-xs text-[#9aa8a0]">Date</span>,
                            children: <span className="text-xs">{dayjs(date).format('DD MMM YYYY')}</span>,
                        },
                        ...(appointment
                            ? [{
                                  key: 'serial',
                                  label: <span className="text-xs text-[#9aa8a0]">Serial</span>,
                                  children: (
                                      <span className="font-mono text-xs font-semibold">
                                          #{appointment.serial_number}
                                      </span>
                                  ),
                              }]
                            : []),
                    ]}
                />

                <div className="ml-auto flex items-center gap-1.5">
                    <Tooltip title="Templates">
                        <Button
                            className="lg:!hidden"
                            size="small"
                            icon={<ProfileOutlined />}
                            onClick={onOpenTemplates}
                        />
                    </Tooltip>

                    <Button size="small" icon={<HistoryOutlined />} onClick={onOpenPreviousRx}>
                        Previous Rx
                    </Button>

                    <Badge count={medicineCount} size="small" color="#0a8754" className="xl:!hidden">
                        <Button className="xl:!hidden" size="small" type="primary" onClick={onOpenRxColumn}>
                            ℞ Prescription
                        </Button>
                    </Badge>
                </div>
            </div>
        </div>
    );
}
