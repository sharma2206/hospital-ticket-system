<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class KnowledgeArticle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'content',
        'symptoms',
        'solution_summary',
        'tags',
        'attachments',
        'status',
        'author_id',
        'updated_by',
        'views',
        'helpful_count',
        'not_helpful_count',
        'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'attachments' => 'array',
        'views' => 'integer',
        'helpful_count' => 'integer',
        'not_helpful_count' => 'integer',
        'published_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function tickets()
    {
        return $this->belongsToMany(Ticket::class, 'ticket_knowledge_articles')
                    ->withPivot('linked_by')
                    ->withTimestamps();
    }

    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function unpublish(): void
    {
        $this->update([
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('content', 'like', "%{$term}%")
              ->orWhere('solution_summary', 'like', "%{$term}%");
        });
    }
}
