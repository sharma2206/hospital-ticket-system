<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'department:id,name', 'branch:id,name']);

        if ($request->filled('role')) {
            $query->role($request->role);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->boolean('active')) {
            $query->where('is_active', true);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $users = $query->orderBy('first_name')->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'pagination' => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'password'      => ['required', Password::min(8)->letters()->numbers()],
            'phone'         => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id'     => 'nullable|exists:branches,id',
            'employee_id'   => 'nullable|string|max:50|unique:users,employee_id',
            'designation'   => 'nullable|string|max:150',
            'role'          => 'required|exists:roles,name',
            'is_active'     => 'boolean',
        ]);

        $user = User::create([
            'first_name'    => $validated['first_name'],
            'last_name'     => $validated['last_name'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'phone'         => $validated['phone'] ?? null,
            'department_id' => $validated['department_id'] ?? null,
            'branch_id'     => $validated['branch_id'] ?? null,
            'employee_id'   => $validated['employee_id'] ?? null,
            'designation'   => $validated['designation'] ?? null,
            'is_active'     => $validated['is_active'] ?? true,
        ]);

        $user->syncRoles([$validated['role']]);

        AuditLog::record('created', 'users', [
            'model_type'  => User::class,
            'model_id'    => $user->id,
            'description' => "User {$user->email} created",
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data'    => $user->load(['roles', 'department', 'branch']),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $user->load(['roles', 'permissions', 'department', 'branch']),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'email'         => "sometimes|email|unique:users,email,{$user->id}",
            'phone'         => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id'     => 'nullable|exists:branches,id',
            'employee_id'   => "nullable|string|max:50|unique:users,employee_id,{$user->id}",
            'designation'   => 'nullable|string|max:150',
            'is_active'     => 'boolean',
        ]);

        $user->update($validated);

        if ($request->filled('role')) {
            $request->validate(['role' => 'exists:roles,name']);
            $user->syncRoles([$request->role]);
        }

        AuditLog::record('updated', 'users', [
            'model_type' => User::class,
            'model_id'   => $user->id,
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'data'    => $user->load(['roles', 'department', 'branch']),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        AuditLog::record('deleted', 'users', [
            'model_type'  => User::class,
            'model_id'    => $user->id,
            'description' => "User {$user->email} deleted",
        ]);

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    public function changePassword(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json([
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
            'data'    => ['is_active' => $user->is_active],
        ]);
    }

    public function itStaff(Request $request): JsonResponse
    {
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
        $users = User::role($staffRoles)
            ->where('is_active', true)
            ->get(['id', 'first_name', 'last_name', 'email', 'designation']);

        return response()->json(['data' => $users]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::where('guard_name', 'api')
            ->with('permissions:id,name')
            ->get(['id', 'name']);

        return response()->json(['data' => $roles]);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $request->validate(['roles' => 'required|array', 'roles.*' => 'exists:roles,name']);
        $user->syncRoles($request->roles);

        AuditLog::record('role_changed', 'users', [
            'model_type'  => User::class,
            'model_id'    => $user->id,
            'description' => "Roles changed to: " . implode(', ', $request->roles),
        ]);

        return response()->json([
            'message' => 'Roles updated successfully',
            'data'    => $user->load('roles'),
        ]);
    }
}
