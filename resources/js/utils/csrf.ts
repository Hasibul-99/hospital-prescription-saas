function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns the CSRF header for custom fetch() calls.
 * Prefers XSRF-TOKEN cookie (always in sync with session — same as Axios/Inertia).
 * Falls back to <meta name="csrf-token"> if cookie is absent.
 */
export function csrfHeaders(): Record<string, string> {
    const xsrf = getCookie('XSRF-TOKEN');
    if (xsrf) return { 'X-XSRF-TOKEN': xsrf };

    const meta = document.head?.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    if (meta?.content) return { 'X-CSRF-TOKEN': meta.content };

    return {};
}

/**
 * Drop-in fetch() wrapper that injects CSRF token, credentials, and
 * X-Requested-With automatically. Caller only needs content-specific headers.
 *
 * Usage:
 *   fetchWithCsrf('/api/foo', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload),
 *   })
 */
export function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
    const { headers: callerHeaders, ...rest } = options;
    return fetch(url, {
        credentials: 'same-origin',
        ...rest,
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(),
            ...callerHeaders,
        },
    });
}
