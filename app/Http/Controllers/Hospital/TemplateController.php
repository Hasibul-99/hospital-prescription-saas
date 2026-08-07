<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Http\Requests\TemplateRequest;
use App\Models\ComplaintMaster;
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

        $templates = DoctorTemplate::query()
            ->where('is_global', true)
            ->where('hospital_id', $user->hospital_id)
            ->when($q !== '', fn ($qq) => $qq->where('disease_name', 'like', "%{$q}%"))
            ->orderByDesc('last_used_at')
            ->orderBy('disease_name')
            ->paginate(24)
            ->withQueryString()
            ->through(fn ($t) => [
                'id' => $t->id,
                'disease_name' => $t->disease_name,
                'medicine_count' => is_array($t->medicines) ? count($t->medicines) : 0,
                'complaint_count' => is_array($t->complaints) ? count($t->complaints) : 0,
                'last_used_at' => $t->last_used_at,
                'use_count' => $t->use_count,
                'updated_at' => $t->updated_at,
            ]);

        return Inertia::render('Hospital/Templates/Index', [
            'templates' => $this->paginateFor($templates),
            'filters' => ['q' => $q],
        ]);
    }

    public function create()
    {
        $this->authorize('createGlobal', DoctorTemplate::class);

        return Inertia::render('Hospital/Templates/Form', $this->formProps(null));
    }

    public function edit(DoctorTemplate $template)
    {
        $this->authorize('update', $template);
        abort_unless($template->is_global, 404);

        return Inertia::render('Hospital/Templates/Form', $this->formProps($template));
    }

    protected function formProps(?DoctorTemplate $template): array
    {
        return [
            'template' => $template,
            'complaint_masters' => ComplaintMaster::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'name_en', 'name_bn', 'category']),
            // A hospital-global template has no single doctor, so there is no
            // personal "frequently used" list to offer here.
            'frequent_medicines' => [],
            'duration_presets' => config('prescription.duration_presets'),
            'advice_suggestions' => config('prescription.advice_suggestions'),
            'instruction_presets' => config('prescription.instruction_presets'),
            'duration_day_presets' => config('prescription.duration_day_presets'),
        ];
    }

    public function store(TemplateRequest $request)
    {
        $this->authorize('createGlobal', DoctorTemplate::class);

        $template = $this->service->create($request->user(), $request->validated(), true);

        return redirect()
            ->route('hospital.templates.index')
            ->with('success', "Global template '{$template->disease_name}' created.");
    }

    public function update(TemplateRequest $request, DoctorTemplate $template)
    {
        $this->authorize('update', $template);
        abort_unless($template->is_global, 404);

        $this->service->update($template, $request->validated());

        return redirect()
            ->route('hospital.templates.index')
            ->with('success', 'Global template updated.');
    }

    public function destroy(DoctorTemplate $template)
    {
        $this->authorize('delete', $template);
        abort_unless($template->is_global, 404);

        $template->delete();

        return back()->with('success', 'Global template deleted.');
    }
}
