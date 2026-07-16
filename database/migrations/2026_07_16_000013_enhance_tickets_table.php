<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Location fields
            $table->foreignId('branch_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            $table->string('building', 100)->nullable()->after('branch_id');
            $table->string('floor', 20)->nullable()->after('building');
            $table->string('room_number', 50)->nullable()->after('floor');
            $table->string('location_detail', 255)->nullable()->after('room_number');

            // Requester fields
            $table->string('requester_name', 150)->nullable()->after('location_detail');
            $table->string('requester_employee_id', 50)->nullable()->after('requester_name');
            $table->string('requester_mobile', 20)->nullable()->after('requester_employee_id');
            $table->string('requester_email', 150)->nullable()->after('requester_mobile');

            // Classification
            $table->foreignId('sub_category_id')->nullable()->after('category_id')->constrained()->nullOnDelete();
            $table->foreignId('asset_id')->nullable()->after('sub_category_id')->constrained()->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->after('asset_id')->constrained()->nullOnDelete();
            $table->enum('source', ['self_service', 'email', 'whatsapp', 'phone', 'walk_in', 'mobile_app', 'vendor', 'monitoring', 'api'])->default('self_service')->after('vendor_id');
            $table->enum('impact', ['low', 'medium', 'high', 'critical'])->default('low')->after('source');
            $table->enum('urgency', ['low', 'medium', 'high', 'critical'])->default('low')->after('impact');

            // Team
            $table->foreignId('team_lead_id')->nullable()->after('assigned_to')->constrained('users')->nullOnDelete();

            // SLA
            $table->boolean('sla_breached')->default(false)->after('is_escalated');
            $table->timestamp('first_response_at')->nullable()->after('sla_breached');
            $table->timestamp('due_date')->nullable()->after('first_response_at');
            $table->integer('sla_paused_duration')->default(0)->after('due_date'); // minutes
            $table->timestamp('sla_paused_at')->nullable()->after('sla_paused_duration');

            // Resolution
            $table->text('root_cause')->nullable()->after('resolution_notes');
            $table->text('closure_notes')->nullable()->after('root_cause');

            // Feedback
            $table->tinyInteger('rating')->nullable()->after('closure_notes');

            // Indexes
            $table->index(['branch_id', 'status_id']);
            $table->index(['sla_breached', 'status_id']);
            $table->index(['due_date', 'status_id']);
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['sub_category_id']);
            $table->dropForeign(['asset_id']);
            $table->dropForeign(['vendor_id']);
            $table->dropForeign(['team_lead_id']);
            $table->dropColumns([
                'branch_id', 'building', 'floor', 'room_number', 'location_detail',
                'requester_name', 'requester_employee_id', 'requester_mobile', 'requester_email',
                'sub_category_id', 'asset_id', 'vendor_id', 'source', 'impact', 'urgency',
                'team_lead_id', 'sla_breached', 'first_response_at', 'due_date',
                'sla_paused_duration', 'sla_paused_at', 'root_cause', 'closure_notes', 'rating',
            ]);
        });
    }
};
