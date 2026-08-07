<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\TemplateRequest;
use App\Models\ComplaintMaster;
use App\Models\DoctorFrequentMedicine;
use App\Models\DoctorTemplate;
use App\Services\TemplateCrudService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function __construct(private readonly TemplateCrudService $service)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', DoctorTemplate::class);

        $user = $request->user();
        $q = trim((string) $request->input('q', ''));
        $tab = $request->input('tab', 'mine');

        $base = DoctorTemplate::query()
            ->when($q !== '', fn ($qq) => $qq->where('disease_name', 'like', "%{$q}%"));

        if ($tab === 'global') {
            $base->where('is_global', true)
                ->where(function ($qq) use ($user) {
                    $qq->where('hospital_id', $user->hospital_id)
                        ->orWhereNull('hospital_id');
                });
        } else {
            $base->where('is_global', false)
                ->where('doctor_id', $user->id)
                ->where('hospital_id', $user->hospital_id);
        }

        $templates = $base
            ->withCount([])
            ->orderByDesc('last_used_at')
            ->orderBy('disease_name')
            ->paginate(24)
            ->withQueryString()
            ->through(fn ($t) => [
                'id' => $t->id,
                'disease_name' => $t->disease_name,
                'is_global' => $t->is_global,
                'medicine_count' => is_array($t->medicines) ? count($t->medicines) : 0,
                'complaint_count' => is_array($t->complaints) ? count($t->complaints) : 0,
                'last_used_at' => $t->last_used_at,
                'use_count' => $t->use_count,
                'updated_at' => $t->updated_at,
            ]);

        return Inertia::render('Doctor/Templates/Index', [
            'templates' => $this->paginateFor($templates),
            'filters' => ['q' => $q, 'tab' => $tab],
            'can_create_global' => $user->can('createGlobal', DoctorTemplate::class),
        ]);
    }

    public function show(DoctorTemplate $template)
    {
        $this->authorize('view', $template);

        $this->service->recordUse($template);

        return response()->json($template);
    }

    public function create()
    {
        $this->authorize('create', DoctorTemplate::class);

        return Inertia::render('Doctor/Templates/Form', $this->formProps(null));
    }

    public function edit(DoctorTemplate $template)
    {
        $this->authorize('update', $template);

        return Inertia::render('Doctor/Templates/Form', $this->formProps($template));
    }

    protected function formProps(?DoctorTemplate $template): array
    {
        $user = request()->user();

        return [
            'template' => $template,
            'can_create_global' => $user->can('createGlobal', DoctorTemplate::class),
            'complaint_masters' => ComplaintMaster::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name_en', 'name_bn', 'category']),
            'duration_presets' => config('prescription.duration_presets'),
            'advice_suggestions' => config('prescription.advice_suggestions'),
            'frequent_medicines' => DoctorFrequentMedicine::query()
                ->where('doctor_id', $user->id)
                ->orderBy('sort_order')
                ->with('medicine:id,brand_name,generic_name,type,strength,manufacturer')
                ->get()
                ->map(fn ($f) => $f->medicine)
                ->filter()
                ->values()
                ->toArray(),
            'instruction_presets' => config('prescription.instruction_presets'),
            'duration_day_presets' => config('prescription.duration_day_presets'),
        ];
    }

    public function store(TemplateRequest $request)
    {
        $this->authorize('create', DoctorTemplate::class);

        $asGlobal = (bool) $request->input('is_global', false);
        if ($asGlobal) {
            $this->authorize('createGlobal', DoctorTemplate::class);
        }

        $template = $this->service->create($request->user(), $request->validated(), $asGlobal);

        if ($request->wantsJson()) {
            return response()->json($template);
        }

        return redirect()->route('doctor.templates.index')->with('success', 'Template created.');
    }

    public function update(TemplateRequest $request, DoctorTemplate $template)
    {
        $this->authorize('update', $template);

        $this->service->update($template, $request->validated());

        if ($request->wantsJson()) {
            return response()->json($template->fresh());
        }

        return redirect()->route('doctor.templates.index')->with('success', 'Template updated.');
    }

    public function duplicate(DoctorTemplate $template)
    {
        $this->authorize('duplicate', $template);

        $copy = $this->service->duplicate(request()->user(), $template);

        return redirect()->route('doctor.templates.edit', $copy)->with('success', 'Template duplicated.');
    }

    public function destroy(DoctorTemplate $template)
    {
        $this->authorize('delete', $template);
        $template->delete();

        return back()->with('success', 'Template deleted.');
    }
}
