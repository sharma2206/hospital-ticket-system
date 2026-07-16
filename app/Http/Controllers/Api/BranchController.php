<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Branch::with('manager:id,first_name,last_name');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
        }
        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }

        $branches = $query->withCount(['tickets', 'departments', 'users'])->orderBy('name')->get();

        return response()->json(['data' => $branches]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:150',
            'code'       => 'required|string|max:20|unique:branches,code',
            'address'    => 'nullable|string',
            'city'       => 'nullable|string|max:100',
            'phone'      => 'nullable|string|max:20',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'boolean',
        ]);

        $branch = Branch::create($validated);
        AuditLog::record('created', 'branches', ['model_type' => Branch::class, 'model_id' => $branch->id]);

        return response()->json(['message' => 'Branch created', 'data' => $branch], 201);
    }

    public function show(Branch $branch): JsonResponse
    {
        return response()->json([
            'data' => $branch->load(['manager:id,first_name,last_name', 'departments:id,name', 'users:id,first_name,last_name,email']),
        ]);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        $validated = $request->validate([
            'name'       => "sometimes|string|max:150",
            'code'       => "sometimes|string|max:20|unique:branches,code,{$branch->id}",
            'address'    => 'nullable|string',
            'city'       => 'nullable|string|max:100',
            'phone'      => 'nullable|string|max:20',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'boolean',
        ]);

        $branch->update($validated);
        AuditLog::record('updated', 'branches', ['model_type' => Branch::class, 'model_id' => $branch->id]);

        return response()->json(['message' => 'Branch updated', 'data' => $branch]);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $branch->delete();
        AuditLog::record('deleted', 'branches', ['model_type' => Branch::class, 'model_id' => $branch->id]);
        return response()->json(['message' => 'Branch deleted']);
    }
}
