import { useMemo, useState } from 'react';
import { Collapse, DatePicker, InputNumber, Segmented, Statistic } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * Two client-side calculators embedded in the Rx builder:
 *
 *  1. Paediatric weight-based dose — mg/kg × weight → per-dose mg.
 *  2. LMP → EDD — 40-week (280-day) Naegele estimate + current gestational age.
 *
 * Both are pure UI. No API calls, no schema. Doctor reads the result and types
 * it into the appropriate section themselves.
 */
export default function SpecialtyTools() {
    return (
        <Collapse
            size="small"
            className="mt-1"
            items={[
                {
                    key: 'paed',
                    label: (
                        <span className="text-[13px]">
                            <CalculatorOutlined className="mr-1.5" />
                            Paediatric dose calculator
                        </span>
                    ),
                    children: <PaediatricDoseCalc />,
                },
                {
                    key: 'edd',
                    label: (
                        <span className="text-[13px]">
                            <CalculatorOutlined className="mr-1.5" />
                            LMP → EDD calculator
                        </span>
                    ),
                    children: <LmpEddCalc />,
                },
            ]}
        />
    );
}

function PaediatricDoseCalc() {
    const [weight, setWeight] = useState<number | null>(null);
    const [mgPerKg, setMgPerKg] = useState<number | null>(null);
    const [freq, setFreq] = useState(3);

    const dailyMg = weight != null && mgPerKg != null ? weight * mgPerKg : null;
    const perDose = dailyMg !== null ? dailyMg / freq : null;

    return (
        <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-xs text-gray-500">
                Weight (kg)
                <InputNumber
                    className="mt-1 w-full"
                    size="small"
                    min={0}
                    step={0.1}
                    value={weight}
                    onChange={setWeight}
                />
            </label>

            <label className="text-xs text-gray-500">
                Dose (mg/kg/day)
                <InputNumber
                    className="mt-1 w-full"
                    size="small"
                    min={0}
                    step={0.1}
                    value={mgPerKg}
                    onChange={setMgPerKg}
                />
            </label>

            <label className="text-xs text-gray-500">
                Divided into
                <Segmented
                    block
                    className="mt-1"
                    size="small"
                    value={freq}
                    onChange={(v) => setFreq(v as number)}
                    options={[
                        { label: 'OD', value: 1 },
                        { label: 'BD', value: 2 },
                        { label: 'TDS', value: 3 },
                        { label: 'QID', value: 4 },
                    ]}
                />
            </label>

            <div className="rounded-lg bg-[#f0f8f3] p-2.5">
                <Statistic
                    title={<span className="text-[11px]">Per dose</span>}
                    value={perDose !== null ? perDose.toFixed(1) : '—'}
                    suffix={perDose !== null ? 'mg' : undefined}
                    valueStyle={{ fontSize: 18, color: '#0d6e46' }}
                />
                <div className="mt-1 text-[11px] text-gray-500">
                    {dailyMg !== null ? `${dailyMg.toFixed(1)} mg per day` : 'Enter weight and dose'}
                </div>
            </div>
        </div>
    );
}

function LmpEddCalc() {
    const [lmp, setLmp] = useState<dayjs.Dayjs | null>(null);

    const result = useMemo(() => {
        if (!lmp) return null;

        const edd = lmp.add(280, 'day');
        const elapsed = dayjs().diff(lmp, 'day');
        return { edd, elapsed, weeks: Math.floor(elapsed / 7), days: elapsed % 7 };
    }, [lmp]);

    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-gray-500">
                LMP (last menstrual period)
                <DatePicker
                    className="mt-1 w-full"
                    size="small"
                    format="DD MMM YYYY"
                    value={lmp}
                    maxDate={dayjs()}
                    onChange={setLmp}
                />
            </label>

            <div className="rounded-lg bg-[#f0f8f3] p-2.5">
                <Statistic
                    title={<span className="text-[11px]">EDD (Naegele)</span>}
                    value={result ? result.edd.format('DD MMM YYYY') : '—'}
                    valueStyle={{ fontSize: 16, color: '#0d6e46' }}
                />
            </div>

            <div className="rounded-lg bg-[#f0f8f3] p-2.5">
                <Statistic
                    title={<span className="text-[11px]">Current GA</span>}
                    value={result ? `${result.weeks}w ${result.days}d` : '—'}
                    valueStyle={{ fontSize: 16, color: '#0d6e46' }}
                />
            </div>
        </div>
    );
}
