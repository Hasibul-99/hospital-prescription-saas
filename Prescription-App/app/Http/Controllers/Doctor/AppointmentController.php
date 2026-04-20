<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Patient;
use App\Services\SerialQueueService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function __construct(private readonly SerialQueueService $queue)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Appointment::class);

        $user = $request->user();

        $appointments = Appointment::query()
            ->with(['patient:id,patient_uid,name,phone,gender', 'chamber:id,name'])
            ->where('doctor_id', $user->id)
            ->when($request->date_from, fn ($q, $d) => $q->where('appointment_date', '>=', $d))
            ->when($request->date_to, fn ($q, $d) => $q->where('appointment_date', '<=', $d))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->when($request->chamber_id, fn ($q, $c) => $q->where('chamber_id', $c))
            ->orderByDesc('appointment_date')
            ->orderBy('serial_number')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Doctor/Appointments/Index', [
            'appointments' => $appointments,
            'filters' => $request->only(['date_from', 'date_to', 'status', 'type', 'chamber_id']),
            'chambers' => $this->queue->chambersForDoctor($user->id),
        ]);
    }

    public function store(StoreAppointmentRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();
        $data['doctor_id'] = $user->id;
        $data['created_by'] = $user->id;

        if (!array_key_exists('fee_amount', $data) || $data['fee_amount'] === null) {
            $data['fee_amount'] = $this->queue->consultationFee($user->id, $user->hospital_id, $data['type']);
        }

        $holiday = $this->queue->isHoliday($user->hospital_id, $data['appointment_date']);
        if ($holiday) {
            return back()->with('error', "Cannot book — holiday: {$holiday->title}");
        }

        $appointment = Appointment::create($data);

        return back()->with('success', "Appointment #{$appointment->serial_number} booked.");
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        $appointment->update($request->validated());

        return back()->with('success', 'Appointment updated.');
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);
        $appointment->update(['status' => 'cancelled']);
        $appointment->delete();

        return back()->with('success', 'Appointment cancelled.');
    }
}
