<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot: tickets linked to knowledge articles
        Schema::create('ticket_knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('knowledge_article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('linked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['ticket_id', 'knowledge_article_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_knowledge_articles');
    }
};
