<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketSLA extends Model
{
    use HasFactory;

    protected $table = 'ticket_slas';

    protected $fillable = [
        'ticket_id',
        'priority_id',
        'target_resolution_time',
        'target_response_time',
        'target_resolution_date',
        'target_response_date',
        'actual_response_date',
        'actual_resolution_date',
        'is_breached',
        'breach_type',
        'breached_at',
    ];

    protected $casts = [
        'target_resolution_date' => 'datetime',
        'target_response_date' => 'datetime',
        'actual_response_date' => 'datetime',
        'actual_resolution_date' => 'datetime',
        'breached_at' => 'datetime',
        'is_breached' => 'boolean',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }

    public function checkBreach()
    {
        if (now() > $this->target_resolution_date && !$this->ticket->resolved_at) {
            $this->update([
                'is_breached' => true,
                'breach_type' => 'resolution',
                'breached_at' => now(),
            ]);
        }
    }
}
