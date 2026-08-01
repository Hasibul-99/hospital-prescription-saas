<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hospital;
use App\Services\DashboardStatsService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardStatsService $stats)
    {
    }

    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => $this->stats->platformStats(),
            'recent_hospitals' => Hospital::latest()->take(5)->get(),
        ]);
    }
}
