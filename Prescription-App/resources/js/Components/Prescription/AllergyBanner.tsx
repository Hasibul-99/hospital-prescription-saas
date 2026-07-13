import { useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Input, Tag, Tooltip, message } from 'antd';
import { PatientAllergy } from '@/types';

interface MedicineLike {
    medicine_name: string;
    generic_name?: string | null;
}

interface Props {
    patientId: number;
    allergies: PatientAllergy[];
    medicines: MedicineLike[];
}

/**
 * Returns true when a prescribed medicine plausibly matches a recorded
 * allergen. Matching is substring, case-insensitive, in both directions
 * (allergen inside the medicine text, or a medicine name inside the allergen
 * text). This catches direct matches like allergen "Amoxicillin" vs a medicine
 * whose brand/generic contains "amoxicillin". It does NOT understand drug
 * classes — allergen "Penicillin" won't flag "Amoxicillin". Class-aware
 * matching needs a drug-class map we don't have yet.
 */
function conflicts(med: MedicineLike, allergen: string): boolean {
    const needle = allergen.trim().toLowerCase();
    if (needle.length < 3) return false;

    const brand = (med.medicine_name ?? '').toLowerCase();
    const generic = (med.generic_name ?? '').toLowerCase();
    const hay = `${brand} ${generic}`.trim();

    if (hay.includes(needle)) return true;
    if (brand && needle.includes(brand)) return true;
    if (generic && needle.includes(generic)) return true;
    return false;
}

export default function AllergyBanner({ patientId, allergies, medicines }: Props) {
    const [items, setItems] = useState<PatientAllergy[]>(allergies);
    const [adding, setAdding] = useState(false);
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);

    const conflictList = useMemo(() => {
        const out: { medicine: string; allergen: string }[] = [];
        for (const med of medicines) {
            for (const a of items) {
                if (conflicts(med, a.allergen)) {
                    out.push({ medicine: med.medicine_name, allergen: a.allergen });
                }
            }
        }
        return out;
    }, [items, medicines]);

    async function add() {
        const allergen = value.trim();
        if (!allergen) return;
        setBusy(true);
        try {
            const { data } = await axios.post(`/doctor/patients/${patientId}/allergies`, { allergen });
            setItems((prev) => [data.allergy, ...prev]);
            setValue('');
            setAdding(false);
        } catch {
            message.error('Could not save allergy.');
        } finally {
            setBusy(false);
        }
    }

    async function remove(id: number) {
        setBusy(true);
        try {
            await axios.delete(`/doctor/allergies/${id}`);
            setItems((prev) => prev.filter((a) => a.id !== id));
        } catch {
            message.error('Could not remove allergy.');
        } finally {
            setBusy(false);
        }
    }

    const addRow = adding ? (
        <span className="inline-flex items-center gap-1">
            <Input
                autoFocus
                size="small"
                style={{ width: 160 }}
                placeholder="Allergen, e.g. Ceftriaxone"
                value={value}
                disabled={busy}
                onChange={(e) => setValue(e.target.value)}
                onPressEnter={add}
            />
            <Button size="small" type="primary" loading={busy} onClick={add}>
                Add
            </Button>
            <Button size="small" onClick={() => { setAdding(false); setValue(''); }}>
                Cancel
            </Button>
        </span>
    ) : (
        <Button size="small" type="link" onClick={() => setAdding(true)}>
            + Add allergy
        </Button>
    );

    return (
        <div style={{ padding: '8px 16px 0' }}>
            {conflictList.length > 0 && (
                <Alert
                    type="error"
                    showIcon
                    className="!mb-2"
                    message="Allergy conflict"
                    description={
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {conflictList.map((c, i) => (
                                <li key={i}>
                                    <strong>{c.medicine}</strong> may conflict with recorded allergy{' '}
                                    <strong>{c.allergen}</strong>
                                </li>
                            ))}
                        </ul>
                    }
                />
            )}

            <div
                className="flex flex-wrap items-center gap-2 rounded"
                style={{
                    background: items.length ? '#fff1f0' : '#fafafa',
                    border: `1px solid ${items.length ? '#ffccc7' : '#eee'}`,
                    padding: '6px 10px',
                }}
            >
                <span style={{ fontSize: 12, fontWeight: 600, color: items.length ? '#cf1322' : '#888' }}>
                    {items.length ? '⚠ Allergies:' : 'No known allergies'}
                </span>
                {items.map((a) => (
                    <Tooltip key={a.id} title={a.note || undefined}>
                        <Tag color="red" closable disabled={busy} onClose={(e) => { e.preventDefault(); remove(a.id); }}>
                            {a.allergen}
                        </Tag>
                    </Tooltip>
                ))}
                {addRow}
            </div>
        </div>
    );
}
