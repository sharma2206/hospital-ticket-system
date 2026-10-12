<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('branches')) {
            Schema::create('branches', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 20)->unique();
                $table->text('address')->nullable();
                $table->string('city', 100)->nullable();
                $table->string('phone', 20)->nullable();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->after('email')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('departments', 'manager_id')) {
                $table->foreignId('manager_id')->nullable()->after('branch_id')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'manager_id')) {
                $table->dropConstrainedForeignId('manager_id');
            }

            if (Schema::hasColumn('departments', 'branch_id')) {
                $table->dropConstrainedForeignId('branch_id');
            }
        });
    }
};
