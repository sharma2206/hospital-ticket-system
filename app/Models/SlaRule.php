<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlaRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'priority_id',
        'response_minutes',
        'resolution_minutes',
        'name',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'response_minutes' => 'integer',
        'resolution_minutes' => 'integer',
    ];

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }

    public function getResponseHoursAttribute(): float
    {
        return round($this->response_minutes / 60, 1);
    }

    public function getResolutionHoursAttribute(): float
    {
        return round($this->resolution_minutes / 60, 1);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public static function forPriority(int $priorityId): ?self
    {
        return static::where('priority_id', $priorityId)->where('is_active', true)->first();
    }
}
