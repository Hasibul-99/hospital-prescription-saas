<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Services\SerialQueueService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SerialQueueController extends Controller
{
    public function __construct(private readonly SerialQueueService $queue)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Appointment::class);

        $user = $request->user();
        $date = $request->input('date', now()->toDateString());

        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $doctorId = $request->input('doctor_id') ? (int) $request->input('doctor_id') : $doctors->first()?->id;
        $chamberId = $request->input('chamber_id') ? (int) $request->input('chamber_id') : null;

        $doctor = $doctorId ? User::find($doctorId) : null;

        return Inertia::render('Receptionist/Queue/Index', [
            'date' => $date,
            'doctor_id' => $doctorId,
            'chamber_id' => $chamberId,
            'doctors' => $doctors,
            'chambers' => $doctor ? $this->queue->chambersForDoctor($doctor->id) : [],
            'queue' => $doctor ? $this->queue->queueFor($doctor, $date, $chamberId) : [],
            'stats' => $doctor ? $this->queue->statsFor($doctor, $date, $chamberId) : null,
            'on_break' => $doctor ? $this->queue->isOnBreak($doctor->id, $date, $chamberId) : false,
            'holiday' => $this->queue->isHoliday($user->hospital_id, $date),
        ]);
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $data = $request->validate([
            'status' => 'required|in:waiting,in_progress,completed,absent,cancelled',
        ]);

        $appointment->update(['status' => $data['status']]);

        return back()->with('success', 'Status updated.');
    }
}
