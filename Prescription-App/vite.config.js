import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            // Emit manifest + service worker to /public so Laravel serves them at the root.
            outDir: 'public',
            filename: 'sw.js',
            manifestFilename: 'manifest.webmanifest',
            manifest: {
                name: 'Prescriply — MedixPro',
                short_name: 'Rx',
                description: 'Structured prescriptions, patient records, appointments — all in one place.',
                theme_color: '#0f766e',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/dashboard',
                scope: '/',
                icons: [
                    { src: '/icons/logo-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
                ],
            },
            workbox: {
                // Vite build assets precache; HTML nav goes network-first so Inertia
                // always gets fresh markup, falling back to last-cached when offline.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'html-nav',
                            networkTimeoutSeconds: 3,
                            expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 },
                        },
                    },
                    {
                        urlPattern: /\/build\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'vite-build',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
});
