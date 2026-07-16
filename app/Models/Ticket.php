<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Core
        'ticket_number',
        'ticket_type',
        'title',
        'description',
        'category_id',
        'sub_category_id',
        'priority_id',
        'status_id',

        // People
        'created_by',
        'assigned_to',
        'team_lead_id',

        // Location
        'branch_id',
        'department_id',
        'building',
        'floor',
        'room_number',
        'location_detail',

        // Requester
        'requester_name',
        'requester_employee_id',
        'requester_mobile',
        'requester_email',

        // Classification
        'asset_id',
        'vendor_id',
        'source',
        'impact',
        'urgency',

        // SLA
        'sla_breached',
        'first_response_at',
        'due_date',
        'sla_paused_duration',
        'sla_paused_at',

        // Resolution
        'estimated_resolution_date',
        'actual_resolution_date',
        'resolved_at',
        'closed_at',
        'resolution_notes',
        'root_cause',
        'closure_notes',

        // Escalation
        'is_escalated',
        'escalated_at',

        // KareXpert
        'karexpert_ref_id',
        'karexpert_module',
        'karexpert_contact',

        // Parent/Child
        'parent_ticket_id',

        // Feedback
        'rating',
    ];

    protected $casts = [
        'created_at'               => 'datetime',
        'updated_at'               => 'datetime',
        'estimated_resolution_date'=> 'datetime',
        'actual_resolution_date'   => 'datetime',
        'resolved_at'              => 'datetime',
        'closed_at'                => 'datetime',
        'escalated_at'             => 'datetime',
        'first_response_at'        => 'datetime',
        'due_date'                 => 'datetime',
        'sla_paused_at'            => 'datetime',
        'is_escalated'             => 'boolean',
        'sla_breached'             => 'boolean',
        'sla_paused_duration'      => 'integer',
    ];

    // ─── Relationships ──────────────────────────────────────────────────────

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function teamLead()
    {
        return $this->belongsTo(User::class, 'team_lead_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory()
    {
        return $this->belongsTo(SubCategory::class);
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

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at');
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function history()
    {
        return $this->hasMany(TicketHistory::class)->orderByDesc('created_at');
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

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'ticket_watchers')->withTimestamps();
    }

    public function knowledgeArticles()
    {
        return $this->belongsToMany(KnowledgeArticle::class, 'ticket_knowledge_articles')
                    ->withPivot('linked_by')
                    ->withTimestamps();
    }

    public function parentTicket()
    {
        return $this->belongsTo(Ticket::class, 'parent_ticket_id');
    }

    public function childTickets()
    {
        return $this->hasMany(Ticket::class, 'parent_ticket_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    public function scopeInternal($query)
    {
        return $query->where('ticket_type', 'internal');
    }

    public function scopeKarexpert($query)
    {
        return $query->where('ticket_type', 'karexpert');
    }

    public function scopeOpen($query)
    {
        return $query->whereHas('status', fn($q) => $q->where('code', 'OPEN'));
    }

    public function scopeInProgress($query)
    {
        return $query->whereHas('status', fn($q) => $q->where('code', 'IN_PROGRESS'));
    }

    public function scopeResolved($query)
    {
        return $query->whereHas('status', fn($q) => $q->where('code', 'RESOLVED'));
    }

    public function scopeClosed($query)
    {
        return $query->whereHas('status', fn($q) => $q->where('code', 'CLOSED'));
    }

    public function scopeEscalated($query)
    {
        return $query->where('is_escalated', true);
    }

    public function scopeSlaBreached($query)
    {
        return $query->where('sla_breached', true);
    }

    public function scopeOverdue($query)
    {
        return $query->whereNotNull('due_date')
                     ->where('due_date', '<', now())
                     ->whereHas('status', fn($q) => $q->whereNotIn('code', ['RESOLVED', 'CLOSED']));
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
    }

    public function scopeByDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByPriority($query, int $priorityId)
    {
        return $query->where('priority_id', $priorityId);
    }

    public function scopeByAssignee($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    // ─── Methods ─────────────────────────────────────────────────────────────

    /**
     * Generate the next ticket number: IT-YYYY-000001
     */
    public static function generateTicketNumber(): string
    {
        $year = date('Y');
        $prefix = "IT-{$year}-";

        $latest = DB::table('tickets')
            ->where('ticket_number', 'like', "{$prefix}%")
            ->where('ticket_type', 'internal')
            ->max(DB::raw("CAST(SUBSTRING_INDEX(ticket_number, '-', -1) AS UNSIGNED)"));

        $next = ($latest ?? 0) + 1;
        return $prefix . str_pad($next, 6, '0', STR_PAD_LEFT);
    }

    public function markAsInProgress(int $userId = null): void
    {
        $status = TicketStatus::where('code', 'IN_PROGRESS')->first();
        if ($status) {
            $old = $this->status_id;
            $this->update([
                'status_id' => $status->id,
                'first_response_at' => $this->first_response_at ?? now(),
            ]);
            $this->recordHistory('status_change', $userId, $old, $status->id);
        }
    }

    public function markAsResolved(int $userId, string $notes = null, string $rootCause = null): void
    {
        $status = TicketStatus::where('code', 'RESOLVED')->first();
        if ($status) {
            $old = $this->status_id;
            $this->update([
                'status_id'            => $status->id,
                'resolved_at'          => now(),
                'actual_resolution_date'=> now(),
                'resolution_notes'     => $notes,
                'root_cause'           => $rootCause,
            ]);
            $this->recordHistory('status_change', $userId, $old, $status->id, 'Ticket resolved');
        }
    }

    public function markAsClosed(int $userId, string $closureNotes = null): void
    {
        $status = TicketStatus::where('code', 'CLOSED')->first();
        if ($status) {
            $old = $this->status_id;
            $this->update([
                'status_id'     => $status->id,
                'closed_at'     => now(),
                'closure_notes' => $closureNotes,
            ]);
            $this->recordHistory('status_change', $userId, $old, $status->id, 'Ticket closed');
        }
    }

    public function reopen(int $userId, string $reason = null): void
    {
        $status = TicketStatus::where('code', 'OPEN')->first();
        if ($status) {
            $old = $this->status_id;
            $this->update([
                'status_id'   => $status->id,
                'resolved_at' => null,
                'closed_at'   => null,
            ]);
            $this->recordHistory('reopened', $userId, $old, $status->id, $reason ?? 'Ticket reopened');
        }
    }

    public function escalate(int $userId, string $reason = null): void
    {
        $this->update([
            'is_escalated' => true,
            'escalated_at' => now(),
        ]);
        $this->recordHistory('escalation', $userId, null, null, $reason ?? 'Ticket escalated');
    }

    public function assign(int $technicianId, int $assignedBy): void
    {
        $old = $this->assigned_to;
        $this->update(['assigned_to' => $technicianId]);
        $this->recordHistory('assignment', $assignedBy, $old, $technicianId, 'Ticket assigned');
    }

    public function pauseSLA(): void
    {
        if (!$this->sla_paused_at) {
            $this->update(['sla_paused_at' => now()]);
        }
    }

    public function resumeSLA(): void
    {
        if ($this->sla_paused_at) {
            $elapsed = $this->sla_paused_at->diffInMinutes(now());
            $this->update([
                'sla_paused_duration' => $this->sla_paused_duration + $elapsed,
                'sla_paused_at'       => null,
            ]);
        }
    }

    public function getTimeToResolutionInMinutes(): ?int
    {
        if ($this->resolved_at && $this->created_at) {
            return $this->created_at->diffInMinutes($this->resolved_at);
        }
        return null;
    }

    public function getFirstResponseTimeInMinutes(): ?int
    {
        if ($this->first_response_at && $this->created_at) {
            return $this->created_at->diffInMinutes($this->first_response_at);
        }
        return null;
    }

    public function recordHistory(string $type, ?int $userId, $old, $new, ?string $desc = null): void
    {
        TicketHistory::create([
            'ticket_id'   => $this->id,
            'change_type' => $type,
            'old_value'   => $old,
            'new_value'   => $new,
            'changed_by'  => $userId,
            'description' => $desc,
        ]);
    }
}
