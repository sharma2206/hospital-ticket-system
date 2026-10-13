<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /** Roles that cannot be deleted or stripped of all permissions */
    private const PROTECTED_ROLES = ['super_admin'];

    /** Guard used throughout the application */
    private const GUARD = 'api';

    // ─── Permission groupings ────────────────────────────────────────────────
    private const PERMISSION_GROUPS = [
        'Dashboard'                => ['view-dashboard'],
        'Tickets'                  => [
            'create-ticket', 'edit-ticket', 'delete-ticket',
            'assign-ticket', 'reassign-ticket', 'close-ticket',
            'reopen-ticket',
            // legacy aliases
            'view-tickets', 'create-tickets', 'update-tickets',
            'delete-tickets', 'assign-tickets', 'manage-tickets',
        ],
        'Categories & Subcategories' => ['manage-categories'],
        'Assets'                   => ['manage-assets'],
        'SLA Management'           => ['manage-sla'],
        'Users'                    => ['manage-users'],
        'Departments'              => ['manage-departments'],
        'Branches'                 => ['manage-branches'],
        'Reports'                  => ['view-reports'],
        'System Settings'          => ['configure-settings'],
        'System'                   => ['manage-system'],
        'Roles & Permissions'      => ['manage-roles'],
    ];

    // ─── List all roles ──────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Role::where('guard_name', self::GUARD)
            ->withCount('users')
            ->with('permissions:id,name');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $sortBy  = in_array($request->get('sort_by'), ['name', 'created_at', 'users_count'])
            ? $request->get('sort_by')
            : 'name';
        $sortDir = $request->get('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min((int) $request->get('per_page', 0), 100);
        if ($perPage > 0) {
            $roles = $query->paginate($perPage);
            return response()->json([
                'data'       => $roles->items(),
                'pagination' => [
                    'total'        => $roles->total(),
                    'per_page'     => $roles->perPage(),
                    'current_page' => $roles->currentPage(),
                    'last_page'    => $roles->lastPage(),
                ],
            ]);
        }

        return response()->json(['data' => $query->get()]);
    }

    // ─── Show a single role ──────────────────────────────────────────────────
    public function show(Role $role): JsonResponse
    {
        $role->loadCount('users')->load('permissions:id,name');
        return response()->json(['data' => $role]);
    }

    // ─── Create a new role ───────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $this->authorizeRoleManagement();

        $validated = $request->validate([
            'name'        => [
                'required', 'string', 'max:100',
                Rule::unique('roles')->where('guard_name', self::GUARD),
            ],
            'description' => 'nullable|string|max:500',
        ]);

        $role = DB::transaction(function () use ($validated) {
            return Role::create([
                'name'       => $validated['name'],
                'guard_name' => self::GUARD,
            ]);
        });

        AuditLog::record('role_created', 'roles', [
            'model_type'  => Role::class,
            'model_id'    => $role->id,
            'description' => "Role '{$role->name}' created",
            'new_values'  => ['name' => $role->name],
        ]);

        return response()->json([
            'message' => 'Role created successfully',
            'data'    => $role->load('permissions:id,name')->loadCount('users'),
        ], 201);
    }

    // ─── Update a role ───────────────────────────────────────────────────────
    public function update(Request $request, Role $role): JsonResponse
    {
        $this->authorizeRoleManagement();

        // Super Admin name cannot be changed
        if (in_array($role->name, self::PROTECTED_ROLES)) {
            return response()->json([
                'message' => "The '{$role->name}' role name is protected and cannot be renamed.",
            ], 422);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('roles')->where('guard_name', self::GUARD)->ignore($role->id),
            ],
            'description' => 'nullable|string|max:500',
        ]);

        $oldName = $role->name;
        $role->update(['name' => $validated['name'] ?? $role->name]);

        AuditLog::record('role_updated', 'roles', [
            'model_type'  => Role::class,
            'model_id'    => $role->id,
            'description' => "Role renamed from '{$oldName}' to '{$role->name}'",
            'old_values'  => ['name' => $oldName],
            'new_values'  => ['name' => $role->name],
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Role updated successfully',
            'data'    => $role->load('permissions:id,name')->loadCount('users'),
        ]);
    }

    // ─── Delete a role ───────────────────────────────────────────────────────
    public function destroy(Role $role): JsonResponse
    {
        $this->authorizeRoleManagement();

        if (in_array($role->name, self::PROTECTED_ROLES)) {
            return response()->json([
                'message' => "The '{$role->name}' role is protected and cannot be deleted.",
            ], 422);
        }

        $name = $role->name;
        DB::transaction(function () use ($role) {
            $role->syncPermissions([]);
            $role->delete();
        });

        AuditLog::record('role_deleted', 'roles', [
            'model_type'  => Role::class,
            'description' => "Role '{$name}' deleted",
            'old_values'  => ['name' => $name],
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json(['message' => "Role '{$name}' deleted successfully"]);
    }

    // ─── Sync permissions for a role ─────────────────────────────────────────
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        $this->authorizeRoleManagement();

        $validated = $request->validate([
            'permissions'   => 'present|array',
            'permissions.*' => [
                'integer',
                Rule::exists('permissions', 'id')->where('guard_name', self::GUARD),
            ],
        ]);

        $permissionIds = $validated['permissions'];

        // Fetch the permission objects
        $permissions = Permission::where('guard_name', self::GUARD)
            ->whereIn('id', $permissionIds)
            ->get();

        // Safety check: super_admin always keeps all permissions
        $oldPermNames = $role->permissions->pluck('name')->toArray();

        DB::transaction(function () use ($role, $permissions) {
            $role->syncPermissions($permissions);
        });

        $newPermNames = $role->fresh('permissions')->permissions->pluck('name')->toArray();

        $added   = array_values(array_diff($newPermNames, $oldPermNames));
        $removed = array_values(array_diff($oldPermNames, $newPermNames));

        AuditLog::record('permissions_synced', 'roles', [
            'model_type'  => Role::class,
            'model_id'    => $role->id,
            'description' => "Permissions updated for role '{$role->name}'",
            'old_values'  => ['permissions' => $oldPermNames],
            'new_values'  => ['permissions' => $newPermNames, 'added' => $added, 'removed' => $removed],
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissions synced successfully',
            'data'    => $role->load('permissions:id,name')->loadCount('users'),
            'changes' => compact('added', 'removed'),
        ]);
    }

    // ─── Duplicate a role ────────────────────────────────────────────────────
    public function duplicate(Request $request, Role $role): JsonResponse
    {
        $this->authorizeRoleManagement();

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('roles')->where('guard_name', self::GUARD),
            ],
        ]);

        $newRole = DB::transaction(function () use ($role, $validated) {
            $newRole = Role::create([
                'name'       => $validated['name'],
                'guard_name' => self::GUARD,
            ]);
            $newRole->syncPermissions($role->permissions);
            return $newRole;
        });

        AuditLog::record('role_duplicated', 'roles', [
            'model_type'  => Role::class,
            'model_id'    => $newRole->id,
            'description' => "Role '{$role->name}' duplicated as '{$newRole->name}'",
            'new_values'  => ['name' => $newRole->name, 'source' => $role->name],
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Role duplicated successfully',
            'data'    => $newRole->load('permissions:id,name')->loadCount('users'),
        ], 201);
    }

    // ─── List all permissions (grouped) ─────────────────────────────────────
    public function permissions(): JsonResponse
    {
        $allPermissions = Permission::where('guard_name', self::GUARD)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Build grouped structure
        $grouped     = [];
        $categorized = [];

        foreach (self::PERMISSION_GROUPS as $groupName => $permNames) {
            $perms = $allPermissions->whereIn('name', $permNames)->values();
            if ($perms->isNotEmpty()) {
                $grouped[]   = [
                    'group'       => $groupName,
                    'permissions' => $perms,
                ];
                $categorized = array_merge($categorized, $perms->pluck('id')->toArray());
            }
        }

        // Catch any permissions not mapped to a group
        $ungrouped = $allPermissions->whereNotIn('id', $categorized)->values();
        if ($ungrouped->isNotEmpty()) {
            $grouped[] = [
                'group'       => 'Other',
                'permissions' => $ungrouped,
            ];
        }

        return response()->json([
            'data'   => $allPermissions,
            'groups' => $grouped,
        ]);
    }

    // ─── List users assigned to a role ───────────────────────────────────────
    public function users(Role $role, Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $users   = User::role($role)->orderBy('first_name')->paginate($perPage);

        return response()->json([
            'data'       => $users->items(),
            'pagination' => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    /**
     * Verify the authenticated user can manage roles.
     * Super Admin always passes; others need `manage-roles` permission.
     */
    private function authorizeRoleManagement(): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
            return;
        }
        if ($user->hasPermissionTo('manage-roles', self::GUARD)) {
            return;
        }
        abort(403, 'You are not authorized to manage roles and permissions.');
    }
}
