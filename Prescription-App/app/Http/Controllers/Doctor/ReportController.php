<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Services\Reports\DoctorReportService;
use App\Services\Reports\ReportExporter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(
        private readonly DoctorReportService $reports,
        private readonly ReportExporter $exporter,
    ) {
    }

    public function index(Request $request)
    {
        [$bucket, $from, $to] = $this->parseFilters($request);

        $user = $request->user();

        return Inertia::render('Doctor/Reports/Index', [
            'filters' => [
                'bucket' => $bucket,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'patient_count' => $this->reports->patientCount($user->id, $user->hospital_id, $bucket, $from, $to),
            'disease_breakdown' => $this->reports->diseaseBreakdown($user->id, $user->hospital_id, $from, $to),
            'top_medicines' => $this->reports->topMedicines($user->id, $user->hospital_id, $from, $to),
            'follow_up_compliance' => $this->reports->followUpCompliance($user->id, $user->hospital_id, $from, $to),
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
        $report = (string) $request->input('report', 'patient_count');
        [$bucket, $from, $to] = $this->parseFilters($request);
        $user = $request->user();

        $defs = [
            'patient_count' => [
                'title' => 'Patient Count',
                'rows' => fn () => $this->reports->patientCount($user->id, $user->hospital_id, $bucket, $from, $to),
                'columns' => ['bucket' => 'Bucket', 'count' => 'Patients'],
                'name' => "patient-count-{$bucket}-{$from->toDateString()}",
            ],
            'disease_breakdown' => [
                'title' => 'Disease Breakdown',
                'rows' => fn () => $this->reports->diseaseBreakdown($user->id, $user->hospital_id, $from, $to),
                'columns' => ['label' => 'Diagnosis', 'value' => 'Count'],
                'name' => "disease-breakdown-{$from->toDateString()}",
            ],
            'top_medicines' => [
                'title' => 'Top Medicines',
                'rows' => fn () => $this->reports->topMedicines($user->id, $user->hospital_id, $from, $to),
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
                ['From' => $from->toDateString(), 'To' => $to->toDateString(), 'Doctor' => $user->name],
            );
        }

        return $this->exporter->csvFromColumns("{$def['name']}.csv", $rows, $def['columns']);
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
