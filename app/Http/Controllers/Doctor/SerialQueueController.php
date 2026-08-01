<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
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
        $chamberId = $request->input('chamber_id') ? (int) $request->input('chamber_id') : null;

        return Inertia::render('Doctor/Queue/Index', [
            'date' => $date,
            'chamber_id' => $chamberId,
            'chambers' => $this->queue->chambersForDoctor($user->id),
            'queue' => $this->queue->queueFor($user, $date, $chamberId),
            'stats' => $this->queue->statsFor($user, $date, $chamberId),
            'on_break' => $this->queue->isOnBreak($user->id, $date, $chamberId),
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

    public function next(Request $request)
    {
        $user = $request->user();
        $date = $request->input('date', now()->toDateString());
        $chamberId = $request->input('chamber_id') ? (int) $request->input('chamber_id') : null;

        $next = $this->queue->advance($user, $date, $chamberId);

        return back()->with('success', $next ? "Serial #{$next->serial_number} is now in progress." : 'Queue complete.');
    }

    public function toggleBreak(Request $request)
    {
        $user = $request->user();
        $date = $request->input('date', now()->toDateString());
        $chamberId = $request->input('chamber_id') ? (int) $request->input('chamber_id') : null;
        $on = (bool) $request->input('on', false);

        $this->queue->setBreak($user->id, $date, $chamberId, $on);

        return back()->with('success', $on ? 'On break.' : 'Break ended.');
    }
}
