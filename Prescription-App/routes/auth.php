<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\OtpVerificationController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:otp-email-send');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email')
        ->middleware('throttle:otp-email-send');

    // OTP-based password reset
    Route::get('reset-password', [NewPasswordController::class, 'create'])
        ->name('password.otp');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store')
        ->middleware('throttle:10,1');

    // OTP verify (registration)
    Route::get('verify-otp', [OtpVerificationController::class, 'show'])
        ->name('verification.otp');

    Route::post('verify-otp', [OtpVerificationController::class, 'verify'])
        ->name('verification.otp.verify')
        ->middleware('throttle:10,1');

    Route::post('resend-otp', [OtpVerificationController::class, 'resend'])
        ->name('verification.otp.resend')
        ->middleware('throttle:otp-email-send');
});

Route::middleware('auth')->group(function () {
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
