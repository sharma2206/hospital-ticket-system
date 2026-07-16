<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }

        $departments = $query->withCount('tickets')->orderBy('name')->get();

        return response()->json(['data' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:150|unique:departments,name',
            'code'       => 'nullable|string|max:20|unique:departments,code',
            'branch_id'  => 'nullable|exists:branches,id',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'boolean',
        ]);

        $dept = Department::create($validated);

        AuditLog::record('created', 'departments', [
            'model_type' => Department::class,
            'model_id'   => $dept->id,
        ]);

        return response()->json(['message' => 'Department created', 'data' => $dept], 201);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name'       => "sometimes|string|max:150|unique:departments,name,{$department->id}",
            'code'       => "nullable|string|max:20|unique:departments,code,{$department->id}",
            'branch_id'  => 'nullable|exists:branches,id',
            'manager_id' => 'nullable|exists:users,id',
            'is_active'  => 'boolean',
        ]);

        $department->update($validated);
        AuditLog::record('updated', 'departments', ['model_type' => Department::class, 'model_id' => $department->id]);

        return response()->json(['message' => 'Department updated', 'data' => $department]);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();
        AuditLog::record('deleted', 'departments', ['model_type' => Department::class, 'model_id' => $department->id]);
        return response()->json(['message' => 'Department deleted']);
    }
}
