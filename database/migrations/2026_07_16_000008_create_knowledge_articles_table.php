<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->longText('content');
            $table->text('symptoms')->nullable();
            $table->text('solution_summary')->nullable();
            $table->json('tags')->nullable();
            $table->json('attachments')->nullable(); // array of file paths
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('helpful_count')->default(0);
            $table->unsignedInteger('not_helpful_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->fullText(['title', 'content', 'solution_summary']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_articles');
    }
};
