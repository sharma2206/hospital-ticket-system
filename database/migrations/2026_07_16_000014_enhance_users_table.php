<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            $table->string('employee_id', 50)->nullable()->unique()->after('branch_id');
            $table->string('designation', 150)->nullable()->after('employee_id');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('designation');
            $table->date('date_of_joining')->nullable()->after('gender');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumns(['branch_id', 'employee_id', 'designation', 'gender', 'date_of_joining']);
        });
    }
};
