import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center justify-center gap-3">
                        <div style={{
                            width: 40, height: 40, background: '#0f766e',
                            borderRadius: 10, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M5 4h6.5a3.5 3.5 0 0 1 0 7H5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5 4v16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                                <path d="M5 11h4l7 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div className="text-left">
                            <div className="text-xl font-bold text-white tracking-tight">Pulse Rx</div>
                            <div className="text-xs text-gray-500">Clinic Edition</div>
                        </div>
                    </Link>
                    <p className="mt-4 text-sm text-gray-400">Healthcare administration simplified</p>
                </div>

                {children}
            </div>
        </div>
    );
}
