<?php

use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Public\BookingController;
use App\Http\Controllers\Public\LandingController;
use App\Http\Controllers\Public\PrescriptionVerifyController;
use Illuminate\Support\Facades\Route;

// Landing page. Its pricing section is driven by the `plans` table, so the
// super admin changes prices without a deploy.
Route::get('/', [LandingController::class, 'index'])->name('landing');

Route::get('/dashboard', function () {
    $user = auth()->user();
    if ($user) {
        return redirect()->route(match ($user->role) {
            'super_admin' => 'admin.dashboard',
            'hospital_admin' => 'hospital.dashboard',
            'doctor' => 'doctor.dashboard',
            'receptionist' => 'receptionist.dashboard',
            default => 'login',
        });
    }
    return redirect()->route('login');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');

// Public prescription verify — unauthenticated, minimised payload.
// Reachable via the QR code printed on every prescription.
Route::get('/rx/verify/{shareToken}', [PrescriptionVerifyController::class, 'show'])
    ->name('public.rx.verify');

// SEO-friendly aliases for the public doctor directory (same content as /book).
Route::redirect('/doctors', '/book');
Route::get('/doctors/{doctor}', fn (string $doctor) => redirect("/book/{$doctor}"))
    ->name('public.doctors.show');

// Public online booking. No auth. Rate-limited via named limiters where write.
Route::prefix('book')->name('public.book.')->group(function () {
    Route::get('/', [BookingController::class, 'index'])->name('index');
    Route::get('/verify', [BookingController::class, 'verifyShow'])->name('verify.show');
    Route::post('/verify', [BookingController::class, 'verify'])
        ->middleware('throttle:10,1')
        ->name('verify');
    Route::get('/confirmed', [BookingController::class, 'confirmed'])->name('confirmed');
    Route::get('/{doctor}/slots', [BookingController::class, 'slots'])->name('slots');
    Route::get('/{doctor}', [BookingController::class, 'showDoctor'])->name('doctor');
    Route::post('/', [BookingController::class, 'store'])
        ->middleware('throttle:otp-email-send')
        ->name('store');
});

require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
require __DIR__.'/hospital.php';
require __DIR__.'/doctor.php';
require __DIR__.'/receptionist.php';
require __DIR__.'/api.php';
