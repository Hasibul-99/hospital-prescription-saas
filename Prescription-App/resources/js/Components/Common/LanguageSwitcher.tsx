import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const items = [
        { key: 'en', label: 'English' },
        { key: 'bn', label: 'বাংলা' },
    ];

    return (
        <Dropdown
            menu={{
                items,
                onClick: ({ key }) => {
                    setLanguage(key as 'en' | 'bn');
                    fetch('/locale', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                        },
                        body: JSON.stringify({ locale: key }),
                    });
                },
                selectable: true,
                selectedKeys: [i18n.language],
            }}
        >
            <Button type="text" icon={<GlobalOutlined />}>
                {i18n.language === 'bn' ? 'বাংলা' : 'EN'}
            </Button>
        </Dropdown>
    );
}
