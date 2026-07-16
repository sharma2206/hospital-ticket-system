<?php

namespace App\Services;

use App\Models\SlaRule;
use App\Models\Ticket;
use Carbon\Carbon;

class SLAService
{
    /**
     * Calculate the SLA due date for a ticket based on priority.
     * Accounts for working hours and existing ticket creation time.
     */
    public function calculateDueDate(int $priorityId, Carbon $from = null): ?Carbon
    {
        $rule = SlaRule::where('priority_id', $priorityId)->where('is_active', true)->first();
        if (!$rule) return null;

        $from = $from ?? now();
        return $from->copy()->addMinutes($rule->resolution_minutes);
    }

    /**
     * Calculate the first response due time.
     */
    public function calculateResponseDue(int $priorityId, Carbon $from = null): ?Carbon
    {
        $rule = SlaRule::where('priority_id', $priorityId)->where('is_active', true)->first();
        if (!$rule) return null;

        $from = $from ?? now();
        return $from->copy()->addMinutes($rule->response_minutes);
    }

    /**
     * Check if a ticket has breached SLA.
     */
    public function checkBreach(Ticket $ticket): bool
    {
        if (!$ticket->due_date) return false;
        $openStatuses = \App\Models\TicketStatus::whereNotIn('code', ['RESOLVED', 'CLOSED'])->pluck('id')->toArray();
        if (!in_array($ticket->status_id, $openStatuses)) return false;

        $effectiveDue = $this->getEffectiveDueDate($ticket);
        return $effectiveDue->isPast();
    }

    /**
     * Get the effective due date accounting for paused SLA duration.
     */
    public function getEffectiveDueDate(Ticket $ticket): Carbon
    {
        $due = Carbon::parse($ticket->due_date);
        if ($ticket->sla_paused_duration > 0) {
            $due->addMinutes($ticket->sla_paused_duration);
        }
        if ($ticket->sla_paused_at) {
            $pausedSince = Carbon::parse($ticket->sla_paused_at);
            $due->addMinutes($pausedSince->diffInMinutes(now()));
        }
        return $due;
    }

    /**
     * Get SLA status details for display.
     */
    public function getSLAStatus(Ticket $ticket): array
    {
        if (!$ticket->due_date) {
            return ['status' => 'no_sla', 'label' => 'No SLA', 'color' => 'gray'];
        }

        $closedStatuses = \App\Models\TicketStatus::whereIn('code', ['RESOLVED', 'CLOSED'])->pluck('id')->toArray();
        if (in_array($ticket->status_id, $closedStatuses)) {
            $breached = $ticket->sla_breached;
            return [
                'status' => $breached ? 'breached' : 'met',
                'label'  => $breached ? 'SLA Breached' : 'SLA Met',
                'color'  => $breached ? 'red' : 'green',
            ];
        }

        if ($ticket->sla_paused_at) {
            return ['status' => 'paused', 'label' => 'SLA Paused', 'color' => 'yellow'];
        }

        $effectiveDue = $this->getEffectiveDueDate($ticket);
        $minutesLeft = now()->diffInMinutes($effectiveDue, false);

        if ($minutesLeft < 0) {
            return ['status' => 'breached', 'label' => 'SLA Breached', 'color' => 'red', 'minutes_left' => $minutesLeft];
        }

        $rule = SlaRule::where('priority_id', $ticket->priority_id)->first();
        $totalMinutes = $rule?->resolution_minutes ?? 480;
        $percentUsed = (($totalMinutes - $minutesLeft) / $totalMinutes) * 100;

        if ($percentUsed >= 90) {
            return ['status' => 'critical', 'label' => 'Critical', 'color' => 'red', 'minutes_left' => $minutesLeft, 'percent_used' => $percentUsed];
        }
        if ($percentUsed >= 75) {
            return ['status' => 'warning', 'label' => 'At Risk', 'color' => 'orange', 'minutes_left' => $minutesLeft, 'percent_used' => $percentUsed];
        }

        return ['status' => 'ok', 'label' => 'On Track', 'color' => 'green', 'minutes_left' => $minutesLeft, 'percent_used' => $percentUsed];
    }

    /**
     * Pause SLA on a ticket (e.g., waiting for user/vendor).
     */
    public function pauseSLA(Ticket $ticket): void
    {
        if (!$ticket->sla_paused_at) {
            $ticket->update(['sla_paused_at' => now()]);
        }
    }

    /**
     * Resume a paused SLA.
     */
    public function resumeSLA(Ticket $ticket): void
    {
        if ($ticket->sla_paused_at) {
            $elapsed = Carbon::parse($ticket->sla_paused_at)->diffInMinutes(now());
            $ticket->update([
                'sla_paused_duration' => $ticket->sla_paused_duration + $elapsed,
                'sla_paused_at'       => null,
            ]);
        }
    }
}
