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
});
