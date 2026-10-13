<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetHistory;
use App\Models\MaintenanceSchedule;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\TicketStatusesSeeder;
use Database\Seeders\PrioritiesSeeder;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\AssetCategoriesSeeder;
use Carbon\Carbon;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(TicketStatusesSeeder::class);
    $this->seed(PrioritiesSeeder::class);
    $this->seed(CategoriesSeeder::class);
    $this->seed(AssetCategoriesSeeder::class);

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

    // Admin user with manage-assets permission
    $this->admin = User::factory()->create([
        'first_name'  => 'Admin',
        'last_name'   => 'User',
        'email'       => 'admin.asset@hospital.org',
        'employee_id' => 'ADM-001',
    ]);
    $this->admin->syncRoles(['super_admin']);

    // Staff member
    $this->employee = User::factory()->create([
        'first_name'    => 'Doctor',
        'last_name'     => 'John',
        'email'         => 'john.doc@hospital.org',
        'employee_id'   => 'DOC-101',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);
    $this->employee->syncRoles(['user']);

    // Another staff member
    $this->employee2 = User::factory()->create([
        'first_name'    => 'Nurse',
        'last_name'     => 'Alice',
        'email'         => 'alice.nurse@hospital.org',
        'employee_id'   => 'NUR-202',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);
    $this->employee2->syncRoles(['user']);
});

test('asset dashboard returns real calculated metrics and distributions', function () {
    // Create some distinct test assets
    Asset::create([
        'asset_code'             => 'AST-TEST-001',
        'name'                   => 'Ultrasound Diagnostic Unit',
        'category'               => 'Diagnostic Device',
        'status'                 => 'active',
        'condition'              => 'good',
        'cost'                   => 250000.00,
        'warranty_expiry'        => Carbon::now()->addDays(15), // expiring soon
        'next_maintenance_date'  => Carbon::now()->addDays(5),  // due soon
        'assigned_user_id'       => $this->employee->id,
        'department_id'          => $this->dept->id,
        'branch_id'              => $this->branch->id,
    ]);

    Asset::create([
        'asset_code'             => 'AST-TEST-002',
        'name'                   => 'ICU Monitor',
        'category'               => 'Patient Monitor',
        'status'                 => 'maintenance',
        'condition'              => 'fair',
        'cost'                   => 80000.00,
        'warranty_expiry'        => Carbon::now()->subDays(10), // expired
        'next_maintenance_date'  => Carbon::now()->subDays(2),  // overdue
        'department_id'          => $this->dept->id,
        'branch_id'              => $this->branch->id,
    ]);

    $response = $this->actingAs($this->admin, 'api')
        ->getJson('/api/assets/dashboard');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'counts' => [
                    'total',
                    'active',
                    'assigned',
                    'available',
                    'under_maintenance',
                    'retired',
                    'disposed',
                    'warranty_expiring_soon',
                    'warranty_expired',
                    'maintenance_due_soon',
                    'maintenance_overdue',
                    'total_cost',
                ],
                'distributions' => [
                    'by_category',
                    'by_status',
                    'by_branch',
                    'by_department',
                ],
            ],
        ]);

    $data = $response->json('data.counts');
    expect($data['total'])->toBeGreaterThanOrEqual(2);
    expect($data['warranty_expiring_soon'])->toBeGreaterThanOrEqual(1);
    expect($data['warranty_expired'])->toBeGreaterThanOrEqual(1);
    expect($data['maintenance_due_soon'])->toBeGreaterThanOrEqual(1);
    expect($data['total_cost'])->toBeGreaterThanOrEqual(330000.00);
});

test('asset registry supports search and filters', function () {
    Asset::create([
        'asset_code'    => 'AST-REG-999',
        'name'          => 'Unique Portable ECG Device',
        'category'      => 'Diagnostic Device',
        'status'        => 'active',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);

    // Search by code
    $resSearch = $this->actingAs($this->admin, 'api')
        ->getJson('/api/assets?search=AST-REG-999');
    $resSearch->assertStatus(200);
    expect(count($resSearch->json('data')))->toBe(1);
    expect($resSearch->json('data.0.asset_code'))->toBe('AST-REG-999');

    // Filter by department
    $resDept = $this->actingAs($this->admin, 'api')
        ->getJson("/api/assets?department_id={$this->dept->id}");
    $resDept->assertStatus(200);
    expect(count($resDept->json('data')))->toBeGreaterThanOrEqual(1);
});

test('asset registration auto-generates code and logs history', function () {
    $payload = [
        'name'             => 'Clinical Workstation 12',
        'category'         => 'Desktop',
        'brand'            => 'HP',
        'model'            => 'EliteDesk 800',
        'serial_number'    => 'SN-HP-8877',
        'status'           => 'active',
        'condition'        => 'good',
        'cost'             => 45000.00,
        'department_id'    => $this->dept->id,
        'branch_id'        => $this->branch->id,
        'assigned_user_id' => $this->employee->id,
    ];

    $response = $this->actingAs($this->admin, 'api')
        ->postJson('/api/assets', $payload);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'Clinical Workstation 12');

    $assetId = $response->json('data.id');
    $assetCode = $response->json('data.asset_code');
    expect($assetCode)->not->toBeEmpty();

    // Verify AssetHistory was created
    $histories = AssetHistory::where('asset_id', $assetId)->get();
    expect($histories->count())->toBeGreaterThanOrEqual(1);
    expect($histories->pluck('action')->toArray())->toContain('created');
});

test('asset custody assignment, transfer, and return workflow', function () {
    // 1. Create unassigned asset
    $asset = Asset::create([
        'asset_code'    => 'AST-CUST-100',
        'name'          => 'MacBook Pro Medical Imaging',
        'category'      => 'Laptop',
        'status'        => 'inactive',
        'condition'     => 'good',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);

    // 2. Assign to employee 1
    $assignRes = $this->actingAs($this->admin, 'api')
        ->postJson("/api/assets/{$asset->id}/assign", [
            'assigned_user_id' => $this->employee->id,
            'department_id'    => $this->dept->id,
            'branch_id'        => $this->branch->id,
            'location'         => 'Doctor Cabin 1',
            'condition'        => 'good',
            'notes'            => 'Issued for telemedicine',
        ]);

    $assignRes->assertStatus(200);
    $asset->refresh();
    expect($asset->assigned_user_id)->toBe($this->employee->id);
    expect($asset->status)->toBe('active');

    // 3. Transfer from employee 1 to employee 2 with handover notes
    $transferRes = $this->actingAs($this->admin, 'api')
        ->postJson("/api/assets/{$asset->id}/transfer", [
            'to_user_id'       => $this->employee2->id,
            'to_department_id' => $this->dept->id,
            'to_branch_id'     => $this->branch->id,
            'to_location'      => 'ICU Desk B',
            'condition'        => 'good',
            'handover_notes'   => 'Transferred custody with original magsafe charger',
        ]);

    $transferRes->assertStatus(200);
    $asset->refresh();
    expect($asset->assigned_user_id)->toBe($this->employee2->id);

    // 4. Return to inventory pool
    $returnRes = $this->actingAs($this->admin, 'api')
        ->postJson("/api/assets/{$asset->id}/return", [
            'return_condition' => 'good',
            'return_location'  => 'Central IT Storage Rack 2',
            'notes'            => 'Returned after shift rotation',
        ]);

    $returnRes->assertStatus(200);
    $asset->refresh();
    expect($asset->assigned_user_id)->toBeNull();
    expect($asset->location)->toBe('Central IT Storage Rack 2');

    // Verify all history entries are preserved
    $historyActions = AssetHistory::where('asset_id', $asset->id)->pluck('action')->toArray();
    expect($historyActions)->toContain('assigned');
    expect($historyActions)->toContain('transferred');
    expect($historyActions)->toContain('returned');
});

test('preventive maintenance schedule and completion automatically calculates next due date', function () {
    $asset = Asset::create([
        'asset_code'            => 'AST-PM-001',
        'name'                  => 'Surgical Laser Terminal',
        'category'              => 'Clinical Equipment',
        'status'                => 'active',
        'next_maintenance_date' => Carbon::now()->addDays(5),
    ]);

    // 1. Create a quarterly maintenance schedule
    $createScheduleRes = $this->actingAs($this->admin, 'api')
        ->postJson('/api/maintenance-schedules', [
            'asset_id'         => $asset->id,
            'title'            => 'Optics Calibration and Dust Purge',
            'maintenance_type' => 'preventive',
            'frequency'        => 'quarterly',
            'scheduled_date'   => Carbon::now()->toDateString(),
            'assigned_to'      => $this->admin->id,
            'cost'             => 5000.00,
        ]);

    $createScheduleRes->assertStatus(201);
    $scheduleId = $createScheduleRes->json('data.id');

    // 2. Complete the maintenance schedule
    $completeRes = $this->actingAs($this->admin, 'api')
        ->postJson("/api/maintenance-schedules/{$scheduleId}/complete", [
            'work_performed' => 'Cleaned mirrors, tested optical sensors, calibrated power levels',
            'parts_replaced' => 'Filter mesh',
            'cost'           => 4800.00,
            'notes'          => 'All parameters within normal tolerance',
        ]);

    $completeRes->assertStatus(200);

    // Verify schedule status is completed
    $schedule = MaintenanceSchedule::find($scheduleId);
    expect($schedule->status)->toBe('completed');
    expect($schedule->completed_by)->toBe($this->admin->id);

    // Verify asset's last and next maintenance dates are safely updated
    $asset->refresh();
    expect($asset->last_maintenance_date)->not->toBeNull();
    expect($asset->next_maintenance_date)->not->toBeNull();
    // Next due date for quarterly should be roughly 3 months later
    expect(Carbon::now()->diffInDays(Carbon::parse($asset->next_maintenance_date)))->toBeGreaterThanOrEqual(80);
});

test('asset categories can be dynamically managed and toggled', function () {
    // Create new category
    $createRes = $this->actingAs($this->admin, 'api')
        ->postJson('/api/asset-categories', [
            'name'        => 'Dialysis Equipment',
            'code'        => 'DIA',
            'description' => 'Hemodialysis and peritoneal dialysis clinical machines',
            'is_active'   => true,
        ]);

    $createRes->assertStatus(201);
    $catId = $createRes->json('data.id');

    // Toggle active status
    $toggleRes = $this->actingAs($this->admin, 'api')
        ->patchJson("/api/asset-categories/{$catId}/toggle-active");

    $toggleRes->assertStatus(200)
        ->assertJsonPath('data.is_active', false);

    $cat = AssetCategory::find($catId);
    expect($cat->is_active)->toBeFalse();
});

test('asset csv export streams data with appropriate headers', function () {
    Asset::create([
        'asset_code' => 'AST-EXP-001',
        'name'       => 'Export Test Monitor',
        'category'   => 'Monitor',
        'status'     => 'active',
    ]);

    $response = $this->actingAs($this->admin, 'api')
        ->get('/api/assets/export');

    $response->assertStatus(200);
    expect($response->headers->get('content-type'))->toContain('text/csv');
    expect($response->streamedContent())->toContain('Asset Code');
    expect($response->streamedContent())->toContain('AST-EXP-001');
});
