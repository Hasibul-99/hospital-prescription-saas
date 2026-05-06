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
        return $this->export($request, 'csv');
    }

    public function exportPdf(Request $request)
    {
        return $this->export($request, 'pdf');
    }

    protected function export(Request $request, string $format)
    {
        $report = (string) $request->input('report', 'revenue_per_hospital');

        $defs = [
            'revenue_per_hospital' => [
                'title' => 'Revenue per Hospital',
                'rows' => fn () => $this->reports->revenuePerHospital(),
                'columns' => ['name' => 'Hospital', 'plan' => 'Plan', 'monthly_fee' => 'Monthly Fee', 'status' => 'Status', 'ends_at' => 'Ends At'],
                'name' => 'revenue-per-hospital',
            ],
            'hospital_growth' => [
                'title' => 'Hospital Growth',
                'rows' => fn () => $this->reports->hospitalGrowth(12),
                'columns' => ['bucket' => 'Month', 'count' => 'New Hospitals'],
                'name' => 'hospital-growth',
            ],
            'subscription_breakdown' => [
                'title' => 'Subscription Breakdown',
                'rows' => fn () => $this->reports->subscriptionBreakdown(),
                'columns' => ['status' => 'Status', 'count' => 'Hospitals'],
                'name' => 'subscription-breakdown',
            ],
        ];

        if (! isset($defs[$report])) {
            abort(400, 'Unknown report.');
        }

        $def = $defs[$report];
        $rows = ($def['rows'])();

        if ($format === 'pdf') {
            return $this->exporter->pdfFromColumns("{$def['name']}.pdf", $def['title'], $rows, $def['columns']);
        }

        return $this->exporter->csvFromColumns("{$def['name']}.csv", $rows, $def['columns']);
    }
}
