<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceSchedule;
use App\Models\Asset;
use App\Models\AssetHistory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MaintenanceScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MaintenanceSchedule::with([
            'asset:id,asset_code,name,category,location,status',
            'assignedUser:id,first_name,last_name,email',
            'completedByUser:id,first_name,last_name',
            'department:id,name',
        ]);

        if ($request->filled('asset_id'))      $query->where('asset_id', $request->asset_id);
        if ($request->filled('status'))        $query->where('status', $request->status);
        if ($request->filled('type'))          $query->where('type', $request->type);
        if ($request->filled('department_id')) $query->where('department_id', $request->department_id);
        if ($request->filled('assigned_to'))   $query->where('assigned_to', $request->assigned_to);

        if ($request->boolean('overdue')) {
            $query->where('status', '!=', 'completed')
                  ->whereDate('next_due_date', '<', now());
        }

        if ($request->boolean('due_soon')) {
            $query->where('status', '!=', 'completed')
                  ->whereBetween('next_due_date', [now(), now()->addDays(14)]);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhereHas('asset', fn($aq) => $aq->where('name', 'like', "%{$s}%")->orWhere('asset_code', 'like', "%{$s}%"));
            });
        }

        $allowed = ['next_due_date', 'last_done_date', 'title', 'status', 'created_at'];
        $sortBy = in_array($request->get('sort_by'), $allowed) ? $request->get('sort_by') : 'next_due_date';
        $sortOrder = $request->get('sort_order', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->get('per_page', 15), 100);
        $schedules = $query->paginate($perPage);

        return response()->json([
            'data'       => $schedules->items(),
            'pagination' => [
                'total'        => $schedules->total(),
                'per_page'     => $schedules->perPage(),
                'current_page' => $schedules->currentPage(),
                'last_page'    => $schedules->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // Support aliases
        if (!$request->has('type') && $request->has('maintenance_type')) {
            $request->merge(['type' => $request->maintenance_type]);
        }
        if (!$request->has('next_due_date') && $request->has('scheduled_date')) {
            $request->merge(['next_due_date' => $request->scheduled_date]);
        }

        $validated = $request->validate([
            'asset_id'          => 'required|exists:assets,id',
            'title'             => 'required|string|max:200',
            'description'       => 'nullable|string',
            'type'              => 'required|in:preventive,corrective,inspection,calibration',
            'maintenance_type'  => 'nullable|string',
            'frequency'         => 'required|in:one_time,daily,weekly,monthly,quarterly,biannual,yearly',
            'next_due_date'     => 'required|date',
            'scheduled_date'    => 'nullable|date',
            'assigned_to'       => 'nullable|exists:users,id',
            'department_id'     => 'nullable|exists:departments,id',
            'reminder_days'     => 'nullable|integer|min:0|max:30',
            'cost'              => 'nullable|numeric|min:0',
            'notes'             => 'nullable|string',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        if (empty($validated['department_id'])) {
            $validated['department_id'] = $asset->department_id;
        }

        // Clean any aliases not in maintenance_schedules table
        unset($validated['maintenance_type']);
        unset($validated['scheduled_date']);
        unset($validated['cost']);

        $schedule = MaintenanceSchedule::create($validated);

        // Update asset's next_maintenance_date if earlier or unset
        if (!$asset->next_maintenance_date || Carbon::parse($validated['next_due_date'])->lt($asset->next_maintenance_date)) {
            $asset->update(['next_maintenance_date' => $validated['next_due_date']]);
        }

        AssetHistory::create([
            'asset_id'     => $asset->id,
            'action'       => 'maintenance_scheduled',
            'description'  => "Maintenance scheduled: '{$schedule->title}' due on {$schedule->next_due_date->format('Y-m-d')}",
            'new_values'   => $schedule->toArray(),
            'performed_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Maintenance schedule created successfully',
            'data'    => $schedule->load(['asset', 'assignedUser']),
        ], 201);
    }

    public function show(MaintenanceSchedule $maintenanceSchedule): JsonResponse
    {
        return response()->json([
            'data' => $maintenanceSchedule->load([
                'asset', 'assignedUser', 'completedByUser', 'department',
            ]),
        ]);
    }

    public function update(Request $request, MaintenanceSchedule $maintenanceSchedule): JsonResponse
    {
        $validated = $request->validate([
            'title'         => 'sometimes|string|max:200',
            'description'   => 'nullable|string',
            'type'          => 'sometimes|in:preventive,corrective,inspection,calibration',
            'frequency'     => 'sometimes|in:one_time,daily,weekly,monthly,quarterly,biannual,yearly',
            'next_due_date' => 'sometimes|date',
            'assigned_to'   => 'nullable|exists:users,id',
            'status'        => 'sometimes|in:pending,in_progress,completed,overdue,cancelled',
            'notes'         => 'nullable|string',
        ]);

        $maintenanceSchedule->update($validated);

        return response()->json([
            'message' => 'Maintenance schedule updated',
            'data'    => $maintenanceSchedule->load(['asset', 'assignedUser']),
        ]);
    }

    public function complete(Request $request, MaintenanceSchedule $maintenanceSchedule): JsonResponse
    {
        if (!$request->has('completion_notes')) {
            $notes = $request->work_performed ?? $request->notes ?? 'Maintenance performed successfully';
            $request->merge(['completion_notes' => $notes]);
        }

        $validated = $request->validate([
            'completion_notes' => 'nullable|string',
            'work_performed'   => 'nullable|string',
            'cost'             => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($maintenanceSchedule, $validated) {
            $now = Carbon::now();
            $today = $now->toDateString();

            // Calculate next due date if recurring
            $nextDueDate = null;
            if ($maintenanceSchedule->frequency !== 'one_time') {
                $nextDueDate = match ($maintenanceSchedule->frequency) {
                    'daily'     => $now->copy()->addDay()->toDateString(),
                    'weekly'    => $now->copy()->addWeek()->toDateString(),
                    'monthly'   => $now->copy()->addMonth()->toDateString(),
                    'quarterly' => $now->copy()->addMonths(3)->toDateString(),
                    'biannual'  => $now->copy()->addMonths(6)->toDateString(),
                    'yearly'    => $now->copy()->addYear()->toDateString(),
                    default     => null,
                };
            }

            $maintenanceSchedule->update([
                'status'           => 'completed',
                'completed_at'     => $now,
                'completed_by'     => Auth::id(),
                'last_done_date'   => $today,
                'completion_notes' => $validated['completion_notes'],
                'next_due_date'    => $nextDueDate ?? $maintenanceSchedule->next_due_date,
            ]);

            // Update associated asset
            if ($maintenanceSchedule->asset) {
                $asset = $maintenanceSchedule->asset;
                $assetUpdate = ['last_maintenance_date' => $today];

                if ($nextDueDate) {
                    $assetUpdate['next_maintenance_date'] = $nextDueDate;
                }
                // Return to active status if was in maintenance
                if ($asset->status === 'maintenance') {
                    $assetUpdate['status'] = 'active';
                }

                $asset->update($assetUpdate);

                AssetHistory::create([
                    'asset_id'     => $asset->id,
                    'action'       => 'maintenance_completed',
                    'description'  => "Completed maintenance: '{$maintenanceSchedule->title}'. Notes: {$validated['completion_notes']}",
                    'performed_by' => Auth::id(),
                ]);
            }

            AuditLog::record('maintenance_completed', 'maintenance_schedules', [
                'model_type' => MaintenanceSchedule::class,
                'model_id'   => $maintenanceSchedule->id,
            ]);

            return response()->json([
                'message' => 'Maintenance completed successfully',
                'data'    => $maintenanceSchedule->fresh()->load(['asset', 'completedByUser']),
            ]);
        });
    }

    public function destroy(MaintenanceSchedule $maintenanceSchedule): JsonResponse
    {
        $maintenanceSchedule->delete();
        return response()->json(['message' => 'Maintenance schedule deleted']);
    }
}
