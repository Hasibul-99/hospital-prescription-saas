import { Link, router, usePage } from '@inertiajs/react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { PageProps } from '@/types';

const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    hospital_admin: 'Hospital Admin',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
};

/**
 * Account dropdown in the app header: profile, optional role settings, logout.
 *
 * Every signed-in layout renders this, which is how a user reaches /profile —
 * previously only the unused Breeze layout linked there at all.
 */
export default function UserMenu({
    /** Optional role-specific settings link, e.g. /doctor/settings. */
    settingsHref,
    tone = 'light',
}: {
    settingsHref?: string;
    tone?: 'light' | 'dark';
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    if (!user) return null;

    const items: MenuProps['items'] = [
        {
            key: 'identity',
            type: 'group',
            label: (
                <div className="py-1">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                </div>
            ),
        },
        { type: 'divider' },
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href={route('profile.edit')}>Profile</Link>,
        },
        ...(settingsHref
            ? [{ key: 'settings', icon: <SettingOutlined />, label: <Link href={settingsHref}>Settings</Link> }]
            : []),
        { type: 'divider' },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            danger: true,
            label: 'Log out',
            // router.post rather than a <Link method="post"> so the menu closes
            // before the request fires.
            onClick: () => router.post(route('logout')),
        },
    ];

    const muted = tone === 'dark' ? 'text-white/60' : 'text-gray-500';
    const strong = tone === 'dark' ? 'text-white' : 'text-gray-800';
    const hover = tone === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100';

    return (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" arrow>
            <button
                type="button"
                aria-label="Account menu"
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${hover}`}
            >
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                    <span className={`block text-sm leading-tight ${strong}`}>{user.name}</span>
                    <span className={`block text-[11px] leading-tight ${muted}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                </span>
            </button>
        </Dropdown>
    );
}
