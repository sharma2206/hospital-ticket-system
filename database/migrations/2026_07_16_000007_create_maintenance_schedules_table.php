<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['preventive', 'corrective', 'inspection', 'calibration'])->default('preventive');
            $table->enum('frequency', ['one_time', 'daily', 'weekly', 'monthly', 'quarterly', 'biannual', 'yearly'])->default('monthly');
            $table->date('next_due_date');
            $table->date('last_done_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'])->default('pending');
            $table->integer('reminder_days')->default(3); // days before due date to send reminder
            $table->text('notes')->nullable();
            $table->text('completion_notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['next_due_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedules');
    }
};
