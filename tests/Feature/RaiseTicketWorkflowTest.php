<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Category;
use App\Models\SubCategory;
use App\Models\Priority;
use App\Models\TicketStatus;
use App\Models\Ticket;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TicketStatusesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\CategoriesSeeder;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(TicketStatusesSeeder::class);
    $this->seed(PrioritiesSeeder::class);
    $this->seed(CategoriesSeeder::class);

    $this->branch = Branch::first() ?? Branch::create([
        'name' => 'Main Hospital',
        'code' => 'MAIN',
        'city' => 'Delhi',
        'is_active' => true,
    ]);

    $this->dept = Department::first() ?? Department::create([
        'name' => 'Emergency Department',
        'code' => 'EMRG',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);

    // Regular hospital employee
    $this->nurse = User::factory()->create([
        'first_name'    => 'Sarah',
        'last_name'     => 'Connor',
        'email'         => 'sarah.connor@hospital.org',
        'phone'         => '9876543210',
        'employee_id'   => 'NUR-4019',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);
    $this->nurse->syncRoles(['user']);

    // IT Technician
    $this->technician = User::factory()->create([
        'first_name'    => 'David',
        'last_name'     => 'Tech',
        'email'         => 'david.tech@hospital.org',
        'employee_id'   => 'IT-008',
    ]);
    $this->technician->syncRoles(['technician']);

    $this->category = Category::where('is_active', true)->first();
    $this->priority = Priority::where('name', 'medium')->first() ?? Priority::first();
});

it('allows an employee to raise a ticket with minimal manual input using auto-populated defaults', function () {
    $res = $this->actingAs($this->nurse, 'api')
        ->postJson('/api/tickets', [
            'title'                 => 'ICU Monitor 3 display flickering',
            'description'           => 'Patient telemetry monitor display shows horizontal lines intermittently.',
            'category_id'           => $this->category->id,
            'priority_id'           => $this->priority->id,
            'department_id'         => $this->nurse->department_id,
            'branch_id'             => $this->nurse->branch_id,
            'requester_name'        => $this->nurse->full_name,
            'requester_email'       => $this->nurse->email,
            'requester_employee_id' => $this->nurse->employee_id,
            'requester_mobile'      => $this->nurse->phone,
            'source'                => 'self_service',
        ])
        ->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => ['id', 'ticket_number', 'title', 'status', 'priority'],
        ]);

    $ticket = Ticket::find($res->json('data.id'));
    expect($ticket)->not->toBeNull();
    expect($ticket->created_by)->toBe($this->nurse->id);
    expect($ticket->department_id)->toBe($this->dept->id);
    expect($ticket->source)->toBe('self_service');
});

it('allows IT technician to raise a ticket on behalf of another employee via phone or walk-in', function () {
    $res = $this->actingAs($this->technician, 'api')
        ->postJson('/api/tickets', [
            'title'                 => 'Reported printer paper jam in Billing',
            'description'           => 'Staff reported receipt printer jam via hospital helpline phone call.',
            'category_id'           => $this->category->id,
            'priority_id'           => $this->priority->id,
            'department_id'         => $this->dept->id,
            'branch_id'             => $this->branch->id,
            'requester_name'        => 'Dr. Robert Kelvin',
            'requester_employee_id' => 'DOC-1022',
            'requester_mobile'      => '9123456780',
            'source'                => 'phone',
        ])
        ->assertStatus(201);

    $ticket = Ticket::find($res->json('data.id'));
    expect($ticket->created_by)->toBe($this->technician->id);
    expect($ticket->requester_name)->toBe('Dr. Robert Kelvin');
    expect($ticket->source)->toBe('phone');
});

it('uploads ticket with attachments successfully', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->create('error_log.txt', 120, 'text/plain');

    $res = $this->actingAs($this->nurse, 'api')
        ->postJson('/api/tickets', [
            'title'         => 'System crash with attached diagnostics',
            'description'   => 'Attaching error logs captured during system freeze.',
            'category_id'   => $this->category->id,
            'priority_id'   => $this->priority->id,
            'department_id' => $this->dept->id,
            'attachments'   => [$file],
        ])
        ->assertStatus(201);

    $ticket = Ticket::find($res->json('data.id'));
    expect($ticket->attachments()->count())->toBe(1);
});

it('validates required fields and returns clean error messages without data loss', function () {
    $res = $this->actingAs($this->nurse, 'api')
        ->postJson('/api/tickets', [
            'description' => 'Missing title and category',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['title', 'category_id', 'priority_id', 'department_id']);
});
