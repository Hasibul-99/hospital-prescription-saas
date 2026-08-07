<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlanRequest;
use App\Models\Plan;
use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Super-admin CRUD for subscription plans.
 *
 * Gated entirely by the `role:super_admin` route middleware, matching every
 * other Admin controller — there is no Gate::before in this app and no Admin
 * controller calls authorize(), so a PlanPolicy here would be dead weight.
 */
class PlanController extends Controller
{
    public function index(Request $request)
    {
        $sort = in_array($request->sort, ['name', 'code', 'price_monthly', 'sort_order'], true)
            ? $request->sort
            : 'sort_order';
        $direction = $request->direction === 'desc' ? 'desc' : 'asc';

        $plans = Plan::query()
            ->withCount('hospitals')
            ->when($request->search, fn ($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%");
            }))
            ->when($request->status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($request->status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy($sort, $direction)
            ->orderBy('price_monthly')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $this->paginateFor($plans),
            'filters' => $request->only(['search', 'status', 'sort', 'direction']),
            'currency' => Money::config(Money::platformCurrency()),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Plans/Form', [
            'plan' => null,
            'currency' => Money::config(Money::platformCurrency()),
            'nextSortOrder' => (int) Plan::max('sort_order') + 1,
        ]);
    }

    public function store(PlanRequest $request)
    {
        Plan::create($request->validated());

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan created successfully.');
    }

    public function edit(Plan $plan)
    {
        return Inertia::render('Admin/Plans/Form', [
            'plan' => $plan,
            'currency' => Money::config(Money::platformCurrency()),
            'nextSortOrder' => $plan->sort_order,
        ]);
    }

    public function update(PlanRequest $request, Plan $plan)
    {
        // `code` is immutable once other rows and seeders reference it.
        $plan->update($request->safe()->except('code'));

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan updated successfully.');
    }

    public function destroy(Plan $plan)
    {
        $inUse = $plan->hospitals()->count();

        if ($inUse > 0) {
            $label = $inUse === 1 ? 'hospital is' : 'hospitals are';

            return back()->with('error', "Cannot delete: {$inUse} {$label} on this plan. Move them to another plan first.");
        }

        $plan->delete();

        return back()->with('success', 'Plan deleted successfully.');
    }

    public function toggleStatus(Plan $plan)
    {
        $plan->update(['is_active' => ! $plan->is_active]);

        $state = $plan->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Plan {$state}. " . ($plan->is_active
            ? 'It can now be assigned to hospitals.'
            : 'Existing hospitals keep it; it can no longer be assigned to new ones.'));
    }

    public function togglePublic(Plan $plan)
    {
        $plan->update(['is_public' => ! $plan->is_public]);

        return back()->with('success', $plan->is_public
            ? 'Plan is now shown on the public pricing page.'
            : 'Plan is now hidden from the public pricing page.');
    }

    /** Persist a new landing-page ordering from the admin table. */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:plans,id'],
        ]);

        foreach ($data['order'] as $position => $id) {
            Plan::where('id', $id)->update(['sort_order' => $position + 1]);
        }

        return back()->with('success', 'Plan order updated.');
    }
}
