<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetHistory;
use App\Models\AssetCategory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Carbon\Carbon;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Asset::with([
            'vendor:id,name',
            'department:id,name,code',
            'branch:id,name,code',
            'assignedUser:id,first_name,last_name,email',
        ]);

        if ($request->filled('category'))         $query->where('category', $request->category);
        if ($request->filled('status'))           $query->where('status', $request->status);
        if ($request->filled('condition'))        $query->where('condition', $request->condition);
        if ($request->filled('department_id'))    $query->where('department_id', $request->department_id);
        if ($request->filled('branch_id'))        $query->where('branch_id', $request->branch_id);
        if ($request->filled('vendor_id'))        $query->where('vendor_id', $request->vendor_id);
        if ($request->filled('assigned_user_id')) $query->where('assigned_user_id', $request->assigned_user_id);

        if ($request->boolean('unassigned')) {
            $query->whereNull('assigned_user_id');
        }

        if ($request->boolean('assigned')) {
            $query->whereNotNull('assigned_user_id');
        }

        if ($request->boolean('maintenance_due')) {
            $query->whereDate('next_maintenance_date', '<=', now()->addDays(14))
                  ->where('status', '!=', 'retired')
                  ->where('status', '!=', 'disposed');
        }

        if ($request->boolean('warranty_expiring_soon')) {
            $query->whereBetween('warranty_expiry', [now(), now()->addDays(30)]);
        }

        if ($request->boolean('warranty_expired')) {
            $query->whereDate('warranty_expiry', '<', now());
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('asset_code', 'like', "%{$s}%")
                  ->orWhere('serial_number', 'like', "%{$s}%")
                  ->orWhere('model', 'like', "%{$s}%")
                  ->orWhere('brand', 'like', "%{$s}%")
                  ->orWhere('hostname', 'like', "%{$s}%");
            });
        }

        $allowed = ['asset_code', 'name', 'category', 'status', 'condition', 'next_maintenance_date', 'warranty_expiry', 'created_at'];
        $sortBy = in_array($request->get('sort_by'), $allowed) ? $request->get('sort_by') : 'created_at';
        $query->orderBy($sortBy, $request->get('sort_order', 'desc') === 'asc' ? 'asc' : 'desc');

        $perPage = min((int) $request->get('per_page', 15), 100);
        $assets = $query->paginate($perPage);

        return response()->json([
            'data'       => $assets->items(),
            'pagination' => [
                'total'        => $assets->total(),
                'per_page'     => $assets->perPage(),
                'current_page' => $assets->currentPage(),
                'last_page'    => $assets->lastPage(),
            ],
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $thirtyDays = $now->copy()->addDays(30);
        $fourteenDays = $now->copy()->addDays(14);

        $totalAssets = Asset::count();
        $activeAssets = Asset::where('status', 'active')->count();
        $assignedAssets = Asset::whereNotNull('assigned_user_id')->count();
        $availableAssets = Asset::where('status', 'active')->whereNull('assigned_user_id')->count();
        $underMaintenance = Asset::where('status', 'maintenance')->count();
        $retiredAssets = Asset::where('status', 'retired')->count();
        $disposedAssets = Asset::where('status', 'disposed')->count();

        $warrantyExpiringSoon = Asset::whereBetween('warranty_expiry', [$now, $thirtyDays])->count();
        $warrantyExpired = Asset::whereDate('warranty_expiry', '<', $now)->count();

        $maintenanceDueSoon = Asset::whereBetween('next_maintenance_date', [$now, $fourteenDays])->count();
        $maintenanceOverdue = Asset::whereDate('next_maintenance_date', '<', $now)
            ->whereNotIn('status', ['retired', 'disposed'])
            ->count();

        $totalCost = (float) Asset::sum('cost');

        // Distribution breakdowns
        $byCategory = Asset::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $byStatus = Asset::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $byBranch = Asset::join('branches', 'assets.branch_id', '=', 'branches.id')
            ->select('branches.name as branch_name', DB::raw('count(assets.id) as count'))
            ->groupBy('branches.name')
            ->orderByDesc('count')
            ->get();

        $byDepartment = Asset::join('departments', 'assets.department_id', '=', 'departments.id')
            ->select('departments.name as department_name', DB::raw('count(assets.id) as count'))
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $counts = [
            'total'                  => $totalAssets,
            'active'                 => $activeAssets,
            'assigned'               => $assignedAssets,
            'available'              => $availableAssets,
            'under_maintenance'      => $underMaintenance,
            'retired'                => $retiredAssets,
            'disposed'               => $disposedAssets,
            'warranty_expiring_soon' => $warrantyExpiringSoon,
            'warranty_expired'       => $warrantyExpired,
            'maintenance_due_soon'   => $maintenanceDueSoon,
            'maintenance_overdue'    => $maintenanceOverdue,
            'total_cost'             => $totalCost,
        ];

        $distributions = [
            'by_category'   => $byCategory,
            'by_status'     => $byStatus,
            'by_branch'     => $byBranch,
            'by_department' => $byDepartment,
        ];

        return response()->json([
            'data' => [
                'counts'        => $counts,
                'summary'       => $counts,
                'distributions' => $distributions,
                'charts'        => $distributions,
            ],
            'counts'        => $counts,
            'summary'       => $counts,
            'charts'        => $distributions,
            'distributions' => $distributions,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_code'          => 'nullable|string|max:50|unique:assets,asset_code',
            'name'                => 'required|string|max:200',
            'category'            => 'required|string|max:100',
            'sub_category'        => 'nullable|string|max:100',
            'brand'               => 'nullable|string|max:100',
            'model'               => 'nullable|string|max:150',
            'serial_number'       => 'nullable|string|max:100|unique:assets,serial_number',
            'purchase_date'       => 'nullable|date',
            'warranty_expiry'     => 'nullable|date',
            'amc_expiry'          => 'nullable|date',
            'vendor_id'           => 'nullable|exists:vendors,id',
            'department_id'       => 'nullable|exists:departments,id',
            'branch_id'           => 'nullable|exists:branches,id',
            'assigned_user_id'    => 'nullable|exists:users,id',
            'status'              => 'nullable|in:active,inactive,maintenance,retired,disposed',
            'condition'           => 'nullable|in:excellent,good,fair,poor',
            'cost'                => 'nullable|numeric|min:0',
            'depreciation_rate'   => 'nullable|numeric|min:0|max:100',
            'location'            => 'nullable|string|max:255',
            'ip_address'          => 'nullable|ip',
            'mac_address'         => 'nullable|string|max:17',
            'hostname'            => 'nullable|string|max:100',
            'os_version'          => 'nullable|string|max:100',
            'specifications'      => 'nullable|string',
            'notes'               => 'nullable|string',
            'next_maintenance_date'=> 'nullable|date',
        ]);

        // Auto-generate unique asset code if omitted
        if (empty($validated['asset_code'])) {
            $year = date('Y');
            $prefix = "AST-{$year}-";
            $latest = Asset::where('asset_code', 'like', "{$prefix}%")->orderByDesc('id')->value('asset_code');
            $num = $latest ? ((int) substr(strrchr($latest, '-'), 1)) + 1 : 1;
            $validated['asset_code'] = $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
        }

        $asset = Asset::create($validated);

        AssetHistory::create([
            'asset_id'     => $asset->id,
            'action'       => 'created',
            'description'  => "Asset {$asset->asset_code} registered in system",
            'new_values'   => $asset->toArray(),
            'performed_by' => Auth::id(),
        ]);

        if (!empty($validated['assigned_user_id'])) {
            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'assigned',
                'description'  => "Initial assignment to user #{$validated['assigned_user_id']}",
                'new_values'   => ['assigned_user_id' => $validated['assigned_user_id']],
                'performed_by' => Auth::id(),
            ]);
        }

        AuditLog::record('created', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

        return response()->json([
            'message' => 'Asset created successfully',
            'data'    => $asset->load(['vendor', 'department', 'branch', 'assignedUser']),
        ], 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        return response()->json([
            'data' => $asset->load([
                'vendor',
                'department',
                'branch',
                'assignedUser:id,first_name,last_name,email,employee_id,phone',
                'histories.performer:id,first_name,last_name',
                'maintenanceSchedules.assignedUser:id,first_name,last_name',
                'maintenanceSchedules.completedByUser:id,first_name,last_name',
                'tickets.status:id,name,code,color',
                'tickets.priority:id,name,color',
                'tickets.creator:id,first_name,last_name',
            ]),
        ]);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:200',
            'category'             => 'sometimes|string|max:100',
            'sub_category'         => 'nullable|string|max:100',
            'brand'                => 'nullable|string|max:100',
            'model'                => 'nullable|string|max:150',
            'serial_number'        => "nullable|string|max:100|unique:assets,serial_number,{$asset->id}",
            'purchase_date'        => 'nullable|date',
            'warranty_expiry'      => 'nullable|date',
            'amc_expiry'           => 'nullable|date',
            'vendor_id'            => 'nullable|exists:vendors,id',
            'department_id'        => 'nullable|exists:departments,id',
            'branch_id'            => 'nullable|exists:branches,id',
            'assigned_user_id'     => 'nullable|exists:users,id',
            'status'               => 'nullable|in:active,inactive,maintenance,retired,disposed',
            'condition'            => 'nullable|in:excellent,good,fair,poor',
            'cost'                 => 'nullable|numeric|min:0',
            'depreciation_rate'    => 'nullable|numeric|min:0|max:100',
            'location'             => 'nullable|string|max:255',
            'ip_address'           => 'nullable|ip',
            'mac_address'          => 'nullable|string|max:17',
            'hostname'             => 'nullable|string|max:100',
            'os_version'           => 'nullable|string|max:100',
            'specifications'       => 'nullable|string',
            'notes'                => 'nullable|string',
            'next_maintenance_date'=> 'nullable|date',
        ]);

        $old = $asset->only(array_keys($validated));
        $asset->update($validated);

        AssetHistory::create([
            'asset_id'     => $asset->id,
            'action'       => 'updated',
            'description'  => "Asset details updated",
            'old_values'   => $old,
            'new_values'   => $validated,
            'performed_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Asset updated successfully',
            'data'    => $asset->load(['vendor', 'department', 'branch', 'assignedUser']),
        ]);
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $asset->delete();
        AuditLog::record('deleted', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);
        return response()->json(['message' => 'Asset deleted successfully']);
    }

    public function assign(Request $request, Asset $asset): JsonResponse
    {
        if (in_array($asset->status, ['retired', 'disposed'])) {
            return response()->json(['message' => 'Cannot assign a retired or disposed asset'], 422);
        }

        $validated = $request->validate([
            'user_id'          => 'nullable|exists:users,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'department_id'    => 'nullable|exists:departments,id',
            'branch_id'        => 'nullable|exists:branches,id',
            'location'         => 'nullable|string|max:255',
            'condition'        => 'nullable|in:excellent,good,fair,poor,damaged',
            'notes'            => 'nullable|string',
        ]);

        $targetUserId = $validated['assigned_user_id'] ?? $validated['user_id'] ?? null;
        if (!$targetUserId && empty($validated['department_id'])) {
            return response()->json(['message' => 'Either an assigned user or department must be specified'], 422);
        }

        return DB::transaction(function () use ($asset, $validated, $targetUserId) {
            $oldUser = $asset->assignedUser;
            $oldValues = [
                'assigned_user_id' => $asset->assigned_user_id,
                'location'         => $asset->location,
                'department_id'    => $asset->department_id,
            ];

            $updateData = [
                'assigned_user_id' => $targetUserId,
                'status'           => 'active',
            ];
            if (!empty($validated['department_id'])) $updateData['department_id'] = $validated['department_id'];
            if (!empty($validated['branch_id']))     $updateData['branch_id'] = $validated['branch_id'];
            if (!empty($validated['location']))      $updateData['location'] = $validated['location'];
            if (!empty($validated['condition']))     $updateData['condition'] = $validated['condition'];

            $asset->update($updateData);

            $newUser = $asset->fresh()->assignedUser;
            $newUserName = $newUser ? "{$newUser->first_name} {$newUser->last_name}" : ($targetUserId ? "#{$targetUserId}" : "Department");

            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'assigned',
                'description'  => "Assigned to {$newUserName}. Notes: " . ($validated['notes'] ?? 'None'),
                'old_values'   => $oldValues,
                'new_values'   => $updateData,
                'performed_by' => Auth::id(),
            ]);

            AuditLog::record('assigned', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

            return response()->json([
                'message' => "Asset successfully assigned to {$newUserName}",
                'data'    => $asset->load(['assignedUser', 'department', 'branch']),
            ]);
        });
    }

    public function transfer(Request $request, Asset $asset): JsonResponse
    {
        if (in_array($asset->status, ['retired', 'disposed'])) {
            return response()->json(['message' => 'Cannot transfer a retired or disposed asset'], 422);
        }

        $validated = $request->validate([
            'new_user_id'      => 'nullable|exists:users,id',
            'to_user_id'       => 'nullable|exists:users,id',
            'department_id'    => 'nullable|exists:departments,id',
            'to_department_id' => 'nullable|exists:departments,id',
            'branch_id'        => 'nullable|exists:branches,id',
            'to_branch_id'     => 'nullable|exists:branches,id',
            'location'         => 'nullable|string|max:255',
            'to_location'      => 'nullable|string|max:255',
            'condition'        => 'nullable|in:excellent,good,fair,poor,damaged',
            'handover_notes'   => 'nullable|string',
        ]);

        $newUserId = $validated['to_user_id'] ?? $validated['new_user_id'] ?? null;
        $deptId = $validated['to_department_id'] ?? $validated['department_id'] ?? null;
        $branchId = $validated['to_branch_id'] ?? $validated['branch_id'] ?? null;
        $loc = $validated['to_location'] ?? $validated['location'] ?? null;

        return DB::transaction(function () use ($asset, $validated, $newUserId, $deptId, $branchId, $loc) {
            $prevAssignee = $asset->assignedUser ? "{$asset->assignedUser->first_name} {$asset->assignedUser->last_name}" : 'Unassigned';

            $oldValues = [
                'assigned_user_id' => $asset->assigned_user_id,
                'department_id'    => $asset->department_id,
                'branch_id'        => $asset->branch_id,
                'location'         => $asset->location,
            ];

            $updateData = [];
            if ($newUserId !== null) $updateData['assigned_user_id'] = $newUserId;
            if ($deptId !== null)    $updateData['department_id'] = $deptId;
            if ($branchId !== null)  $updateData['branch_id'] = $branchId;
            if ($loc !== null)       $updateData['location'] = $loc;
            if (!empty($validated['condition'])) $updateData['condition'] = $validated['condition'];

            $asset->update($updateData);

            $fresh = $asset->fresh();
            $newAssignee = $fresh->assignedUser ? "{$fresh->assignedUser->first_name} {$fresh->assignedUser->last_name}" : 'Unassigned';

            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'transferred',
                'description'  => "Transferred from {$prevAssignee} to {$newAssignee}. Handover notes: " . ($validated['handover_notes'] ?? 'None'),
                'old_values'   => $oldValues,
                'new_values'   => $updateData,
                'performed_by' => Auth::id(),
            ]);

            AuditLog::record('transferred', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

            return response()->json([
                'message' => "Asset custody successfully transferred to {$newAssignee}",
                'data'    => $fresh->load(['assignedUser', 'department', 'branch']),
            ]);
        });
    }

    public function returnAsset(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'location'         => 'nullable|string|max:255',
            'return_location'  => 'nullable|string|max:255',
            'condition'        => 'nullable|in:excellent,good,fair,poor,damaged',
            'return_condition' => 'nullable|in:excellent,good,fair,poor,damaged',
            'return_notes'     => 'nullable|string',
            'notes'            => 'nullable|string',
        ]);

        return DB::transaction(function () use ($asset, $validated) {
            $prevAssignee = $asset->assignedUser ? "{$asset->assignedUser->first_name} {$asset->assignedUser->last_name}" : 'Unknown';

            $retCondition = $validated['return_condition'] ?? $validated['condition'] ?? $asset->condition;
            $newStatus = in_array($retCondition, ['poor', 'damaged']) ? 'maintenance' : 'active';
            $storageLocation = $validated['return_location'] ?? $validated['location'] ?? 'IT Storage Room';
            $returnNotes = $validated['return_notes'] ?? $validated['notes'] ?? 'None';

            $oldValues = [
                'assigned_user_id' => $asset->assigned_user_id,
                'status'           => $asset->status,
                'location'         => $asset->location,
            ];

            $asset->update([
                'assigned_user_id' => null,
                'status'           => $newStatus,
                'location'         => $storageLocation,
                'condition'        => $retCondition,
            ]);

            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'returned',
                'description'  => "Returned from {$prevAssignee} back to pool ({$storageLocation}). Return notes: " . $returnNotes,
                'old_values'   => $oldValues,
                'new_values'   => ['assigned_user_id' => null, 'status' => $newStatus, 'location' => $storageLocation],
                'performed_by' => Auth::id(),
            ]);

            AuditLog::record('returned', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

            return response()->json([
                'message' => "Asset returned to inventory pool ({$storageLocation})",
                'data'    => $asset->fresh()->load(['department', 'branch']),
            ]);
        });
    }

    public function updateStatus(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,inactive,maintenance,retired,disposed',
            'reason' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($asset, $validated) {
            $oldStatus = $asset->status;
            $updateData = ['status' => $validated['status']];

            // If retired or disposed, release custody
            if (in_array($validated['status'], ['retired', 'disposed'])) {
                $updateData['assigned_user_id'] = null;
            }

            $asset->update($updateData);

            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'status_change',
                'description'  => "Status changed from {$oldStatus} to {$validated['status']}. Reason: " . ($validated['reason'] ?? 'Standard lifecycle update'),
                'old_values'   => ['status' => $oldStatus],
                'new_values'   => ['status' => $validated['status']],
                'performed_by' => Auth::id(),
            ]);

            AuditLog::record('status_change', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

            return response()->json([
                'message' => "Asset status updated to {$validated['status']}",
                'data'    => $asset->fresh(),
            ]);
        });
    }

    public function history(Asset $asset): JsonResponse
    {
        $history = $asset->histories()
            ->with('performer:id,first_name,last_name,email')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data'       => $history->items(),
            'pagination' => ['total' => $history->total(), 'last_page' => $history->lastPage()],
        ]);
    }

    public function categories(): JsonResponse
    {
        $dynamicCategories = AssetCategory::active()->pluck('name')->toArray();
        $existingCategories = Asset::distinct()->pluck('category')->filter()->toArray();

        $all = array_values(array_unique(array_merge($dynamicCategories, $existingCategories)));
        sort($all);

        return response()->json(['data' => $all]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = Asset::with(['department:id,name', 'branch:id,name', 'vendor:id,name', 'assignedUser:id,first_name,last_name']);

        if ($request->filled('category'))      $query->where('category', $request->category);
        if ($request->filled('status'))        $query->where('status', $request->status);
        if ($request->filled('department_id')) $query->where('department_id', $request->department_id);
        if ($request->filled('branch_id'))     $query->where('branch_id', $request->branch_id);

        $assets = $query->orderBy('asset_code')->get();

        $filename = "hospital_assets_" . date('Y-m-d_His') . ".csv";

        return response()->streamDownload(function () use ($assets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Asset Code', 'Name', 'Category', 'Brand', 'Model', 'Serial Number',
                'Status', 'Condition', 'Branch', 'Department', 'Assigned Custodian',
                'Location', 'IP Address', 'Purchase Date', 'Cost', 'Warranty Expiry', 'Next Maintenance'
            ]);

            foreach ($assets as $a) {
                fputcsv($handle, [
                    $a->asset_code,
                    $a->name,
                    $a->category,
                    $a->brand ?? '',
                    $a->model ?? '',
                    $a->serial_number ?? '',
                    $a->status,
                    $a->condition,
                    $a->branch?->name ?? '',
                    $a->department?->name ?? '',
                    $a->assignedUser ? "{$a->assignedUser->first_name} {$a->assignedUser->last_name}" : 'Unassigned',
                    $a->location ?? '',
                    $a->ip_address ?? '',
                    $a->purchase_date ? $a->purchase_date->format('Y-m-d') : '',
                    $a->cost ? number_format((float) $a->cost, 2) : '',
                    $a->warranty_expiry ? $a->warranty_expiry->format('Y-m-d') : '',
                    $a->next_maintenance_date ? $a->next_maintenance_date->format('Y-m-d') : '',
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
