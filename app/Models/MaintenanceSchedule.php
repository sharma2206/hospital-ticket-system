<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceSchedule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'asset_id',
        'title',
        'description',
        'type',
        'frequency',
        'next_due_date',
        'last_done_date',
        'assigned_to',
        'department_id',
        'status',
        'reminder_days',
        'notes',
        'completion_notes',
        'completed_at',
        'completed_by',
        'is_active',
    ];

    protected $casts = [
        'next_due_date' => 'date',
        'last_done_date' => 'date',
        'completed_at' => 'datetime',
        'is_active' => 'boolean',
        'reminder_days' => 'integer',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedByUser()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function isOverdue(): bool
    {
        return $this->next_due_date->isPast() && $this->status !== 'completed';
    }

    public function isDueSoon(): bool
    {
        return $this->next_due_date->diffInDays(now()) <= $this->reminder_days
               && $this->status === 'pending';
    }

    public function markComplete(int $userId, string $notes = null): void
    {
        $lastDone = $this->next_due_date;
        $nextDue = match($this->frequency) {
            'daily'     => now()->addDay(),
            'weekly'    => now()->addWeek(),
            'monthly'   => now()->addMonth(),
            'quarterly' => now()->addMonths(3),
            'biannual'  => now()->addMonths(6),
            'yearly'    => now()->addYear(),
            default     => null,
        };

        $this->update([
            'status'           => 'completed',
            'completed_at'     => now(),
            'completed_by'     => $userId,
            'last_done_date'   => $lastDone,
            'completion_notes' => $notes,
            'next_due_date'    => $nextDue ?? $this->next_due_date,
        ]);

        // Reset status for recurring
        if ($this->frequency !== 'one_time' && $nextDue) {
            $this->update(['status' => 'pending']);
        }
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending')->where('is_active', true);
    }

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->where('status', 'pending')
                     ->whereDate('next_due_date', '<=', now()->addDays($days))
                     ->whereDate('next_due_date', '>=', now());
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
                     ->whereDate('next_due_date', '<', now());
    }
}
