<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ticket_type', 20)->default('internal')->after('ticket_number');
            $table->string('karexpert_ref_id')->nullable()->after('ticket_type');
            $table->string('karexpert_module')->nullable()->after('karexpert_ref_id');
            $table->string('karexpert_contact')->nullable()->after('karexpert_module');
            $table->foreignId('parent_ticket_id')->nullable()->after('karexpert_contact')
                  ->constrained('tickets')->onDelete('set null');

            $table->index('ticket_type');
            $table->index('karexpert_module');
            $table->index('parent_ticket_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['parent_ticket_id']);
            $table->dropIndex(['ticket_type']);
            $table->dropIndex(['karexpert_module']);
            $table->dropIndex(['parent_ticket_id']);
            $table->dropColumn([
                'ticket_type',
                'karexpert_ref_id',
                'karexpert_module',
                'karexpert_contact',
                'parent_ticket_id',
            ]);
        });
    }
};
