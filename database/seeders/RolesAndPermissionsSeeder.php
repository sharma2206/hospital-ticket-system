<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── 14 Granular Permissions ─────────────────────────────────
        $permissions = [
            'create-ticket',
            'edit-ticket',
            'delete-ticket',
            'assign-ticket',
            'reassign-ticket',
            'close-ticket',
            'reopen-ticket',
            'view-reports',
            'manage-assets',
            'manage-sla',
            'manage-users',
            'manage-departments',
            'manage-branches',
            'configure-settings',
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

        // ── Super Admin — unrestricted ──────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'api')->get());

        // ── IT Manager ──────────────────────────────────────────────
        $itManager = Role::firstOrCreate(['name' => 'it_manager', 'guard_name' => 'api']);
        $itManager->syncPermissions([
            'create-ticket', 'edit-ticket', 'delete-ticket', 'assign-ticket',
            'reassign-ticket', 'close-ticket', 'reopen-ticket', 'view-reports',
            'manage-assets', 'manage-sla', 'manage-users', 'manage-departments',
            'manage-branches',
            // legacy
            'view-tickets', 'create-tickets', 'update-tickets', 'delete-tickets',
            'assign-tickets', 'manage-tickets', 'view-dashboard', 'manage-categories',
        ]);

        // ── Team Lead ───────────────────────────────────────────────
        $teamLead = Role::firstOrCreate(['name' => 'team_lead', 'guard_name' => 'api']);
        $teamLead->syncPermissions([
            'create-ticket', 'edit-ticket', 'assign-ticket', 'reassign-ticket',
            'close-ticket', 'reopen-ticket', 'view-reports', 'manage-assets',
            // legacy
            'view-tickets', 'create-tickets', 'update-tickets', 'assign-tickets',
            'manage-tickets', 'view-dashboard',
        ]);

        // ── Technician ──────────────────────────────────────────────
        $technician = Role::firstOrCreate(['name' => 'technician', 'guard_name' => 'api']);
        $technician->syncPermissions([
            'create-ticket', 'edit-ticket', 'close-ticket', 'manage-assets',
            // legacy
            'view-tickets', 'create-tickets', 'update-tickets', 'manage-tickets',
            'view-dashboard',
        ]);

        // ── Department Coordinator ──────────────────────────────────
        $deptCoord = Role::firstOrCreate(['name' => 'dept_coordinator', 'guard_name' => 'api']);
        $deptCoord->syncPermissions([
            'create-ticket', 'view-reports',
            // legacy
            'view-tickets', 'create-tickets', 'view-dashboard',
        ]);

        // ── Employee (regular user) ─────────────────────────────────
        $employee = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'api']);
        $employee->syncPermissions([
            'create-ticket',
            // legacy
            'view-tickets', 'create-tickets', 'view-dashboard',
        ]);

        // ── Vendor ─────────────────────────────────────────────────
        $vendor = Role::firstOrCreate(['name' => 'vendor', 'guard_name' => 'api']);
        $vendor->syncPermissions([
            'view-tickets', 'view-dashboard',
        ]);

        // ── Legacy roles (backward compat) ──────────────────────────
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions(Permission::where('guard_name', 'api')->get());

        $itStaff = Role::firstOrCreate(['name' => 'it_staff', 'guard_name' => 'api']);
        $itStaff->syncPermissions([
            'create-ticket', 'edit-ticket', 'assign-ticket', 'reassign-ticket',
            'close-ticket', 'reopen-ticket', 'view-reports', 'manage-assets',
            'view-tickets', 'create-tickets', 'update-tickets', 'assign-tickets',
            'manage-tickets', 'view-dashboard',
        ]);

        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'api']);
        $user->syncPermissions([
            'create-ticket', 'view-tickets', 'create-tickets', 'view-dashboard',
        ]);
    }
}
