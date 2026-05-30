<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'category_id',
        'priority_id',
        'status_id',
        'created_by',
        'assigned_to',
        'department_id',
        'estimated_resolution_date',
        'actual_resolution_date',
        'resolved_at',
        'closed_at',
        'resolution_notes',
        'is_escalated',
        'escalated_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'estimated_resolution_date' => 'datetime',
        'actual_resolution_date' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'escalated_at' => 'datetime',
        'is_escalated' => 'boolean',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }

    public function status()
    {
        return $this->belongsTo(TicketStatus::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function history()
    {
        return $this->hasMany(TicketHistory::class)->orderBy('created_at', 'desc');
    }

    public function assignments()
    {
        return $this->hasMany(TicketAssignment::class);
    }

    public function sla()
    {
        return $this->hasOne(TicketSLA::class);
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class);
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('name', 'Open');
        });
    }

    public function scopeInProgress($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('name', 'In Progress');
        });
    }

    public function scopeResolved($query)
    {
        return $query->whereHas('status', function ($q) {
            $q->where('name', 'Resolved');
        });
    }

    public function scopeEscalated($query)
    {
        return $query->where('is_escalated', true);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByPriority($query, $priorityId)
    {
        return $query->where('priority_id', $priorityId);
    }

    public function scopeByAssignee($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    // Methods
    public function markAsInProgress()
    {
        $this->update(['status_id' => TicketStatus::where('name', 'In Progress')->first()->id]);
    }

    public function markAsResolved($notes = null)
    {
        $this->update([
            'status_id' => TicketStatus::where('name', 'Resolved')->first()->id,
            'resolved_at' => now(),
            'actual_resolution_date' => now(),
            'resolution_notes' => $notes,
        ]);
    }

    public function markAsClosed()
    {
        $this->update([
            'status_id' => TicketStatus::where('name', 'Closed')->first()->id,
            'closed_at' => now(),
        ]);
    }

    public function escalate($reason = null)
    {
        $this->update([
            'is_escalated' => true,
            'escalated_at' => now(),
        ]);
    }

    public function getTimeToResolution()
    {
        if ($this->resolved_at && $this->created_at) {
            return $this->resolved_at->diffInMinutes($this->created_at);
        }
        return null;
    }
}
