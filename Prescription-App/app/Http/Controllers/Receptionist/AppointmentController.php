<?php

namespace App\Http\Controllers\Receptionist;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\User;
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

        $appointments = Appointment::query()
            ->with(['patient:id,patient_uid,name,phone,gender', 'doctor:id,name', 'chamber:id,name'])
            ->when($request->date_from, fn ($q, $d) => $q->where('appointment_date', '>=', $d))
            ->when($request->date_to, fn ($q, $d) => $q->where('appointment_date', '<=', $d))
            ->when($request->doctor_id, fn ($q, $id) => $q->where('doctor_id', $id))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->orderByDesc('appointment_date')
            ->orderBy('serial_number')
            ->paginate(25)
            ->withQueryString();

        $doctors = User::query()
            ->where('role', 'doctor')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Receptionist/Appointments/Index', [
            'appointments' => $appointments,
            'doctors' => $doctors,
            'filters' => $request->only(['date_from', 'date_to', 'doctor_id', 'status', 'type']),
        ]);
    }

    public function store(StoreAppointmentRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();
        $data['created_by'] = $user->id;

        if (!array_key_exists('fee_amount', $data) || $data['fee_amount'] === null) {
            $data['fee_amount'] = $this->queue->consultationFee($data['doctor_id'], $user->hospital_id, $data['type']);
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
