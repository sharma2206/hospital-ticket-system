<?php

use App\Models\Branch;
use App\Models\Department;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->syncRoles(['super_admin']);

    $this->branch = Branch::create([
        'name' => 'Main Hospital',
        'code' => 'MAIN',
        'city' => 'Nashik',
        'is_active' => true,
    ]);

    $this->department = Department::create([
        'name' => 'IT Support',
        'code' => 'IT',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
});

it('lists branches with department/user counts without failing schema checks', function () {
    $this->actingAs($this->admin, 'api')
        ->getJson('/api/branches')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Main Hospital')
        ->assertJsonPath('data.0.departments_count', 1)
        ->assertJsonPath('data.0.users_count', 0);
});

it('can create a department linked to a branch', function () {
    $this->actingAs($this->admin, 'api')
        ->postJson('/api/departments', [
            'name' => 'Radiology',
            'code' => 'RAD',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.branch_id', $this->branch->id);

    $this->assertDatabaseHas('departments', ['branch_id' => $this->branch->id, 'code' => 'RAD']);
});
