<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Models\HospitalHoliday;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', HospitalHoliday::class);

        $year = (int) $request->input('year', now()->year);

        $holidays = HospitalHoliday::query()
            ->where(function ($q) use ($year) {
                $q->whereYear('date', $year)
                  ->orWhere('is_recurring_yearly', true);
            })
            ->orderBy('date')
            ->get();

        return Inertia::render('Hospital/Holidays/Index', [
            'holidays' => $holidays,
            'year' => $year,
        ]);
    }

    public function create()
    {
        $this->authorize('create', HospitalHoliday::class);

        return Inertia::render('Hospital/Holidays/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', HospitalHoliday::class);

        $data = $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:150',
            'is_recurring_yearly' => 'boolean',
        ]);

        HospitalHoliday::create($data);

        return redirect()->route('hospital.holidays.index')->with('success', 'Holiday added.');
    }

    public function edit(HospitalHoliday $holiday)
    {
        $this->authorize('update', $holiday);

        return Inertia::render('Hospital/Holidays/Edit', ['holiday' => $holiday]);
    }

    public function update(Request $request, HospitalHoliday $holiday)
    {
        $this->authorize('update', $holiday);

        $data = $request->validate([
            'date' => 'required|date',
            'title' => 'required|string|max:150',
            'is_recurring_yearly' => 'boolean',
        ]);

        $holiday->update($data);

        return redirect()->route('hospital.holidays.index')->with('success', 'Holiday updated.');
    }

    public function destroy(HospitalHoliday $holiday)
    {
        $this->authorize('delete', $holiday);
        $holiday->delete();

        return redirect()->route('hospital.holidays.index')->with('success', 'Holiday deleted.');
    }
}
