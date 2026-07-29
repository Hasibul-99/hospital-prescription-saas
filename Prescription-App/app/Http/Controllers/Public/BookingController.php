<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookingRequest;
use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\DoctorProfile;
use App\Models\Patient;
use App\Services\OtpService;
use App\Services\SerialQueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly SerialQueueService $queue,
    ) {}

    /**
     * Public directory: doctors who have opted in via `is_public_profile`.
     */
    public function index(): Response
    {
        $doctors = DoctorProfile::query()
            ->where('is_public_profile', true)
            ->with(['user:id,name', 'hospital:id,name,logo'])
            ->orderBy('created_at')
            ->paginate(20)
            ->through(fn (DoctorProfile $p) => [
                'slug'          => $p->public_slug,
                'name'          => $p->user?->name,
                'degrees'       => $p->degrees,
                'specialization' => $p->specialization,
                'designation'   => $p->designation,
                'hospital'      => $p->hospital?->name,
                'fee'           => (float) $p->consultation_fee,
            ]);

        return Inertia::render('Public/Booking/Index', [
            'doctors' => $doctors,
        ]);
    }

    /**
     * Public doctor page with chambers + schedule.
     */
    public function showDoctor(DoctorProfile $doctor): Response|RedirectResponse
    {
        if (! $doctor->is_public_profile) {
            return redirect()->route('public.book.index');
        }

        $doctor->load(['user:id,name', 'hospital:id,name,address,phone']);

        $chambers = Chamber::query()
            ->where('doctor_id', $doctor->user_id)
            ->where('is_active', true)
            ->get(['id', 'name', 'room_number', 'floor', 'building', 'schedule', 'daily_slot_cap']);

        return Inertia::render('Public/Booking/Doctor', [
            'doctor' => [
                'slug'           => $doctor->public_slug,
                'name'           => $doctor->user?->name,
                'degrees'        => $doctor->degrees,
                'specialization' => $doctor->specialization,
                'designation'    => $doctor->designation,
                'bmdc'           => $doctor->bmdc_number,
                'hospital'       => $doctor->hospital?->only('id', 'name', 'address', 'phone'),
                'fee'            => (float) $doctor->consultation_fee,
            ],
            'chambers' => $chambers,
        ]);
    }

    /**
     * Slot availability lookup — returns how many bookings remain for the
     * requested chamber on the requested date.
     */
    public function slots(Request $request, DoctorProfile $doctor): JsonResponse
    {
        $data = $request->validate([
            'date'       => ['required', 'date', 'after_or_equal:today'],
            'chamber_id' => ['required', 'integer', 'exists:chambers,id'],
        ]);

        if (! $doctor->is_public_profile) {
            return response()->json(['message' => 'Not available'], 404);
        }

        $chamber = Chamber::where('doctor_id', $doctor->user_id)
            ->where('id', $data['chamber_id'])
            ->firstOrFail();

        $cap = $chamber->daily_slot_cap ?? 20;
        $existing = Appointment::query()
            ->where('doctor_id', $doctor->user_id)
            ->where('chamber_id', $chamber->id)
            ->where('appointment_date', $data['date'])
            ->whereIn('status', ['waiting', 'in_progress', 'completed'])
            ->count();

        $isHoliday = (bool) $this->queue->isHoliday($doctor->hospital_id, $data['date']);

        return response()->json([
            'cap'        => $cap,
            'taken'      => $existing,
            'remaining'  => max(0, $cap - $existing),
            'is_holiday' => $isHoliday,
        ]);
    }

    /**
     * Take booking details, dispatch an OTP to the patient's email.
     * The booking payload is stashed in the session; POST /book/verify
     * consumes it after the code is validated.
     */
    public function store(BookingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $doctor = DoctorProfile::where('public_slug', $data['doctor_slug'])
            ->where('is_public_profile', true)
            ->firstOrFail();

        $chamber = Chamber::where('doctor_id', $doctor->user_id)
            ->where('id', $data['chamber_id'])
            ->firstOrFail();

        // Capacity guard (same rule as slots() so a stale UI can't over-book).
        $cap = $chamber->daily_slot_cap ?? 20;
        $existing = Appointment::query()
            ->where('doctor_id', $doctor->user_id)
            ->where('chamber_id', $chamber->id)
            ->where('appointment_date', $data['date'])
            ->whereIn('status', ['waiting', 'in_progress', 'completed'])
            ->count();

        if ($existing >= $cap) {
            throw ValidationException::withMessages([
                'date' => ['This date is fully booked. Please pick another.'],
            ]);
        }

        $this->otp->issueAndSend($data['patient_email'], OtpService::PURPOSE_BOOKING);

        session()->put('booking.pending', [
            'doctor_id'    => $doctor->user_id,
            'hospital_id'  => $doctor->hospital_id,
            'chamber_id'   => $chamber->id,
            'date'         => $data['date'],
            'name'         => $data['patient_name'],
            'phone'        => $data['patient_phone'],
            'email'        => $data['patient_email'],
        ]);

        return redirect()->route('public.book.verify.show');
    }

    public function verifyShow(): Response|RedirectResponse
    {
        $pending = session('booking.pending');
        if (! $pending) {
            return redirect()->route('public.book.index');
        }

        return Inertia::render('Public/Booking/Verify', [
            'email'      => $pending['email'],
            'otp_length' => OtpService::OTP_LENGTH,
        ]);
    }

    /**
     * Verify OTP and create the guest patient + appointment atomically.
     * Serial number is assigned by AppointmentObserver's DB-locked transaction.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $pending = session('booking.pending');
        if (! $pending) {
            return redirect()->route('public.book.index');
        }

        $this->otp->verify($pending['email'], $request->code, OtpService::PURPOSE_BOOKING);

        $appt = DB::transaction(function () use ($pending) {
            $patient = Patient::firstOrCreate(
                ['hospital_id' => $pending['hospital_id'], 'phone' => $pending['phone']],
                [
                    'name'  => $pending['name'],
                    'email' => $pending['email'],
                ],
            );

            $fee = $this->queue->consultationFee($pending['doctor_id'], $pending['hospital_id'], 'new_visit');

            return Appointment::create([
                'hospital_id'      => $pending['hospital_id'],
                'doctor_id'        => $pending['doctor_id'],
                'patient_id'       => $patient->id,
                'chamber_id'       => $pending['chamber_id'],
                'appointment_date' => $pending['date'],
                'type'             => 'new_visit',
                'status'           => 'waiting',
                'fee_amount'       => $fee,
                'fee_paid'         => false,
                'notes'            => 'Booked via public link',
            ]);
        });

        session()->forget('booking.pending');
        session()->put('booking.confirmed_id', $appt->id);

        return redirect()->route('public.book.confirmed');
    }

    public function confirmed(): Response|RedirectResponse
    {
        $id = session('booking.confirmed_id');
        if (! $id) {
            return redirect()->route('public.book.index');
        }

        $appt = Appointment::with(['patient:id,patient_uid,name,phone', 'doctor:id,name', 'chamber:id,name,room_number', 'hospital:id,name,address'])
            ->find($id);

        if (! $appt) {
            return redirect()->route('public.book.index');
        }

        return Inertia::render('Public/Booking/Confirmed', [
            'appointment' => [
                'id'            => $appt->id,
                'date'          => $appt->appointment_date->toDateString(),
                'serial_number' => $appt->serial_number,
                'fee_amount'    => (float) $appt->fee_amount,
                'patient'       => $appt->patient?->only('patient_uid', 'name', 'phone'),
                'doctor'        => $appt->doctor?->only('name'),
                'chamber'       => $appt->chamber?->only('name', 'room_number'),
                'hospital'      => $appt->hospital?->only('name', 'address'),
            ],
        ]);
    }
}
