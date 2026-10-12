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

it('ticket assignment endpoint supports both POST and PUT methods', function () {
    $tech = User::factory()->create();
    $tech->syncRoles(['technician']);

    $category = Category::first();
    $priority = Priority::first();
    $status = TicketStatus::first();

    $ticket = Ticket::create([
        'ticket_number' => 'IT-' . date('Y') . '-888888',
        'ticket_type'   => 'internal',
        'title'         => 'Assignment test',
        'description'   => 'Test assignment',
        'created_by'    => $this->admin->id,
        'department_id' => $this->dept->id,
        'category_id'   => $category->id,
        'priority_id'   => $priority->id,
        'status_id'     => $status->id,
        'source'        => 'self_service',
    ]);

    // Test POST
    $this->actingAs($this->admin, 'api')
        ->postJson("/api/tickets/{$ticket->id}/assign", ['assigned_to' => $tech->id])
        ->assertOk();

    // Test PUT (ensuring frontend api.put does not fail with 405 Method Not Allowed)
    $this->actingAs($this->admin, 'api')
        ->putJson("/api/tickets/{$ticket->id}/assign", ['assigned_to' => $tech->id])
        ->assertOk();

    expect($ticket->fresh()->assigned_to)->toBe($tech->id);
});

it('settings endpoint supports flat format and returns both list and grouped', function () {
    \App\Models\Setting::set('app_timezone', 'Asia/Kolkata');

    $response = $this->actingAs($this->admin, 'api')
        ->getJson('/api/settings?flat=1')
        ->assertOk();

    $response->assertJsonStructure(['data', 'grouped']);
});

it('karexpert ticket update works with vendor reference and contact', function () {
    $category = Category::first();
    $priority = Priority::first();
    $status = TicketStatus::first();

    $kxTicket = Ticket::create([
        'ticket_number'    => 'KX-' . date('Y') . '-111222',
        'ticket_type'      => 'karexpert',
        'title'            => 'KareXpert HMS Integration Bug',
        'description'      => 'Billing sync delay',
        'karexpert_module' => 'billing',
        'created_by'       => $this->admin->id,
        'department_id'    => $this->dept->id,
        'category_id'      => $category->id,
        'priority_id'      => $priority->id,
        'status_id'        => $status->id,
        'source'           => 'self_service',
    ]);

    $this->actingAs($this->admin, 'api')
        ->putJson("/api/karexpert/tickets/{$kxTicket->id}", [
            'karexpert_ref_id'  => 'KX-REF-9988',
            'karexpert_contact' => 'vendor-rep@karexpert.com',
            'resolution_notes'  => 'Applied hotfix patch',
        ])
        ->assertOk();

    $fresh = $kxTicket->fresh();
    expect($fresh->karexpert_ref_id)->toBe('KX-REF-9988');
    expect($fresh->karexpert_contact)->toBe('vendor-rep@karexpert.com');
    expect($fresh->resolution_notes)->toBe('Applied hotfix patch');
});

