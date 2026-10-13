<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(function () {
    // Ensure baseline permissions exist
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

    $this->superAdmin = User::factory()->create(['is_active' => true]);
    $this->superAdmin->syncRoles(['super_admin']);

    $this->itManager = User::factory()->create(['is_active' => true]);
    $this->itManager->syncRoles(['it_manager']);

    $this->employee = User::factory()->create(['is_active' => true]);
    $this->employee->syncRoles(['employee']);

    // Authenticate as super_admin by default
    $this->actingAs($this->superAdmin, 'api');
});

// ─── Role Listing ─────────────────────────────────────────────────────────────
it('lists all roles', function () {
    $response = $this->getJson('/api/roles');
    $response->assertOk()
             ->assertJsonStructure(['data' => [['id', 'name', 'permissions', 'users_count']]]);
});

it('lists roles with search filter', function () {
    $response = $this->getJson('/api/roles?search=super');
    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toBeArray();
    foreach ($data as $role) {
        expect(str_contains($role['name'], 'super'))->toBeTrue();
    }
});

// ─── Role Creation ────────────────────────────────────────────────────────────
it('creates a new role as super_admin', function () {
    $response = $this->postJson('/api/roles', ['name' => 'billing_manager']);
    $response->assertCreated()
             ->assertJsonPath('data.name', 'billing_manager');

    $this->assertDatabaseHas('roles', ['name' => 'billing_manager', 'guard_name' => 'api']);
});

it('rejects duplicate role name', function () {
    $response = $this->postJson('/api/roles', ['name' => 'super_admin']);
    $response->assertStatus(422);
});

it('rejects role creation by regular employee', function () {
    $this->actingAs($this->employee, 'api');
    $response = $this->postJson('/api/roles', ['name' => 'test_role']);
    $response->assertStatus(403);
});

// ─── Role Update ──────────────────────────────────────────────────────────────
it('renames a non-protected role', function () {
    $role = Role::create(['name' => 'temp_role', 'guard_name' => 'api']);
    $response = $this->putJson("/api/roles/{$role->id}", ['name' => 'temp_role_renamed']);
    $response->assertOk()
             ->assertJsonPath('data.name', 'temp_role_renamed');
});

it('prevents renaming super_admin role', function () {
    $role = Role::where('name', 'super_admin')->first();
    $response = $this->putJson("/api/roles/{$role->id}", ['name' => 'hacked_admin']);
    $response->assertStatus(422);
    $this->assertDatabaseHas('roles', ['name' => 'super_admin']);
});

// ─── Role Deletion ────────────────────────────────────────────────────────────
it('deletes a non-protected role', function () {
    $role = Role::create(['name' => 'deletable_role', 'guard_name' => 'api']);
    $response = $this->deleteJson("/api/roles/{$role->id}");
    $response->assertOk();
    $this->assertDatabaseMissing('roles', ['name' => 'deletable_role']);
});

it('prevents deleting super_admin role', function () {
    $role = Role::where('name', 'super_admin')->first();
    $response = $this->deleteJson("/api/roles/{$role->id}");
    $response->assertStatus(422);
    $this->assertDatabaseHas('roles', ['name' => 'super_admin']);
});

it('prevents role deletion by non-admin', function () {
    $role = Role::create(['name' => 'vulnerable_role', 'guard_name' => 'api']);
    $this->actingAs($this->employee, 'api');
    $response = $this->deleteJson("/api/roles/{$role->id}");
    $response->assertStatus(403);
});

// ─── Permission Listing ───────────────────────────────────────────────────────
it('lists permissions grouped by module', function () {
    $response = $this->getJson('/api/roles/permissions');
    $response->assertOk()
             ->assertJsonStructure(['data', 'groups' => [['group', 'permissions']]]);
});

// ─── Permission Assignment ────────────────────────────────────────────────────
it('assigns permissions to a role', function () {
    $role = Role::create(['name' => 'test_assign_role', 'guard_name' => 'api']);
    $perm = Permission::where('name', 'create-ticket')->where('guard_name', 'api')->first();

    $response = $this->postJson("/api/roles/{$role->id}/permissions", [
        'permissions' => [$perm->id],
    ]);
    $response->assertOk()
             ->assertJsonPath('changes.added.0', 'create-ticket');

    expect($role->fresh()->hasPermissionTo('create-ticket', 'api'))->toBeTrue();
});

it('removes permissions from a role', function () {
    $role = Role::create(['name' => 'test_remove_role', 'guard_name' => 'api']);
    $perm = Permission::where('name', 'create-ticket')->where('guard_name', 'api')->first();
    $role->givePermissionTo($perm);

    // Sync with empty permissions
    $response = $this->postJson("/api/roles/{$role->id}/permissions", [
        'permissions' => [],
    ]);
    $response->assertOk()
             ->assertJsonPath('changes.removed.0', 'create-ticket');

    expect($role->fresh()->hasPermissionTo('create-ticket', 'api'))->toBeFalse();
});

it('rejects invalid permission IDs', function () {
    $role = Role::create(['name' => 'test_invalid_perm', 'guard_name' => 'api']);
    $response = $this->postJson("/api/roles/{$role->id}/permissions", [
        'permissions' => [99999],
    ]);
    $response->assertStatus(422);
});

it('prevents permission assignment by non-admin', function () {
    $role = Role::where('name', 'employee')->first();
    $perm = Permission::where('name', 'manage-users')->where('guard_name', 'api')->first();
    $this->actingAs($this->employee, 'api');
    $response = $this->postJson("/api/roles/{$role->id}/permissions", [
        'permissions' => [$perm->id],
    ]);
    $response->assertStatus(403);
});

// ─── Role Duplication ─────────────────────────────────────────────────────────
it('duplicates a role with its permissions', function () {
    $role = Role::where('name', 'technician')->first();
    $originalPerms = $role->permissions->pluck('id')->toArray();

    $response = $this->postJson("/api/roles/{$role->id}/duplicate", [
        'name' => 'technician_level2',
    ]);
    $response->assertCreated();

    $newRole = Role::where('name', 'technician_level2')->first();
    expect($newRole)->not->toBeNull();
    expect($newRole->permissions->pluck('id')->toArray())->toEqual($originalPerms);
});

it('prevents duplicate role name on duplication', function () {
    $role = Role::where('name', 'technician')->first();
    $response = $this->postJson("/api/roles/{$role->id}/duplicate", [
        'name' => 'employee', // already exists
    ]);
    $response->assertStatus(422);
});

// ─── Privilege Escalation Protection ─────────────────────────────────────────
it('prevents employee from escalating own role', function () {
    $this->actingAs($this->employee, 'api');
    $superAdminRole = Role::where('name', 'super_admin')->first();
    $perm = Permission::where('name', 'manage-users')->where('guard_name', 'api')->first();

    // Try to assign manage-users to a role they belong to
    $response = $this->postJson("/api/roles/{$superAdminRole->id}/permissions", [
        'permissions' => [$perm->id],
    ]);
    $response->assertStatus(403);
});

// ─── Role-User Count ──────────────────────────────────────────────────────────
it('returns user count for each role', function () {
    $response = $this->getJson('/api/roles');
    $data = $response->json('data');
    $employeeRole = collect($data)->firstWhere('name', 'employee');
    expect($employeeRole)->not->toBeNull();
    expect($employeeRole['users_count'])->toBeGreaterThanOrEqual(0);
});

// ─── Auth/Me Permissions ──────────────────────────────────────────────────────
it('returns permissions in auth/me response', function () {
    $response = $this->getJson('/api/auth/me');
    $response->assertOk()
             ->assertJsonStructure(['roles', 'permissions']);
    expect($response->json('permissions'))->toBeArray();
});

it('super_admin has all permissions in auth/me', function () {
    $response = $this->getJson('/api/auth/me');
    $permissions = $response->json('permissions');
    expect(in_array('manage-users', $permissions))->toBeTrue();
    expect(in_array('manage-roles', $permissions))->toBeTrue();
});

// ─── Seeder Idempotency ───────────────────────────────────────────────────────
it('does not overwrite custom permissions when reseeding', function () {
    // Manually assign a permission to employee that isn't in baseline
    $employeeRole = Role::where('name', 'employee')->first();
    $customPerm = Permission::where('name', 'view-reports')->first();
    $employeeRole->givePermissionTo($customPerm);

    // Re-run seeder
    $this->artisan('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

    // Employee should still have view-reports (seeder shouldn't wipe it)
    $employeeRole->refresh();
    expect($employeeRole->hasPermissionTo('view-reports', 'api'))->toBeTrue();
});
