import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function PublicLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <Link href="/book" className="flex items-center gap-2 font-semibold text-teal-700">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-teal-700 text-sm text-white">Rx</span>
                        <span>Prescriply</span>
                    </Link>
                    <nav className="flex items-center gap-4 text-sm text-gray-600">
                        <Link href="/book" className="hover:text-teal-700">Find a doctor</Link>
                        <Link href="/login" className="rounded border border-gray-300 px-3 py-1 hover:border-teal-500 hover:text-teal-700">Sign in</Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

            <footer className="mt-16 border-t bg-white py-6 text-center text-xs text-gray-500">
                © {new Date().getFullYear()} Prescriply — MedixPro
            </footer>
        </div>
    );
}
