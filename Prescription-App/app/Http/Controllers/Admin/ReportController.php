<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Reports\PlatformReportService;
use App\Services\Reports\ReportExporter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(
        private readonly PlatformReportService $reports,
        private readonly ReportExporter $exporter,
    ) {
    }

    public function index(Request $request)
    {
        $months = max(3, min(36, (int) $request->input('months', 12)));

        return Inertia::render('Admin/Reports/Index', [
            'filters' => ['months' => $months],
            'totals' => $this->reports->totals(),
            'subscription_breakdown' => $this->reports->subscriptionBreakdown(),
            'hospital_growth' => $this->reports->hospitalGrowth($months),
            'revenue_per_hospital' => $this->reports->revenuePerHospital(),
        ]);
    }

    public function exportCsv(Request $request)
    {
        $report = (string) $request->input('report', 'revenue_per_hospital');

        return match ($report) {
            'revenue_per_hospital' => $this->exporter->csvFromColumns(
                'revenue-per-hospital.csv',
                $this->reports->revenuePerHospital(),
                ['name' => 'Hospital', 'plan' => 'Plan', 'monthly_fee' => 'Monthly Fee', 'status' => 'Status', 'ends_at' => 'Ends At'],
            ),
            'hospital_growth' => $this->exporter->csvFromColumns(
                'hospital-growth.csv',
                $this->reports->hospitalGrowth(12),
                ['bucket' => 'Month', 'count' => 'New Hospitals'],
            ),
            'subscription_breakdown' => $this->exporter->csvFromColumns(
                'subscription-breakdown.csv',
                $this->reports->subscriptionBreakdown(),
                ['status' => 'Status', 'count' => 'Hospitals'],
            ),
            default => abort(400, 'Unknown report.'),
        };
    }
}
