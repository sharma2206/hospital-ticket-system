<?php

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Category;
use App\Models\Priority;
use App\Models\TicketStatus;
use App\Models\Ticket;
use App\Models\Asset;
use App\Models\KnowledgeArticle;
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

    $category = Category::first();
    $priority = Priority::first();
    $status = TicketStatus::first();

    $this->ticket = Ticket::create([
        'ticket_number' => 'IT-2026-111111',
        'ticket_type'   => 'internal',
        'title'         => 'Sample Test Ticket',
        'description'   => 'Sample description for testing',
        'created_by'    => $this->admin->id,
        'department_id' => $this->dept->id,
        'category_id'   => $category->id,
        'priority_id'   => $priority->id,
        'status_id'     => $status->id,
        'source'        => 'self_service',
    ]);

    $this->kxTicket = Ticket::create([
        'ticket_number'    => 'KX-2026-222222',
        'ticket_type'      => 'karexpert',
        'title'            => 'Sample KX Ticket',
        'description'      => 'Sample KX description',
        'karexpert_module' => 'Billing',
        'created_by'       => $this->admin->id,
        'department_id'    => $this->dept->id,
        'category_id'      => $category->id,
        'priority_id'      => $priority->id,
        'status_id'        => $status->id,
        'source'           => 'self_service',
    ]);

    $this->asset = Asset::create([
        'asset_code'    => 'AST-TEST-001',
        'name'          => 'Diagnostic Workstation',
        'category'      => 'Hardware',
        'status'        => 'active',
        'department_id' => $this->dept->id,
        'branch_id'     => $this->branch->id,
    ]);

    $this->article = KnowledgeArticle::create([
        'title'       => 'Test KB Article',
        'slug'        => 'test-kb-article',
        'content'     => '<p>Test content</p>',
        'status'      => 'published',
        'author_id'   => $this->admin->id,
        'category_id' => $category->id,
    ]);
});

it('audits all GET API endpoints for status 200 and valid JSON', function () {
    $endpoints = [
        // Auth & User
        '/api/auth/me',
        '/api/dashboard',
        '/api/it-staff',
        '/api/users',
        "/api/users/{$this->admin->id}",
        '/api/roles',

        // Tickets & Reference
        '/api/tickets',
        "/api/tickets/{$this->ticket->id}",
        "/api/tickets/{$this->ticket->id}/comments",
        '/api/categories',
        '/api/sub-categories',
        '/api/priorities',
        '/api/ticket-statuses',
        '/api/statuses',
        '/api/vendors',
        '/api/sla-rules',

        // Organization
        '/api/departments',
        '/api/branches',
        "/api/branches/{$this->branch->id}",

        // Assets
        '/api/assets',
        '/api/assets/categories',
        "/api/assets/{$this->asset->id}",
        "/api/assets/{$this->asset->id}/history",

        // Knowledge Base
        '/api/knowledge',
        "/api/knowledge/{$this->article->id}",

        // Notifications
        '/api/notifications',
        '/api/notifications/unread-count',

        // Reports
        '/api/reports/tickets',
        '/api/reports/sla',
        '/api/reports/technician',
        '/api/reports/satisfaction',
        '/api/reports/assets',

        // Audit Logs
        '/api/audit-logs',
        '/api/audit-logs/actions',
        '/api/audit-logs/modules',

        // Settings & Search
        '/api/settings',
        '/api/settings/groups',
        '/api/search?q=test',

        // KareXpert Integration
        '/api/karexpert/dashboard',
        '/api/karexpert/tickets',
        "/api/karexpert/tickets/{$this->kxTicket->id}",
        '/api/karexpert-statuses',
        '/api/karexpert-modules',
        '/api/karexpert-categories',
    ];

    foreach ($endpoints as $url) {
        $response = $this->actingAs($this->admin, 'api')->getJson($url);
        expect($response->status())->toBe(200, "Failed asserting 200 OK on GET {$url}. Response: " . $response->getContent());
    }
});

it('audits KareXpert ticket creation API endpoint', function () {
    $category = Category::first();
    $priority = Priority::first();

    $response = $this->actingAs($this->admin, 'api')->postJson('/api/karexpert/tickets', [
        'title'            => 'Billing printer sync failure',
        'description'      => 'OPD billing desk unable to print receipts',
        'karexpert_module' => 'Billing',
        'category_id'      => $category->id,
        'priority_id'      => $priority->id,
        'karexpert_ref_id' => 'KX-REF-1002',
        'karexpert_contact'=> 'support@karexpert.com',
    ]);

    expect($response->status())->toBe(201, "Failed asserting 201 Created on POST /api/karexpert/tickets. Response: " . $response->getContent());
    $this->assertDatabaseHas('tickets', [
        'ticket_type'      => 'karexpert',
        'title'            => 'Billing printer sync failure',
        'karexpert_module' => 'Billing',
    ]);
});

it('audits all protected API endpoints reject unauthenticated requests with 401', function () {
    $protectedUrls = [
        '/api/dashboard',
        '/api/tickets',
        '/api/karexpert/dashboard',
        '/api/karexpert/tickets',
        '/api/karexpert-categories',
        '/api/karexpert-modules',
        '/api/karexpert-statuses',
        '/api/assets',
        '/api/settings',
        '/api/reports/tickets',
    ];

    foreach ($protectedUrls as $url) {
        $response = $this->getJson($url);
        expect($response->status())->toBe(401, "Expected 401 Unauthorized for unauthenticated GET {$url}");
    }
});
