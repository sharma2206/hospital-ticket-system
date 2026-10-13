<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/**
 * Idempotent seeder: uses firstOrCreate for roles and permissions.
 *
 * SAFE TO RE-RUN — will NOT overwrite permissions that were changed via the UI.
 * It only sets permissions the first time a role is created.
 * Existing roles/permissions are never deleted.
 *
 * To reset all role permissions to baseline, run:
 *   php artisan db:seed --class=RolesAndPermissionsSeeder --force-reset
 * (The --force-reset flag is checked below.)
 */
class RolesAndPermissionsSeeder extends Seeder
{
    /** If true, existing role permissions are overwritten with baseline values. */
    private bool $forceReset = false;

    public function run(): void
    {
        $this->forceReset = app()->runningInConsole()
            && in_array('--force-reset', $_SERVER['argv'] ?? []);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Ensure all baseline permissions exist ─────────────────────────
        $permissions = [
            // Granular ticket permissions
            'create-ticket',
            'edit-ticket',
            'delete-ticket',
            'assign-ticket',
            'reassign-ticket',
            'close-ticket',
            'reopen-ticket',
            // Other modules
            'view-reports',
            'manage-assets',
            'manage-sla',
            'manage-users',
            'manage-departments',
            'manage-branches',
            'configure-settings',
            'manage-roles',
            // Legacy / internal permissions kept for backward compat
            'view-tickets',
            'create-tickets',
            'update-tickets',
            'delete-tickets',
            'assign-tickets',
            'manage-tickets',
            'view-dashboard',
            'manage-categories',
            'manage-system',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // ── Create roles (no permission assignment if role already exists) ─
        $this->ensureRole('super_admin', [
            // Super admin gets ALL permissions on first seed
            'create-ticket', 'edit-ticket', 'delete-ticket', 'assign-ticket',
            'reassign-ticket', 'close-ticket', 'reopen-ticket', 'view-reports',
            'manage-assets', 'manage-sla', 'manage-users', 'manage-departments',
            'manage-branches', 'configure-settings', 'manage-roles',
            'view-tickets', 'create-tickets', 'update-tickets', 'delete-tickets',
            'assign-tickets', 'manage-tickets', 'view-dashboard', 'manage-categories',
            'manage-system',
        ]);

        $this->ensureRole('it_manager', [
            'create-ticket', 'edit-ticket', 'delete-ticket', 'assign-ticket',
            'reassign-ticket', 'close-ticket', 'reopen-ticket', 'view-reports',
            'manage-assets', 'manage-sla', 'manage-users', 'manage-departments',
            'manage-branches',
            'view-tickets', 'create-tickets', 'update-tickets', 'delete-tickets',
            'assign-tickets', 'manage-tickets', 'view-dashboard', 'manage-categories',
        ]);

        $this->ensureRole('team_lead', [
            'create-ticket', 'edit-ticket', 'assign-ticket', 'reassign-ticket',
            'close-ticket', 'reopen-ticket', 'view-reports', 'manage-assets',
            'view-tickets', 'create-tickets', 'update-tickets', 'assign-tickets',
            'manage-tickets', 'view-dashboard',
        ]);

        $this->ensureRole('technician', [
            'create-ticket', 'edit-ticket', 'close-ticket', 'manage-assets',
            'view-tickets', 'create-tickets', 'update-tickets', 'manage-tickets',
            'view-dashboard',
        ]);

        $this->ensureRole('dept_coordinator', [
            'create-ticket', 'view-reports',
            'view-tickets', 'create-tickets', 'view-dashboard',
        ]);

        $this->ensureRole('employee', [
            'create-ticket',
            'view-tickets', 'create-tickets', 'view-dashboard',
        ]);

        $this->ensureRole('vendor', [
            'view-tickets', 'view-dashboard',
        ]);

        // ── Legacy roles (backward compat) ────────────────────────────────
        $this->ensureRole('admin', [
            'create-ticket', 'edit-ticket', 'delete-ticket', 'assign-ticket',
            'reassign-ticket', 'close-ticket', 'reopen-ticket', 'view-reports',
            'manage-assets', 'manage-sla', 'manage-users', 'manage-departments',
            'manage-branches', 'configure-settings', 'manage-roles',
            'view-tickets', 'create-tickets', 'update-tickets', 'delete-tickets',
            'assign-tickets', 'manage-tickets', 'view-dashboard', 'manage-categories',
            'manage-system',
        ]);

        $this->ensureRole('it_staff', [
            'create-ticket', 'edit-ticket', 'assign-ticket', 'reassign-ticket',
            'close-ticket', 'reopen-ticket', 'view-reports', 'manage-assets',
            'view-tickets', 'create-tickets', 'update-tickets', 'assign-tickets',
            'manage-tickets', 'view-dashboard',
        ]);

        $this->ensureRole('user', [
            'create-ticket', 'view-tickets', 'create-tickets', 'view-dashboard',
        ]);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Create role if it doesn't exist, assign baseline permissions only on creation
     * OR when --force-reset flag is provided.
     *
     * Super Admin role always gets ALL current permissions synced (safety net).
     */
    private function ensureRole(string $roleName, array $baselinePermissions): void
    {
        $isNew = !Role::where('name', $roleName)->where('guard_name', 'api')->exists();
        $role  = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);

        if ($roleName === 'super_admin') {
            // Super admin always has ALL permissions — this is the safety net
            $role->syncPermissions(Permission::where('guard_name', 'api')->get());
            return;
        }

        if ($isNew || $this->forceReset) {
            $permissionObjects = Permission::where('guard_name', 'api')
                ->whereIn('name', $baselinePermissions)
                ->get();
            $role->syncPermissions($permissionObjects);
        }
        // Existing role with no --force-reset: permissions are left as-is (UI changes preserved)
    }
}
