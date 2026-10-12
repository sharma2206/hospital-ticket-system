<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Category;
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

    $this->admin = User::factory()->create();
    $this->admin->syncRoles(['super_admin']);

    $this->regularUser = User::factory()->create();
    $this->regularUser->syncRoles(['user']);

    $this->branch = Branch::create([
        'name' => 'Main Hospital',
        'code' => 'MAIN',
        'city' => 'Nashik',
        'is_active' => true,
    ]);

    $this->dept = Department::create([
        'name' => 'IT Department',
        'code' => 'IT',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
});

it('all report endpoints return successful responses', function () {
    $this->actingAs($this->admin, 'api')
        ->getJson('/api/reports/tickets')
        ->assertOk();

    $this->actingAs($this->admin, 'api')
        ->getJson('/api/reports/sla')
        ->assertOk();

    $this->actingAs($this->admin, 'api')
        ->getJson('/api/reports/technician')
        ->assertOk();

    $this->actingAs($this->admin, 'api')
        ->getJson('/api/reports/satisfaction')
        ->assertOk();

    $this->actingAs($this->admin, 'api')
        ->getJson('/api/reports/assets')
        ->assertOk();
});

it('settings groups route is matched before parameter route', function () {
    $this->actingAs($this->admin, 'api')
        ->getJson('/api/settings/groups')
        ->assertOk();
});

it('assets categories route is matched before parameter route', function () {
    $this->actingAs($this->admin, 'api')
        ->getJson('/api/assets/categories')
        ->assertOk();
});

it('regular users cannot delete tickets, but admins can', function () {
    $category = Category::first();
    $priority = Priority::first();
    $status = TicketStatus::first();

    $ticket = Ticket::create([
        'ticket_number' => 'IT-' . date('Y') . '-999999',
        'ticket_type'   => 'internal',
        'title'         => 'Test ticket',
        'description'   => 'Test description',
        'created_by'    => $this->regularUser->id,
        'department_id' => $this->dept->id,
        'category_id'   => $category->id,
        'priority_id'   => $priority->id,
        'status_id'     => $status->id,
        'source'        => 'self_service',
    ]);

    // Regular staff user should get 403
    $this->actingAs($this->regularUser, 'api')
        ->deleteJson("/api/tickets/{$ticket->id}")
        ->assertForbidden();

    // Admin should succeed
    $this->actingAs($this->admin, 'api')
        ->deleteJson("/api/tickets/{$ticket->id}")
        ->assertOk();

    $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);
});

it('ticket statuses endpoint and alias work properly', function () {
    $this->actingAs($this->admin, 'api')
        ->getJson('/api/ticket-statuses')
        ->assertOk()
        ->assertJsonStructure(['data']);

    $this->actingAs($this->admin, 'api')
        ->getJson('/api/statuses')
        ->assertOk()
        ->assertJsonStructure(['data']);
});
