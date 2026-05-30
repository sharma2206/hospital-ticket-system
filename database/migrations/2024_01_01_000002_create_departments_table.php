<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');                          // Billing, Pharmacy, OPD
            $table->string('code')->unique();                // BILL, PHRM, OPD
            $table->string('location')->nullable();          // Block A, Floor 2
            $table->string('head_name')->nullable();         // Department head
            $table->string('contact_no')->nullable();        // Department phone
            $table->string('email')->nullable();             // dept email
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
