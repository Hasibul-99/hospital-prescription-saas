<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\UserNotification;
use App\Services\MedicineSearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineRequestController extends Controller
{
    public function __construct(private readonly MedicineSearchService $search)
    {
    }

    public function index(Request $request)
    {
        $q = trim((string) $request->input('q', ''));

        $requests = Medicine::query()
            ->where('is_pending_approval', true)
            ->when($q !== '', fn ($qq) => $qq->where(function ($w) use ($q) {
                $w->where('brand_name', 'like', "%{$q}%")
                    ->orWhere('generic_name', 'like', "%{$q}%");
            }))
            ->with('submittedBy:id,name,email,hospital_id')
            ->orderBy('created_at')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Admin/MedicineRequests/Index', [
            'requests' => $requests,
            'filters' => ['q' => $q],
        ]);
    }

    public function approve(Medicine $medicine)
    {
        if (! $medicine->is_pending_approval) {
            return back()->with('error', 'Medicine already approved.');
        }

        $medicine->update([
            'is_pending_approval' => false,
            'is_active' => true,
        ]);

        $this->search->invalidate();

        $submitter = $medicine->submittedBy;
        if ($submitter) {
            UserNotification::create([
                'user_id' => $submitter->id,
                'type' => 'medicine_approved',
                'data' => [
                    'medicine_id' => $medicine->id,
                    'brand_name' => $medicine->brand_name,
                    'generic_name' => $medicine->generic_name,
                    'message' => "Your medicine request '{$medicine->brand_name}' was approved.",
                ],
            ]);
        }

        return back()->with('success', "Approved '{$medicine->brand_name}'.");
    }

    public function reject(Medicine $medicine)
    {
        if (! $medicine->is_pending_approval) {
            return back()->with('error', 'Medicine already processed.');
        }

        $medicine->delete();
        $this->search->invalidate();

        return back()->with('success', 'Medicine request rejected.');
    }
}
