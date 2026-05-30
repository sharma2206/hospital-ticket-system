<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('title');
            $table->longText('description');
            $table->foreignId('category_id')->constrained()->onDelete('restrict');
            $table->foreignId('priority_id')->constrained()->onDelete('restrict');
            $table->foreignId('status_id')->constrained('ticket_statuses')->onDelete('restrict');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('department_id')->constrained()->onDelete('restrict');
            $table->timestamp('estimated_resolution_date')->nullable();
            $table->timestamp('actual_resolution_date')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->longText('resolution_notes')->nullable();
            $table->boolean('is_escalated')->default(false);
            $table->timestamp('escalated_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('ticket_number');
            $table->index('created_by');
            $table->index('assigned_to');
            $table->index('department_id');
            $table->index('priority_id');
            $table->index('status_id');
            $table->index('is_escalated');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
