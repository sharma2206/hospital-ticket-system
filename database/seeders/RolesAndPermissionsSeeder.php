<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            'view-tickets',
            'create-tickets',
            'update-tickets',
            'delete-tickets',
            'assign-tickets',
            'manage-tickets',
            'view-dashboard',
            'view-reports',
            'manage-users',
            'manage-departments',
            'manage-categories',
            'manage-system',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // Admin — full access
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin->syncPermissions($permissions);

        // IT Staff — ticket management, dashboard, reports
        $itStaff = Role::firstOrCreate(['name' => 'it_staff', 'guard_name' => 'api']);
        $itStaff->syncPermissions([
            'view-tickets',
            'create-tickets',
            'update-tickets',
            'assign-tickets',
            'manage-tickets',
            'view-dashboard',
            'view-reports',
        ]);

        // Regular User — create and view own tickets
        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'api']);
        $user->syncPermissions([
            'view-tickets',
            'create-tickets',
            'view-dashboard',
        ]);
    }
}
