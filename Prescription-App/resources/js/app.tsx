import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const antTheme = {
    token: {
        colorPrimary: '#0f4c81',
        borderRadius: 6,
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif",
    },
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfigProvider theme={antTheme}>
                <AntApp>
                    <App {...props} />
                </AntApp>
            </ConfigProvider>,
        );
    },
    progress: {
        color: '#0f4c81',
    },
});
