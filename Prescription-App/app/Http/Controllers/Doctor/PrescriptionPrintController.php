<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Models\Hospital;
use App\Models\Prescription;
use App\Services\PrescriptionPdfService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrescriptionPrintController extends Controller
{
    public function __construct(private readonly PrescriptionPdfService $pdfService)
    {
    }

    public function preview(Request $request, Prescription $prescription)
    {
        $this->authorize('view', $prescription);

        $prescription->load(['patient', 'doctor', 'complaints', 'examinations', 'sections', 'medicines']);

        $profile = DoctorProfile::query()
            ->where('user_id', $prescription->doctor_id)
            ->where('hospital_id', $prescription->hospital_id)
            ->first();

        $hospital = Hospital::find($prescription->hospital_id);

        return Inertia::render('Doctor/Prescriptions/Preview', [
            'prescription' => $prescription,
            'doctor_profile' => $profile,
            'hospital' => $hospital,
        ]);
    }

    public function pdf(Request $request, Prescription $prescription)
    {
        $this->authorize('view', $prescription);

        $pdf = $this->pdfService->render($prescription);
        $this->recordPrint($prescription);

        return $pdf->stream($this->pdfService->filename($prescription));
    }

    public function download(Request $request, Prescription $prescription)
    {
        $this->authorize('view', $prescription);

        $pdf = $this->pdfService->render($prescription);
        $this->recordPrint($prescription);

        return $pdf->download($this->pdfService->filename($prescription));
    }

    public function markPrinted(Request $request, Prescription $prescription)
    {
        $this->authorize('view', $prescription);
        $this->recordPrint($prescription);

        return response()->json([
            'status' => $prescription->fresh()->status,
            'printed_at' => $prescription->fresh()->printed_at,
            'printed_count' => $prescription->fresh()->printed_count,
        ]);
    }

    public function bulkPdf(Request $request)
    {
        $ids = (array) $request->input('ids', []);
        if (empty($ids)) {
            abort(422, 'No prescription IDs provided.');
        }

        $prescriptions = Prescription::query()
            ->whereIn('id', $ids)
            ->with(['patient', 'doctor', 'complaints', 'examinations', 'sections', 'medicines'])
            ->get();

        foreach ($prescriptions as $rx) {
            $this->authorize('view', $rx);
        }

        if ($prescriptions->isEmpty()) {
            abort(404, 'No prescriptions found.');
        }

        if ($prescriptions->count() === 1) {
            return $this->pdf($request, $prescriptions->first());
        }

        $first = $prescriptions->first();
        $profile = DoctorProfile::query()
            ->where('user_id', $first->doctor_id)
            ->where('hospital_id', $first->hospital_id)
            ->first();
        $hospital = Hospital::find($first->hospital_id);

        $paper = $profile?->print_paper_size === 'Letter' ? 'letter' : 'a4';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('prescriptions.print-bulk', [
            'items' => $prescriptions->map(fn ($rx) => [
                'rx' => $rx,
                'doctor' => $rx->doctor,
                'profile' => DoctorProfile::query()
                    ->where('user_id', $rx->doctor_id)
                    ->where('hospital_id', $rx->hospital_id)
                    ->first(),
                'hospital' => Hospital::find($rx->hospital_id),
                'patient' => $rx->patient,
            ]),
        ])->setPaper($paper, 'portrait');

        foreach ($prescriptions as $rx) {
            $this->recordPrint($rx);
        }

        return $pdf->stream('bulk-prescriptions-'.now()->format('Ymd-His').'.pdf');
    }

    protected function recordPrint(Prescription $prescription): void
    {
        $prescription->forceFill([
            'status' => 'printed',
            'printed_at' => now(),
            'printed_count' => ($prescription->printed_count ?? 0) + 1,
        ])->save();
    }
}
