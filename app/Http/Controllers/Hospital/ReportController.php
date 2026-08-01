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
        return $this->export($request, 'csv');
    }

    public function exportPdf(Request $request)
    {
        return $this->export($request, 'pdf');
    }

    protected function export(Request $request, string $format)
    {
        $user = $request->user();
        abort_unless($user->isHospitalAdmin() || $user->isSuperAdmin(), 403);

        $report = (string) $request->input('report', 'doctor_load');
        [$bucket, $from, $to] = $this->parseFilters($request);

        if ($format === 'pdf' && $report === 'full') {
            return $this->fullPdf($user, $bucket, $from, $to);
        }

        $defs = [
            'doctor_load' => [
                'title' => 'Doctor Patient Load',
                'rows' => fn () => $this->reports->doctorPatientLoad($user->hospital_id, $from, $to),
                'columns' => ['doctor_name' => 'Doctor', 'visits' => 'Visits', 'unique_patients' => 'Unique Patients'],
                'name' => "doctor-load-{$from->toDateString()}",
            ],
            'revenue' => [
                'title' => 'Revenue',
                'rows' => fn () => $this->reports->revenue($user->hospital_id, $bucket, $from, $to),
                'columns' => ['bucket' => 'Bucket', 'total' => 'Revenue'],
                'name' => "revenue-{$bucket}-{$from->toDateString()}",
            ],
            'revenue_by_doctor' => [
                'title' => 'Revenue by Doctor',
                'rows' => fn () => $this->reports->revenueByDoctor($user->hospital_id, $from, $to),
                'columns' => ['doctor_name' => 'Doctor', 'total' => 'Revenue'],
                'name' => "revenue-by-doctor-{$from->toDateString()}",
            ],
            'top_medicines' => [
                'title' => 'Top Medicines',
                'rows' => fn () => $this->reports->topMedicines($user->hospital_id, $from, $to),
                'columns' => ['label' => 'Medicine', 'value' => 'Count'],
                'name' => "top-medicines-{$from->toDateString()}",
            ],
        ];

        if (! isset($defs[$report])) {
            abort(400, 'Unknown report.');
        }

        $def = $defs[$report];
        $rows = ($def['rows'])();

        if ($format === 'pdf') {
            return $this->exporter->pdfFromColumns(
                "{$def['name']}.pdf",
                $def['title'],
                $rows,
                $def['columns'],
                ['From' => $from->toDateString(), 'To' => $to->toDateString()],
            );
        }

        return $this->exporter->csvFromColumns("{$def['name']}.csv", $rows, $def['columns']);
    }

    protected function fullPdf($user, string $bucket, Carbon $from, Carbon $to)
    {
        $util = $this->reports->utilization($user->hospital_id, $from, $to);
        $nvr = $this->reports->newVsReturning($user->hospital_id, $from, $to);

        $sections = [
            [
                'title' => 'Doctor Patient Load',
                'columns' => ['doctor_name' => 'Doctor', 'visits' => 'Visits', 'unique_patients' => 'Unique Patients'],
                'rows' => $this->reports->doctorPatientLoad($user->hospital_id, $from, $to),
            ],
            [
                'title' => 'Revenue (' . ucfirst($bucket) . ')',
                'columns' => ['bucket' => 'Bucket', 'total' => 'Revenue'],
                'rows' => $this->reports->revenue($user->hospital_id, $bucket, $from, $to),
                'chart' => ['label' => 'bucket', 'value' => 'total'],
            ],
            [
                'title' => 'Revenue by Doctor',
                'columns' => ['doctor_name' => 'Doctor', 'total' => 'Revenue'],
                'rows' => $this->reports->revenueByDoctor($user->hospital_id, $from, $to),
                'chart' => ['label' => 'doctor_name', 'value' => 'total'],
            ],
            [
                'title' => 'Top Medicines',
                'columns' => ['label' => 'Medicine', 'value' => 'Count'],
                'rows' => $this->reports->topMedicines($user->hospital_id, $from, $to),
                'chart' => ['label' => 'label', 'value' => 'value'],
            ],
            [
                'title' => 'Utilization',
                'summary' => [
                    'Total appointments' => $util['total_appointments'],
                    'Completed' => $util['completed'],
                    'Absent' => $util['absent'],
                    'Completion rate' => $util['completion_rate'] . '%',
                ],
            ],
            [
                'title' => 'New vs Returning Patients',
                'summary' => [
                    'New patients' => $nvr['new'],
                    'Returning patients' => $nvr['returning'],
                ],
            ],
        ];

        return $this->exporter->pdfFullReport(
            "hospital-report-{$from->toDateString()}-to-{$to->toDateString()}.pdf",
            'Hospital Report',
            $sections,
            ['From' => $from->toDateString(), 'To' => $to->toDateString(), 'Hospital' => $user->hospital?->name ?? ''],
        );
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
