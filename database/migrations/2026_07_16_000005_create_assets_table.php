<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code', 50)->unique();
            $table->string('name');
            $table->string('category', 100); // Hardware, Software, Network, etc.
            $table->string('sub_category', 100)->nullable();
            $table->string('brand', 100)->nullable();
            $table->string('model', 150)->nullable();
            $table->string('serial_number', 100)->nullable()->unique();
            $table->date('purchase_date')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->date('amc_expiry')->nullable();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['active', 'inactive', 'maintenance', 'retired', 'disposed'])->default('active');
            $table->enum('condition', ['excellent', 'good', 'fair', 'poor'])->default('good');
            $table->date('last_maintenance_date')->nullable();
            $table->date('next_maintenance_date')->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->decimal('depreciation_rate', 5, 2)->nullable(); // percentage per year
            $table->string('qr_code', 255)->nullable();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('location', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('mac_address', 17)->nullable();
            $table->string('hostname', 100)->nullable();
            $table->string('os_version', 100)->nullable();
            $table->text('specifications')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'department_id']);
            $table->index(['category', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
