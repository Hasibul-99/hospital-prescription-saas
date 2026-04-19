<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Models\Prescription;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_hospitals' => Hospital::count(),
                'total_doctors' => User::where('role', 'doctor')->count(),
                'total_prescriptions' => Prescription::withoutGlobalScopes()->count(),
                'active_subscriptions' => Hospital::whereIn('subscription_status', ['active', 'trial'])->count(),
            ],
            'recent_hospitals' => Hospital::latest()->take(5)->get(),
        ]);
    }
}
