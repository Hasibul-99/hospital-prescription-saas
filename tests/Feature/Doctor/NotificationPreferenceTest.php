<?php

namespace Tests\Feature\Doctor;

use App\Jobs\SendFollowUpReminderJob;
use App\Mail\FollowUpReminderMail;
use App\Models\DoctorProfile;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationPreferenceTest extends TestCase
{
    use RefreshDatabase;

    private int $hospitalId;
    private User $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->hospitalId = DB::table('hospitals')->insertGetId([
            'name'                => 'Hospital A',
            'slug'                => 'hospital-a',
            'subscription_status' => 'active',
            'is_active'           => true,
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $this->doctor = User::factory()->create([
            'role'        => 'doctor',
            'hospital_id' => $this->hospitalId,
            'email'       => 'doctor@example.com',
            'is_active'   => true,
        ]);
    }

    private function prescriptionWithFollowUp(): Prescription
    {
        $this->actingAs($this->doctor);

        $patient = Patient::create([
            'name'   => 'Rahim',
            'gender' => 'male',
            'phone'  => '01700000001',
            'email'  => 'patient@example.com',
        ]);

        return Prescription::create([
            'doctor_id'      => $this->doctor->id,
            'patient_id'     => $patient->id,
            'date'           => now()->toDateString(),
            'follow_up_date' => now()->addDay()->toDateString(),
            'status'         => 'finalized',
        ]);
    }

    private function setPrefs(bool $followup, bool $email): void
    {
        DoctorProfile::updateOrCreate(
            ['user_id' => $this->doctor->id],
            ['hospital_id' => $this->hospitalId, 'notify_followup_reminders' => $followup, 'notify_email' => $email],
        );
    }

    public function test_reminder_sent_by_default_when_no_profile(): void
    {
        Mail::fake();
        $rx = $this->prescriptionWithFollowUp();

        SendFollowUpReminderJob::dispatchSync($rx->id);

        Mail::assertSent(FollowUpReminderMail::class);
    }

    public function test_reminder_suppressed_when_followup_disabled(): void
    {
        Mail::fake();
        $rx = $this->prescriptionWithFollowUp();
        $this->setPrefs(followup: false, email: false);

        SendFollowUpReminderJob::dispatchSync($rx->id);

        Mail::assertNotSent(FollowUpReminderMail::class);
    }

    public function test_reminder_sent_when_followup_enabled_email_off_and_no_doctor_cc(): void
    {
        Mail::fake();
        $rx = $this->prescriptionWithFollowUp();
        $this->setPrefs(followup: true, email: false);

        SendFollowUpReminderJob::dispatchSync($rx->id);

        Mail::assertSent(FollowUpReminderMail::class, function (FollowUpReminderMail $mail) {
            return $mail->hasTo('patient@example.com') && ! $mail->hasCc('doctor@example.com');
        });
    }

    public function test_doctor_is_cced_when_email_notifications_enabled(): void
    {
        Mail::fake();
        $rx = $this->prescriptionWithFollowUp();
        $this->setPrefs(followup: true, email: true);

        SendFollowUpReminderJob::dispatchSync($rx->id);

        Mail::assertSent(FollowUpReminderMail::class, function (FollowUpReminderMail $mail) {
            return $mail->hasTo('patient@example.com') && $mail->hasCc('doctor@example.com');
        });
    }
}
