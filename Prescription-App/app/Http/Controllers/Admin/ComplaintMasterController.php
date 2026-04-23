<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ComplaintDurationPreset;
use App\Models\ComplaintMaster;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComplaintMasterController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->input('q', ''));
        $category = (string) $request->input('category', '');
        $status = (string) $request->input('status', 'all');

        $complaints = ComplaintMaster::query()
            ->with(['durationPresets' => fn ($qq) => $qq->orderBy('sort_order')])
            ->when($q !== '', fn ($qq) => $qq->where(function ($w) use ($q) {
                $w->where('name_en', 'like', "%{$q}%")
                    ->orWhere('name_bn', 'like', "%{$q}%");
            }))
            ->when($category !== '', fn ($qq) => $qq->where('category', $category))
            ->when($status === 'active', fn ($qq) => $qq->where('is_active', true))
            ->when($status === 'inactive', fn ($qq) => $qq->where('is_active', false))
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->paginate(30)
            ->withQueryString();

        $categories = ComplaintMaster::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('Admin/Complaints/Index', [
            'complaints' => $complaints,
            'filters' => compact('q', 'category', 'status'),
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Complaints/Form', [
            'complaint' => null,
        ]);
    }

    public function edit(ComplaintMaster $complaint)
    {
        $complaint->load(['durationPresets' => fn ($qq) => $qq->orderBy('sort_order')]);

        return Inertia::render('Admin/Complaints/Form', [
            'complaint' => $complaint,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $complaint = ComplaintMaster::create([
            ...$data,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return redirect()->route('admin.complaints.edit', $complaint)
            ->with('success', "Complaint '{$complaint->name_en}' created.");
    }

    public function update(Request $request, ComplaintMaster $complaint)
    {
        $data = $this->validateData($request);

        $complaint->update($data);

        return back()->with('success', 'Complaint updated.');
    }

    public function destroy(ComplaintMaster $complaint)
    {
        $complaint->update(['is_active' => false]);

        return back()->with('success', 'Complaint deactivated.');
    }

    public function addPreset(Request $request, ComplaintMaster $complaint)
    {
        $data = $request->validate([
            'duration_text_en' => ['required', 'string', 'max:100'],
            'duration_text_bn' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $complaint->durationPresets()->create([
            'duration_text_en' => $data['duration_text_en'],
            'duration_text_bn' => $data['duration_text_bn'] ?? null,
            'sort_order' => $data['sort_order'] ?? $complaint->durationPresets()->count(),
        ]);

        return back()->with('success', 'Duration preset added.');
    }

    public function updatePreset(Request $request, ComplaintDurationPreset $preset)
    {
        $data = $request->validate([
            'duration_text_en' => ['required', 'string', 'max:100'],
            'duration_text_bn' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $preset->update($data);

        return back()->with('success', 'Preset updated.');
    }

    public function destroyPreset(ComplaintDurationPreset $preset)
    {
        $preset->delete();

        return back()->with('success', 'Preset deleted.');
    }

    public function reorderPresets(Request $request, ComplaintMaster $complaint)
    {
        $data = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['integer'],
        ]);

        foreach ($data['ordered_ids'] as $i => $presetId) {
            ComplaintDurationPreset::where('complaint_master_id', $complaint->id)
                ->where('id', $presetId)
                ->update(['sort_order' => $i]);
        }

        return response()->json(['ok' => true]);
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:json,txt', 'max:5120'],
        ]);

        $raw = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($raw, true);

        if (! is_array($data)) {
            return back()->with('error', 'Invalid JSON. Expected array of complaint objects.');
        }

        $created = 0;
        $skipped = 0;

        foreach ($data as $row) {
            if (empty($row['name_en'])) {
                $skipped++;
                continue;
            }

            $existing = ComplaintMaster::where('name_en', $row['name_en'])->first();
            if ($existing) {
                $skipped++;
                continue;
            }

            $complaint = ComplaintMaster::create([
                'name_en' => $row['name_en'],
                'name_bn' => $row['name_bn'] ?? null,
                'category' => $row['category'] ?? null,
                'sort_order' => $row['sort_order'] ?? 0,
                'is_active' => $row['is_active'] ?? true,
            ]);

            foreach (($row['duration_presets'] ?? []) as $i => $preset) {
                $complaint->durationPresets()->create([
                    'duration_text_en' => is_array($preset) ? ($preset['duration_text_en'] ?? '') : $preset,
                    'duration_text_bn' => is_array($preset) ? ($preset['duration_text_bn'] ?? null) : null,
                    'sort_order' => $i,
                ]);
            }

            $created++;
        }

        return back()->with('success', "Imported {$created}, skipped {$skipped}.");
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'name_en' => ['required', 'string', 'max:255'],
            'name_bn' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
