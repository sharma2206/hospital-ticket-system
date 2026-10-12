<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Priority;
use App\Models\TicketStatus;
use App\Models\Ticket;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TicketStatusesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\CategoriesSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(TicketStatusesSeeder::class);
    $this->seed(PrioritiesSeeder::class);
    $this->seed(CategoriesSeeder::class);

    $this->superAdmin = User::factory()->create();
    $this->superAdmin->syncRoles(['super_admin']);

    $this->itManager = User::factory()->create();
    $this->itManager->syncRoles(['it_manager']);

    $this->regularUser = User::factory()->create();
    $this->regularUser->syncRoles(['user']);

    $this->branch = Branch::create([
        'name' => 'Main Hospital',
        'code' => 'MAIN',
        'city' => 'Mumbai',
        'is_active' => true,
    ]);

    $this->dept = Department::create([
        'name' => 'Biomedical Engineering',
        'code' => 'BME',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
});

it('lists categories with subcategory and ticket counts for authenticated users', function () {
    $response = $this->actingAs($this->superAdmin, 'api')
        ->getJson('/api/categories')
        ->assertOk()
        ->assertJsonStructure(['data']);

    expect(count($response->json('data')))->toBeGreaterThan(0);
});

it('allows super admin to create a category and prevents duplicate name', function () {
    $createResponse = $this->actingAs($this->superAdmin, 'api')
        ->postJson('/api/categories', [
            'name'        => 'Diagnostic Equipment',
            'code'        => 'DIAG',
            'description' => 'Issues with diagnostic medical devices',
            'color'       => '#10b981',
            'is_active'   => true,
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'Diagnostic Equipment')
        ->assertJsonPath('data.code', 'DIAG');

    // Duplicate name attempt should fail with validation error 422
    $duplicateResponse = $this->actingAs($this->superAdmin, 'api')
        ->postJson('/api/categories', [
            'name'        => 'Diagnostic Equipment',
            'code'        => 'DIAG2',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('allows super admin to update a category', function () {
    $category = Category::create([
        'name'      => 'Telemedicine Ops',
        'code'      => 'TMED',
        'is_active' => true,
    ]);

    $this->actingAs($this->superAdmin, 'api')
        ->putJson("/api/categories/{$category->id}", [
            'name'        => 'Telemedicine Operations',
            'code'        => 'TMED',
            'description' => 'Updated description for telemedicine',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Telemedicine Operations');

    expect($category->fresh()->name)->toBe('Telemedicine Operations');
});

it('allows super admin to toggle category active status', function () {
    $category = Category::create([
        'name'      => 'Legacy Systems',
        'code'      => 'LEGACY',
        'is_active' => true,
    ]);

    $res = $this->actingAs($this->superAdmin, 'api')
        ->patchJson("/api/categories/{$category->id}/toggle-active")
        ->assertOk();

    expect($category->fresh()->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($this->superAdmin, 'api')
        ->patchJson("/api/categories/{$category->id}/toggle-active")
        ->assertOk();

    expect($category->fresh()->is_active)->toBeTrue();
});

it('prevents deleting category if tickets are linked to it', function () {
    $category = Category::create([
        'name'      => 'Operating Theater IT',
        'code'      => 'OT_IT',
        'is_active' => true,
    ]);

    $status = TicketStatus::first();
    $priority = Priority::first();

    // Create a ticket linked to this category
    Ticket::create([
        'ticket_number' => 'TCK-OT-001',
        'title'         => 'Anesthesia monitor display issue',
        'description'   => 'Monitor in OT 3 is flickering during operations',
        'category_id'   => $category->id,
        'priority_id'   => $priority->id,
        'status_id'     => $status->id,
        'department_id' => $this->dept->id,
        'created_by'    => $this->superAdmin->id,
    ]);

    $this->actingAs($this->superAdmin, 'api')
        ->deleteJson("/api/categories/{$category->id}")
        ->assertStatus(422)
        ->assertJsonPath('error', 'referenced_by_tickets');

    expect(Category::find($category->id))->not->toBeNull();
});

it('allows creating, updating and toggling subcategories under a category', function () {
    $category = Category::create([
        'name'      => 'Radiology Imaging',
        'code'      => 'RAD_IMG',
        'is_active' => true,
    ]);

    // Create Subcategory
    $subRes = $this->actingAs($this->superAdmin, 'api')
        ->postJson('/api/sub-categories', [
            'category_id' => $category->id,
            'name'        => 'MRI Console',
            'code'        => 'MRI',
            'sort_order'  => 1,
            'is_active'   => true,
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.name', 'MRI Console');

    $subId = $subRes->json('data.id');

    // Duplicate subcategory under same category must be rejected
    $this->actingAs($this->superAdmin, 'api')
        ->postJson('/api/sub-categories', [
            'category_id' => $category->id,
            'name'        => 'MRI Console',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name']);

    // Update subcategory
    $this->actingAs($this->superAdmin, 'api')
        ->putJson("/api/sub-categories/{$subId}", [
            'name' => 'MRI Workstation',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'MRI Workstation');

    // Toggle active
    $this->actingAs($this->superAdmin, 'api')
        ->patchJson("/api/sub-categories/{$subId}/toggle-active")
        ->assertOk();

    expect(SubCategory::find($subId)->is_active)->toBeFalse();
});

it('forbids regular users from creating or modifying categories', function () {
    $this->actingAs($this->regularUser, 'api')
        ->postJson('/api/categories', [
            'name' => 'Unauthorized Category',
            'code' => 'UNAUTH',
        ])
        ->assertStatus(403);

    $category = Category::first();

    $this->actingAs($this->regularUser, 'api')
        ->putJson("/api/categories/{$category->id}", [
            'name' => 'Hacked Name',
        ])
        ->assertStatus(403);

    $this->actingAs($this->regularUser, 'api')
        ->deleteJson("/api/categories/{$category->id}")
        ->assertStatus(403);
});

it('validates subcategory belongs to category during ticket creation', function () {
    $cat1 = Category::create(['name' => 'Cat One', 'code' => 'C1', 'is_active' => true]);
    $cat2 = Category::create(['name' => 'Cat Two', 'code' => 'C2', 'is_active' => true]);

    $sub2 = SubCategory::create(['category_id' => $cat2->id, 'name' => 'Sub Under Cat 2', 'is_active' => true]);

    $status = TicketStatus::first();
    $priority = Priority::first();

    // Trying to create ticket with Cat One, but subcategory from Cat Two
    $this->actingAs($this->regularUser, 'api')
        ->postJson('/api/tickets', [
            'title'           => 'Mismatch Test Ticket',
            'description'     => 'Testing category and subcategory relationship validation',
            'category_id'     => $cat1->id,
            'sub_category_id' => $sub2->id, // Mismatch!
            'priority_id'     => $priority->id,
            'department_id'   => $this->dept->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['sub_category_id']);
});
