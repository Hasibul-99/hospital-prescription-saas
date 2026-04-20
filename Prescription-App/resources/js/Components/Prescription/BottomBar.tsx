interface Props {
    saving: boolean;
    dirty: boolean;
    lastSavedAt: string | null;
    onSave: () => void;
    onSavePrint: () => void;
}

export default function BottomBar({ saving, dirty, lastSavedAt, onSave, onSavePrint }: Props) {
    return (
        <div className="sticky bottom-0 z-20 border-t bg-white px-4 py-2 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                    {saving ? (
                        'Saving…'
                    ) : dirty ? (
                        <span className="text-amber-600">Unsaved changes</span>
                    ) : lastSavedAt ? (
                        <span className="text-green-600">Saved {lastSavedAt}</span>
                    ) : (
                        'Ready'
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={onSavePrint}
                        disabled={saving}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        Save + Print
                    </button>
                </div>
            </div>
        </div>
    );
}
