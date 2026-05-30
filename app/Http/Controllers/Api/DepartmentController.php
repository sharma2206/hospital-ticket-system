<?php

namespace App\Http\Controllers\Api;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController
{
    public function index()
    {
        $departments = Department::where('is_active', true)
            ->get();

        return response()->json(['data' => $departments]);
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'name' => 'required|string|unique:departments',
            'code' => 'required|string|unique:departments',
            'description' => 'nullable|string',
            'phone' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'location' => 'nullable|string',
        ]);

        $department = Department::create($validated);

        return response()->json([
            'message' => 'Department created successfully',
            'data' => $department,
        ], 201);
    }

    public function show(Department $department)
    {
        return response()->json([
            'data' => $department->load('manager', 'users'),
        ]);
    }

    public function update(Request $request, Department $department)
    {

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:departments,name,' . $department->id,
            'description' => 'sometimes|string',
            'phone' => 'sometimes|nullable|string',
            'manager_id' => 'sometimes|nullable|exists:users,id',
            'location' => 'sometimes|nullable|string',
        ]);

        $department->update($validated);

        return response()->json([
            'message' => 'Department updated successfully',
            'data' => $department,
        ]);
    }

    public function destroy(Department $department)
    {
        $department->update(['is_active' => false]);
        return response()->json(['message' => 'Department deactivated successfully']);
    }
}
