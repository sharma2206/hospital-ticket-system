<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_slas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->onDelete('cascade');
            $table->foreignId('priority_id')->constrained()->onDelete('restrict');
            $table->integer('target_resolution_time')->comment('in minutes');
            $table->integer('target_response_time')->comment('in minutes');
            $table->timestamp('target_resolution_date')->nullable();
            $table->timestamp('target_response_date')->nullable();
            $table->timestamp('actual_response_date')->nullable();
            $table->timestamp('actual_resolution_date')->nullable();
            $table->boolean('is_breached')->default(false);
            $table->string('breach_type')->nullable();
            $table->timestamp('breached_at')->nullable();
            $table->timestamps();

            $table->index('ticket_id');
            $table->index('is_breached');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_slas');
    }
};
