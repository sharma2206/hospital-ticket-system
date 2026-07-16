<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('priority_id')->constrained()->cascadeOnDelete();
            $table->integer('response_minutes')->default(60);    // First response SLA
            $table->integer('resolution_minutes')->default(480); // Resolution SLA
            $table->string('name')->nullable();                  // e.g., "Critical SLA"
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_rules');
    }
};
