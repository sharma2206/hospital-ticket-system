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
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\KnowledgeArticleController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\KarexpertTicketController;

// ─── Public Routes ──────────────────────────────────────────────────────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// ─── Protected Routes ───────────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {

    // Auth
    Route::post('/auth/logout',  [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/me',       [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Tickets ────────────────────────────────────────────────────
    Route::prefix('tickets')->group(function () {
        Route::get('/',                    [TicketController::class, 'index']);
        Route::post('/',                   [TicketController::class, 'store']);
        Route::get('/{ticket}',            [TicketController::class, 'show']);
        Route::put('/{ticket}',            [TicketController::class, 'update']);
        Route::patch('/{ticket}',          [TicketController::class, 'update']);
        Route::put('/{ticket}/status',     [TicketController::class, 'updateStatus']);
        Route::post('/{ticket}/assign',    [TicketController::class, 'assign']);
        Route::post('/{ticket}/escalate',  [TicketController::class, 'escalate']);
        Route::post('/{ticket}/reopen',    [TicketController::class, 'reopen']);
        Route::post('/{ticket}/clone',     [TicketController::class, 'clone']);
        Route::post('/{ticket}/merge',     [TicketController::class, 'merge']);
        Route::post('/{ticket}/watchers',  [TicketController::class, 'addWatcher']);
        Route::delete('/{ticket}/watchers',[TicketController::class, 'removeWatcher']);
        Route::post('/{ticket}/pause-sla', [TicketController::class, 'pauseSLA']);
        Route::post('/{ticket}/resume-sla',[TicketController::class, 'resumeSLA']);
        Route::post('/{ticket}/attachments',          [TicketController::class, 'uploadAttachment']);
        Route::delete('/{ticket}/attachments/{attachment}', [TicketController::class, 'deleteAttachment']);
        Route::delete('/{ticket}',         [TicketController::class, 'destroy']);
    });

    // ── Comments ───────────────────────────────────────────────────
    Route::get('/tickets/{ticket}/comments',  [CommentController::class, 'index']);
    Route::post('/tickets/{ticket}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}',         [CommentController::class, 'update']);
    Route::delete('/comments/{comment}',      [CommentController::class, 'destroy']);

    // ── Lookup / Reference Data ────────────────────────────────────
    Route::get('/categories',      [CategoryController::class, 'index']);
    Route::get('/sub-categories',  function () {
        $catId = request('category_id');
        $query = \App\Models\SubCategory::active()->orderBy('sort_order');
        if ($catId) $query->where('category_id', $catId);
        return response()->json(['data' => $query->get()]);
    });
    Route::get('/priorities',      [PriorityController::class, 'index']);
    Route::get('/ticket-statuses', fn() => response()->json(['data' => \App\Models\TicketStatus::orderBy('order')->get()]));
    Route::get('/vendors',         fn() => response()->json(['data' => \App\Models\Vendor::active()->orderBy('name')->get()]));
    Route::get('/sla-rules',       fn() => response()->json(['data' => \App\Models\SlaRule::active()->with('priority')->get()]));

    // ── Departments ────────────────────────────────────────────────
    Route::get('/departments',          [DepartmentController::class, 'index']);
    Route::post('/departments',         [DepartmentController::class, 'store']);
    Route::put('/departments/{department}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);

    // ── Branches ───────────────────────────────────────────────────
    Route::get('/branches',          [BranchController::class, 'index']);
    Route::post('/branches',         [BranchController::class, 'store']);
    Route::get('/branches/{branch}', [BranchController::class, 'show']);
    Route::put('/branches/{branch}', [BranchController::class, 'update']);
    Route::delete('/branches/{branch}', [BranchController::class, 'destroy']);

    // ── Users ──────────────────────────────────────────────────────
    Route::get('/it-staff',           [UserController::class, 'itStaff']);
    Route::get('/users',              [UserController::class, 'index']);
    Route::post('/users',             [UserController::class, 'store']);
    Route::get('/users/{user}',       [UserController::class, 'show']);
    Route::put('/users/{user}',       [UserController::class, 'update']);
    Route::delete('/users/{user}',    [UserController::class, 'destroy']);
    Route::post('/users/{user}/change-password', [UserController::class, 'changePassword']);
    Route::post('/users/{user}/toggle-active',   [UserController::class, 'toggleActive']);
    Route::post('/users/{user}/roles',            [UserController::class, 'assignRole']);
    Route::get('/roles',              [UserController::class, 'roles']);

    // ── Assets ─────────────────────────────────────────────────────
    Route::get('/assets',                   [AssetController::class, 'index']);
    Route::post('/assets',                  [AssetController::class, 'store']);
    Route::get('/assets/categories',        [AssetController::class, 'categories']);
    Route::get('/assets/{asset}',           [AssetController::class, 'show']);
    Route::put('/assets/{asset}',           [AssetController::class, 'update']);
    Route::delete('/assets/{asset}',        [AssetController::class, 'destroy']);
    Route::get('/assets/{asset}/history',   [AssetController::class, 'history']);

    // ── Knowledge Base ─────────────────────────────────────────────
    Route::get('/knowledge',                              [KnowledgeArticleController::class, 'index']);
    Route::post('/knowledge',                             [KnowledgeArticleController::class, 'store']);
    Route::get('/knowledge/{knowledgeArticle}',           [KnowledgeArticleController::class, 'show']);
    Route::put('/knowledge/{knowledgeArticle}',           [KnowledgeArticleController::class, 'update']);
    Route::delete('/knowledge/{knowledgeArticle}',        [KnowledgeArticleController::class, 'destroy']);
    Route::post('/knowledge/{knowledgeArticle}/publish',  [KnowledgeArticleController::class, 'publish']);
    Route::post('/knowledge/{knowledgeArticle}/unpublish',[KnowledgeArticleController::class, 'unpublish']);
    Route::post('/knowledge/{knowledgeArticle}/link',     [KnowledgeArticleController::class, 'linkToTicket']);

    // ── Notifications ──────────────────────────────────────────────
    Route::get('/notifications',                         [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',            [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',          [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read',    [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}',       [NotificationController::class, 'destroy']);

    // ── Reports ────────────────────────────────────────────────────
    Route::prefix('reports')->group(function () {
        Route::get('/tickets',      [ReportController::class, 'tickets']);
        Route::get('/sla',          [ReportController::class, 'slaCompliance']);
        Route::get('/technician',   [ReportController::class, 'technicianPerformance']);
        Route::get('/satisfaction', [ReportController::class, 'satisfaction']);
        Route::get('/assets',       [ReportController::class, 'assets']);
    });

    // ── Audit Log ──────────────────────────────────────────────────
    Route::get('/audit-logs',          [AuditLogController::class, 'index']);
    Route::get('/audit-logs/actions',  [AuditLogController::class, 'actions']);
    Route::get('/audit-logs/modules',  [AuditLogController::class, 'modules']);

    // ── Settings ───────────────────────────────────────────────────
    Route::get('/settings',              [SettingController::class, 'index']);
    Route::post('/settings',             [SettingController::class, 'update']);
    Route::put('/settings/{key}',        [SettingController::class, 'updateSingle']);
    Route::get('/settings/groups',       [SettingController::class, 'groups']);

    // ── Global Search ──────────────────────────────────────────────
    Route::get('/search', function () {
        $q = request('q', '');
        if (strlen($q) < 2) return response()->json(['data' => []]);

        $tickets = \App\Models\Ticket::internal()
            ->where(fn($query) => $query->where('title', 'like', "%{$q}%")->orWhere('ticket_number', 'like', "%{$q}%"))
            ->limit(5)->get(['id', 'ticket_number', 'title', 'status_id']);

        $assets = \App\Models\Asset::where(fn($query) =>
            $query->where('name', 'like', "%{$q}%")->orWhere('asset_code', 'like', "%{$q}%")
        )->limit(5)->get(['id', 'asset_code', 'name', 'status']);

        $articles = \App\Models\KnowledgeArticle::published()
            ->where(fn($query) => $query->where('title', 'like', "%{$q}%"))
            ->limit(5)->get(['id', 'title', 'slug', 'status']);

        $users = \App\Models\User::where(fn($query) =>
            $query->where('first_name', 'like', "%{$q}%")
                  ->orWhere('last_name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('employee_id', 'like', "%{$q}%")
        )->limit(5)->get(['id', 'first_name', 'last_name', 'email', 'employee_id']);

        return response()->json([
            'data' => [
                'tickets'  => $tickets,
                'assets'   => $assets,
                'articles' => $articles,
                'users'    => $users,
            ],
        ]);
    });

    // ── KareXpert ──────────────────────────────────────────────────
    Route::prefix('karexpert')->group(function () {
        Route::get('/dashboard', [KarexpertTicketController::class, 'dashboard']);
        Route::get('/tickets',   [KarexpertTicketController::class, 'index']);
        Route::post('/tickets',  [KarexpertTicketController::class, 'store']);
        Route::get('/tickets/{ticket}',  [KarexpertTicketController::class, 'show']);
        Route::put('/tickets/{ticket}',  [KarexpertTicketController::class, 'update']);
    });

    Route::get('/karexpert-statuses', fn() => response()->json([
        'data' => \App\Models\TicketStatus::whereIn('name', [
            'raised', 'acknowledged', 'karexpert_working', 'awaiting_deployment', 'deployed'
        ])->orderBy('order')->get()
    ]));

    Route::get('/karexpert-modules', fn() => response()->json([
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
    ]));

    Route::get('/karexpert-categories', fn() => response()->json([
        'data' => \App\Models\Category::whereIn('code', ['BUG', 'FEAT', 'CFG', 'DATA', 'TRN'])->get()
    ]));
});
