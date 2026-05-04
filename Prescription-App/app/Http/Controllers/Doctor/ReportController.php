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
        $report = (string) $request->input('report', 'patient_count');
        [$bucket, $from, $to] = $this->parseFilters($request);
        $user = $request->user();

        return match ($report) {
            'patient_count' => $this->exporter->csvFromColumns(
                "patient-count-{$bucket}-{$from->toDateString()}.csv",
                $this->reports->patientCount($user->id, $user->hospital_id, $bucket, $from, $to),
                ['bucket' => 'Bucket', 'count' => 'Patients'],
            ),
            'disease_breakdown' => $this->exporter->csvFromColumns(
                "disease-breakdown-{$from->toDateString()}.csv",
                $this->reports->diseaseBreakdown($user->id, $user->hospital_id, $from, $to),
                ['label' => 'Diagnosis', 'value' => 'Count'],
            ),
            'top_medicines' => $this->exporter->csvFromColumns(
                "top-medicines-{$from->toDateString()}.csv",
                $this->reports->topMedicines($user->id, $user->hospital_id, $from, $to),
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
