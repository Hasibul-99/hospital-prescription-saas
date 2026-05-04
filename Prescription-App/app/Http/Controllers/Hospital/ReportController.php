<?php

namespace App\Http\Controllers\Hospital;

use App\Http\Controllers\Controller;
use App\Services\Reports\HospitalReportService;
use App\Services\Reports\ReportExporter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(
        private readonly HospitalReportService $reports,
        private readonly ReportExporter $exporter,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        [$bucket, $from, $to] = $this->parseFilters($request);

        return Inertia::render('Hospital/Reports/Index', [
            'filters' => [
                'bucket' => $bucket,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'doctor_load' => $this->reports->doctorPatientLoad($user->hospital_id, $from, $to),
            'revenue' => $this->reports->revenue($user->hospital_id, $bucket, $from, $to),
            'revenue_by_doctor' => $this->reports->revenueByDoctor($user->hospital_id, $from, $to),
            'utilization' => $this->reports->utilization($user->hospital_id, $from, $to),
            'demographics' => $this->reports->demographics($user->hospital_id),
            'top_medicines' => $this->reports->topMedicines($user->hospital_id, $from, $to),
            'new_vs_returning' => $this->reports->newVsReturning($user->hospital_id, $from, $to),
        ]);
    }

    public function exportCsv(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        $report = (string) $request->input('report', 'doctor_load');
        [$bucket, $from, $to] = $this->parseFilters($request);

        return match ($report) {
            'doctor_load' => $this->exporter->csvFromColumns(
                "doctor-load-{$from->toDateString()}.csv",
                $this->reports->doctorPatientLoad($user->hospital_id, $from, $to),
                ['doctor_name' => 'Doctor', 'visits' => 'Visits', 'unique_patients' => 'Unique Patients'],
            ),
            'revenue' => $this->exporter->csvFromColumns(
                "revenue-{$bucket}-{$from->toDateString()}.csv",
                $this->reports->revenue($user->hospital_id, $bucket, $from, $to),
                ['bucket' => 'Bucket', 'total' => 'Revenue'],
            ),
            'revenue_by_doctor' => $this->exporter->csvFromColumns(
                "revenue-by-doctor-{$from->toDateString()}.csv",
                $this->reports->revenueByDoctor($user->hospital_id, $from, $to),
                ['doctor_name' => 'Doctor', 'total' => 'Revenue'],
            ),
            'top_medicines' => $this->exporter->csvFromColumns(
                "top-medicines-{$from->toDateString()}.csv",
                $this->reports->topMedicines($user->hospital_id, $from, $to),
                ['label' => 'Medicine', 'value' => 'Count'],
            ),
            default => abort(400, 'Unknown report.'),
        };
    }

    protected function parseFilters(Request $request): array
    {
        $bucket = in_array($request->input('bucket'), ['daily', 'weekly', 'monthly'], true)
            ? $request->input('bucket')
            : 'daily';

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        return [$bucket, $from, $to];
    }
}
