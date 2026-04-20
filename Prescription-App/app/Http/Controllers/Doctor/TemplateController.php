<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', DoctorTemplate::class);

        $user = $request->user();
        $q = trim((string) $request->input('q', ''));

        $templates = DoctorTemplate::query()
            ->where(function ($qq) use ($user) {
                $qq->where(function ($w) use ($user) {
                    $w->where('doctor_id', $user->id)->where('hospital_id', $user->hospital_id);
                })->orWhere('is_global', true);
            })
            ->when($q !== '', fn ($qq) => $qq->where('disease_name', 'like', "%{$q}%"))
            ->orderByDesc('last_used_at')
            ->orderBy('disease_name')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Doctor/Templates/Index', [
            'templates' => $templates,
            'filters' => ['q' => $q],
        ]);
    }

    public function show(DoctorTemplate $template)
    {
        $this->authorize('view', $template);

        $template->increment('use_count');
        $template->update(['last_used_at' => now()]);

        return response()->json($template);
    }

    public function store(Request $request)
    {
        $this->authorize('create', DoctorTemplate::class);

        $data = $request->validate([
            'disease_name' => 'required|string|max:150',
            'complaints' => 'nullable|array',
            'examinations' => 'nullable|array',
            'medicines' => 'nullable|array',
            'advices' => 'nullable|array',
            'investigations' => 'nullable|array',
        ]);

        $user = $request->user();
        $data['doctor_id'] = $user->id;
        $data['hospital_id'] = $user->hospital_id;

        $template = DoctorTemplate::create($data);

        return response()->json($template);
    }

    public function destroy(DoctorTemplate $template)
    {
        $this->authorize('delete', $template);
        $template->delete();

        return back()->with('success', 'Template deleted.');
    }
}
