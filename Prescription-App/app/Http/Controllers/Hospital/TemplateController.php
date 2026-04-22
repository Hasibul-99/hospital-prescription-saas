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
            'templates' => $templates,
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
            'duration_presets' => [
                '1 day', '2 days', '3 days', '5 days', '7 days', '10 days', '15 days',
                '1 month', '2 months', '3 months', '6 months', '1 year',
                'Few days', 'Continuous',
            ],
            'advice_suggestions' => [
                ['en' => 'Get tests done', 'bn' => 'পরীক্ষা করে দেখান'],
                ['en' => 'Drink plenty of water', 'bn' => 'প্রচুর পানি খাবেন'],
                ['en' => 'Take rest', 'bn' => 'বিশ্রাম নিবেন'],
            ],
            'frequent_medicines' => [],
            'instruction_presets' => [
                'খাবারের পরে', 'খাবারের আগে', 'খাবারের সাথে',
            ],
            'duration_day_presets' => [1, 5, 7, 14, 30],
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
