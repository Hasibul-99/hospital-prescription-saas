<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Services\MedicineBulkImportService;
use App\Services\MedicineSearchService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MedicineController extends Controller
{
    public function __construct(private readonly MedicineSearchService $search)
    {
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->input('q', ''));
        $type = (string) $request->input('type', '');
        $manufacturer = (string) $request->input('manufacturer', '');
        $status = (string) $request->input('status', 'active');
        $sort = $request->input('sort', 'brand_name');
        $dir = $request->input('dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSort = ['brand_name', 'generic_name', 'type', 'strength', 'manufacturer', 'price', 'is_active'];
        if (! in_array($sort, $allowedSort, true)) {
            $sort = 'brand_name';
        }

        $base = Medicine::query()
            ->where('is_pending_approval', false)
            ->when($q !== '', fn ($qq) => $qq->where(function ($w) use ($q) {
                $w->where('brand_name', 'like', "%{$q}%")
                    ->orWhere('generic_name', 'like', "%{$q}%");
            }))
            ->when($type !== '', fn ($qq) => $qq->where('type', $type))
            ->when($manufacturer !== '', fn ($qq) => $qq->where('manufacturer', $manufacturer))
            ->when($status === 'active', fn ($qq) => $qq->where('is_active', true))
            ->when($status === 'inactive', fn ($qq) => $qq->where('is_active', false))
            ->orderBy($sort, $dir);

        $medicines = $base->paginate(30)->withQueryString();

        $manufacturers = Medicine::query()
            ->whereNotNull('manufacturer')
            ->where('manufacturer', '!=', '')
            ->distinct()
            ->orderBy('manufacturer')
            ->pluck('manufacturer');

        $types = Medicine::query()->distinct()->orderBy('type')->pluck('type');

        $pendingCount = Medicine::query()->where('is_pending_approval', true)->count();

        return Inertia::render('Admin/Medicines/Index', [
            'medicines' => $medicines,
            'filters' => compact('q', 'type', 'manufacturer', 'status', 'sort', 'dir'),
            'types' => $types,
            'manufacturers' => $manufacturers,
            'pending_count' => $pendingCount,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Medicines/Form', [
            'medicine' => null,
            'types' => $this->medicineTypes(),
        ]);
    }

    public function edit(Medicine $medicine)
    {
        return Inertia::render('Admin/Medicines/Form', [
            'medicine' => $medicine,
            'types' => $this->medicineTypes(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $medicine = Medicine::create([
            ...$data,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'is_pending_approval' => false,
        ]);

        $this->search->invalidate();

        return redirect()->route('admin.medicines.index')
            ->with('success', "Medicine '{$medicine->brand_name}' created.");
    }

    public function update(Request $request, Medicine $medicine)
    {
        $data = $this->validateData($request, $medicine);

        $medicine->update($data);
        $this->search->invalidate();

        return redirect()->route('admin.medicines.index')
            ->with('success', 'Medicine updated.');
    }

    public function destroy(Medicine $medicine)
    {
        $medicine->update(['is_active' => false]);
        $this->search->invalidate();

        return back()->with('success', 'Medicine deactivated.');
    }

    public function activate(Medicine $medicine)
    {
        $medicine->update(['is_active' => true]);
        $this->search->invalidate();

        return back()->with('success', 'Medicine reactivated.');
    }

    public function bulkImport(Request $request, MedicineBulkImportService $importer)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,json', 'max:20480'],
        ]);

        $uploaded = $request->file('file');
        $tmp = $uploaded->storeAs('imports', 'medicines-' . uniqid() . '.' . $uploaded->getClientOriginalExtension(), 'local');
        $path = storage_path('app/' . $tmp);

        try {
            $result = $importer->importFile($path);
        } catch (\Throwable $e) {
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        } finally {
            @unlink($path);
        }

        $msg = "Imported {$result['created']}, skipped {$result['skipped']}";
        if (! empty($result['errors'])) {
            $msg .= ', errors: ' . count($result['errors']);
        }

        return back()->with('success', $msg);
    }

    protected function validateData(Request $request, ?Medicine $medicine = null): array
    {
        return $request->validate([
            'brand_name' => ['required', 'string', 'max:255'],
            'generic_name' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in($this->medicineTypes())],
            'strength' => ['nullable', 'string', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    protected function medicineTypes(): array
    {
        return [
            'Tablet', 'Syrup', 'Capsule', 'Injection', 'Suppository', 'Cream',
            'Drops', 'Mouthwash', 'Toothpaste', 'Gel', 'Powder', 'Suspension',
            'Ointment', 'Inhaler',
        ];
    }
}
