/**
 * Shared presentation pieces for the audit-log tables.
 *
 * Both the platform log (`Admin/AuditLogs`) and the tenant log
 * (`Hospital/AuditLogs`) render the same events; only the scope and the extra
 * "Hospital" column differ. Everything that turns a raw `resource.verb` row
 * into something a human can read lives here so the two pages cannot drift.
 */
import { Space, Tag, Tooltip } from 'antd';

export type AuditActor = { id: number; name: string; role: string } | null;

export type AuditLogRow = {
    id: number;
    action: string;
    subject_type: string;
    subject_id: number | null;
    meta: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string | null;
    user: AuditActor;
};

// ─── Action vocabulary ────────────────────────────────────────────────
// Audit actions are `resource.verb` keys. Colour comes from the verb (what
// happened), the icon from the resource (what it happened to).

const VERB_STYLE: Record<string, { color: string; label: string }> = {
    create: { color: 'green', label: 'Created' },
    update: { color: 'gold', label: 'Updated' },
    delete: { color: 'red', label: 'Deleted' },
    login: { color: 'blue', label: 'Signed in' },
    logout: { color: 'default', label: 'Signed out' },
    approve: { color: 'cyan', label: 'Approved' },
    reject: { color: 'volcano', label: 'Rejected' },
    restore: { color: 'lime', label: 'Restored' },
};

const RESOURCE_ICON: Record<string, string> = {
    prescription: '℞',
    patient: '🧑',
    appointment: '📅',
    auth: '🔑',
    hospital: '🏥',
    user: '👤',
    medicine: '💊',
    plan: '💳',
    template: '📋',
};

export const ROLE_COLOR: Record<string, string> = {
    super_admin: 'purple',
    hospital_admin: 'geekblue',
    doctor: 'green',
    receptionist: 'orange',
};

function splitAction(action: string): { resource: string; verb: string } {
    const [resource, verb = ''] = action.split('.');
    return { resource, verb };
}

export function titleCase(value: string): string {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "prescription.create" → "Prescription created". */
export function humanAction(action: string): string {
    const { resource, verb } = splitAction(action);
    const label = VERB_STYLE[verb]?.label ?? titleCase(verb);
    return `${titleCase(resource)} ${label.toLowerCase()}`;
}

export function ActionTag({ action }: { action: string }) {
    const { resource, verb } = splitAction(action);
    const style = VERB_STYLE[verb];

    return (
        <Tooltip title={action}>
            <Tag color={style?.color ?? 'default'} className="!mr-0">
                <span className="mr-1">{RESOURCE_ICON[resource] ?? '•'}</span>
                {humanAction(action)}
            </Tag>
        </Tooltip>
    );
}

// ─── Time ─────────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const seconds = Math.round((Date.now() - then) / 1000);

    if (seconds < 60) return 'just now';

    const units: [number, Intl.RelativeTimeFormatUnit][] = [
        [60, 'minute'],
        [3600, 'hour'],
        [86400, 'day'],
        [604800, 'week'],
        [2592000, 'month'],
        [31536000, 'year'],
    ];

    let chosen: [number, Intl.RelativeTimeFormatUnit] = units[0];
    for (const unit of units) {
        if (seconds >= unit[0]) chosen = unit;
    }

    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return formatter.format(-Math.floor(seconds / chosen[0]), chosen[1]);
}

export function exactTime(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function TimeCell({ iso }: { iso: string | null }) {
    if (!iso) return <span className="text-gray-300">—</span>;

    return (
        <Tooltip title={exactTime(iso)}>
            <span className="whitespace-nowrap text-gray-700">{relativeTime(iso)}</span>
        </Tooltip>
    );
}

// ─── Actor ────────────────────────────────────────────────────────────

export function UserCell({ user }: { user: AuditActor }) {
    if (!user) {
        // A null user means the event was not attributable to a signed-in
        // account — a job, a console command, or a deleted user whose FK was
        // nulled.
        return (
            <Tooltip title="Not attributable to a signed-in account">
                <span className="text-gray-400">System</span>
            </Tooltip>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
                <div className="truncate text-sm text-gray-900">{user.name}</div>
                <Tag color={ROLE_COLOR[user.role] ?? 'default'} className="!mr-0 !text-[10px]">
                    {titleCase(user.role)}
                </Tag>
            </div>
        </div>
    );
}

export function SubjectCell({ type, id }: { type: string; id: number | null }) {
    return (
        <span className="whitespace-nowrap text-sm text-gray-700">
            {type}
            {id !== null && <span className="text-gray-400"> #{id}</span>}
        </span>
    );
}

export function IpCell({ ip }: { ip: string | null }) {
    return ip ? <code className="text-xs text-gray-500">{ip}</code> : <span className="text-gray-300">—</span>;
}

// ─── Meta ─────────────────────────────────────────────────────────────

export function formatMetaValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

/**
 * Meta is free-form per action (`{medicines: 2, complaints: 3}`). Rendered as
 * compact chips instead of a raw JSON dump, which used to blow out the row.
 */
export function MetaChips({ meta }: { meta: AuditLogRow['meta'] }) {
    const entries = Object.entries(meta ?? {});

    if (entries.length === 0) {
        return <span className="text-gray-300">—</span>;
    }

    const shown = entries.slice(0, 3);
    const hidden = entries.length - shown.length;

    return (
        <Space size={4} wrap>
            {shown.map(([key, value]) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs"
                >
                    <span className="text-gray-500">{titleCase(key)}</span>
                    <span className="font-medium text-gray-800">{formatMetaValue(value)}</span>
                </span>
            ))}
            {hidden > 0 && <span className="text-xs text-gray-400">+{hidden} more</span>}
        </Space>
    );
}

/** Expanded-row body: key/value details on the left, raw JSON on the right. */
export function MetaExpansion({ row }: { row: AuditLogRow }) {
    return (
        <div className="grid gap-4 px-2 py-1 md:grid-cols-2">
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Details</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {Object.entries(row.meta ?? {}).map(([key, value]) => (
                        <div key={key} className="contents">
                            <dt className="text-gray-500">{titleCase(key)}</dt>
                            <dd className="font-medium text-gray-900">{formatMetaValue(value)}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Raw</p>
                <pre className="max-h-40 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                    {JSON.stringify(
                        {
                            action: row.action,
                            subject: `${row.subject_type}#${row.subject_id ?? ''}`,
                            at: row.created_at,
                            ip: row.ip_address,
                            meta: row.meta,
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>
        </div>
    );
}

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 truncate text-2xl font-bold tabular-nums text-gray-900">{value}</p>
            {hint && <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>}
        </div>
    );
}

/**
 * Groups `{value, group, count}` action options into antd's grouped-select
 * shape so the picker reads "Prescription › Prescription created (12)".
 */
export function groupActionOptions(actions: { value: string; group: string; count: number }[]) {
    const groups = actions.reduce<Record<string, typeof actions>>((acc, option) => {
        (acc[option.group] ??= []).push(option);
        return acc;
    }, {});

    return Object.entries(groups).map(([group, options]) => ({
        label: titleCase(group),
        options: options.map((o) => ({
            value: o.value,
            label: `${humanAction(o.value)} (${o.count})`,
        })),
    }));
}
