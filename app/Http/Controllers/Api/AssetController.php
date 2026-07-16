<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetHistory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Asset::with(['vendor:id,name', 'department:id,name', 'branch:id,name', 'assignedUser:id,first_name,last_name']);

        if ($request->filled('category'))      $query->where('category', $request->category);
        if ($request->filled('status'))        $query->where('status', $request->status);
        if ($request->filled('department_id')) $query->where('department_id', $request->department_id);
        if ($request->filled('branch_id'))     $query->where('branch_id', $request->branch_id);
        if ($request->filled('vendor_id'))     $query->where('vendor_id', $request->vendor_id);
        if ($request->boolean('maintenance_due')) $query->maintenanceDue();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('asset_code', 'like', "%{$s}%")
                  ->orWhere('serial_number', 'like', "%{$s}%")
                  ->orWhere('hostname', 'like', "%{$s}%")
            );
        }

        $allowed = ['asset_code', 'name', 'category', 'status', 'next_maintenance_date', 'created_at'];
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_code'          => 'required|string|max:50|unique:assets,asset_code',
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

        $asset = Asset::create($validated);

        AssetHistory::create([
            'asset_id'     => $asset->id,
            'action'       => 'created',
            'description'  => "Asset {$asset->asset_code} added to inventory",
            'new_values'   => $asset->toArray(),
            'performed_by' => Auth::id(),
        ]);

        AuditLog::record('created', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);

        return response()->json(['message' => 'Asset created', 'data' => $asset->load(['vendor', 'department', 'branch'])], 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        return response()->json([
            'data' => $asset->load([
                'vendor', 'department', 'branch', 'assignedUser:id,first_name,last_name,email',
                'histories.performer:id,first_name,last_name',
                'maintenanceSchedules.assignedUser:id,first_name,last_name',
                'tickets:id,ticket_number,title,status_id',
            ]),
        ]);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'sometimes|string|max:200',
            'category'         => 'sometimes|string|max:100',
            'sub_category'     => 'nullable|string|max:100',
            'brand'            => 'nullable|string|max:100',
            'model'            => 'nullable|string|max:150',
            'serial_number'    => "nullable|string|max:100|unique:assets,serial_number,{$asset->id}",
            'warranty_expiry'  => 'nullable|date',
            'amc_expiry'       => 'nullable|date',
            'vendor_id'        => 'nullable|exists:vendors,id',
            'department_id'    => 'nullable|exists:departments,id',
            'branch_id'        => 'nullable|exists:branches,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'status'           => 'nullable|in:active,inactive,maintenance,retired,disposed',
            'condition'        => 'nullable|in:excellent,good,fair,poor',
            'cost'             => 'nullable|numeric|min:0',
            'location'         => 'nullable|string|max:255',
            'ip_address'       => 'nullable|ip',
            'hostname'         => 'nullable|string|max:100',
            'os_version'       => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'next_maintenance_date' => 'nullable|date',
        ]);

        $old = $asset->only(array_keys($validated));
        $asset->update($validated);

        AssetHistory::create([
            'asset_id'    => $asset->id,
            'action'      => 'updated',
            'old_values'  => $old,
            'new_values'  => $validated,
            'performed_by'=> Auth::id(),
        ]);

        return response()->json(['message' => 'Asset updated', 'data' => $asset->load(['vendor', 'department'])]);
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $asset->delete();
        AuditLog::record('deleted', 'assets', ['model_type' => Asset::class, 'model_id' => $asset->id]);
        return response()->json(['message' => 'Asset deleted']);
    }

    public function history(Asset $asset): JsonResponse
    {
        $history = $asset->histories()->with('performer:id,first_name,last_name')->paginate(20);
        return response()->json([
            'data' => $history->items(),
            'pagination' => ['total' => $history->total(), 'last_page' => $history->lastPage()],
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Asset::distinct()->pluck('category')->filter()->values();
        return response()->json(['data' => $categories]);
    }
}
