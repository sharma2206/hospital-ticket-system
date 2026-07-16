<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,first_name,last_name,email')->orderByDesc('created_at');

        if ($request->filled('user_id'))  $query->where('user_id', $request->user_id);
        if ($request->filled('action'))   $query->where('action', $request->action);
        if ($request->filled('module'))   $query->where('module', $request->module);
        if ($request->filled('from_date')) $query->whereDate('created_at', '>=', $request->from_date);
        if ($request->filled('to_date'))   $query->whereDate('created_at', '<=', $request->to_date);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('description', 'like', "%{$s}%")
                  ->orWhere('ip_address', 'like', "%{$s}%")
            );
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $logs = $query->paginate($perPage);

        return response()->json([
            'data' => $logs->items(),
            'pagination' => [
                'total'        => $logs->total(),
                'per_page'     => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
            ],
        ]);
    }

    public function actions(): JsonResponse
    {
        $actions = AuditLog::distinct()->pluck('action')->sort()->values();
        return response()->json(['data' => $actions]);
    }

    public function modules(): JsonResponse
    {
        $modules = AuditLog::distinct()->whereNotNull('module')->pluck('module')->sort()->values();
        return response()->json(['data' => $modules]);
    }
}
