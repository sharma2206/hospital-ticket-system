<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\PriorityController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\KarexpertTicketController;

// Authentication Routes (Public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:api')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Tickets
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}', [TicketController::class, 'show']);
    Route::put('/tickets/{ticket}', [TicketController::class, 'update']);
    Route::put('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/escalate', [TicketController::class, 'escalate']);
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy']);

    // Comments
    Route::get('/tickets/{ticket}/comments', [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);

    // Priorities
    Route::get('/priorities', [PriorityController::class, 'index']);

    // Departments
    Route::get('/departments', [DepartmentController::class, 'index']);

    // Users
    Route::get('/it-staff', [UserController::class, 'itStaff']);
    Route::get('/users', [UserController::class, 'index']);

    // Ticket Statuses (for dropdowns)
    Route::get('/ticket-statuses', function () {
        return response()->json(['data' => \App\Models\TicketStatus::orderBy('order')->get()]);
    });

    // KareXpert Tickets (IT Staff / Admin)
    Route::prefix('karexpert')->group(function () {
        Route::get('/dashboard', [KarexpertTicketController::class, 'dashboard']);
        Route::get('/tickets', [KarexpertTicketController::class, 'index']);
        Route::post('/tickets', [KarexpertTicketController::class, 'store']);
        Route::get('/tickets/{ticket}', [KarexpertTicketController::class, 'show']);
        Route::put('/tickets/{ticket}', [KarexpertTicketController::class, 'update']);
    });

    // KareXpert-specific statuses and modules
    Route::get('/karexpert-statuses', function () {
        return response()->json([
            'data' => \App\Models\TicketStatus::whereIn('name', [
                'raised', 'acknowledged', 'karexpert_working', 'awaiting_deployment', 'deployed'
            ])->orderBy('order')->get()
        ]);
    });

    Route::get('/karexpert-modules', function () {
        return response()->json([
            'data' => [
                ['value' => 'OPD', 'label' => 'OPD'],
                ['value' => 'IPD', 'label' => 'IPD'],
                ['value' => 'Billing', 'label' => 'Billing'],
                ['value' => 'Pharmacy', 'label' => 'Pharmacy'],
                ['value' => 'Laboratory', 'label' => 'Laboratory'],
                ['value' => 'Radiology', 'label' => 'Radiology'],
                ['value' => 'Emergency', 'label' => 'Emergency'],
                ['value' => 'OT', 'label' => 'Operation Theatre'],
                ['value' => 'Reports', 'label' => 'Reports'],
                ['value' => 'MIS', 'label' => 'MIS'],
                ['value' => 'Admin', 'label' => 'Admin Module'],
                ['value' => 'Other', 'label' => 'Other'],
            ]
        ]);
    });

    Route::get('/karexpert-categories', function () {
        return response()->json([
            'data' => \App\Models\Category::whereIn('code', ['BUG', 'FEAT', 'CFG', 'DATA', 'TRN'])->get()
        ]);
    });
});
