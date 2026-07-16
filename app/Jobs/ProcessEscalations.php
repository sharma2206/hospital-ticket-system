<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\TicketHistory;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessEscalations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $closedStatuses = TicketStatus::whereIn('code', ['RESOLVED', 'CLOSED'])->pluck('id')->toArray();
        $openStatus     = TicketStatus::where('code', 'OPEN')->first();

        // Escalate tickets with no first response within SLA response window
        $noResponseTickets = Ticket::internal()
            ->whereNull('first_response_at')
            ->whereNotNull('due_date')
            ->where('is_escalated', false)
            ->whereNotIn('status_id', $closedStatuses)
            ->where('due_date', '<', now()->addMinutes(30)) // escalate when 30 min to SLA breach
            ->get();

        foreach ($noResponseTickets as $ticket) {
            $this->escalateTicket($ticket, 'No first response — auto-escalated');
        }

        // Escalate tickets with SLA breach that are not yet escalated
        $breachedTickets = Ticket::internal()
            ->where('sla_breached', true)
            ->where('is_escalated', false)
            ->whereNotIn('status_id', $closedStatuses)
            ->get();

        foreach ($breachedTickets as $ticket) {
            $this->escalateTicket($ticket, 'SLA breached — auto-escalated');
        }

        // Escalate tickets with no update in 24 hours (for high/critical priority)
        $staleTickets = Ticket::internal()
            ->whereNotIn('status_id', $closedStatuses)
            ->where('is_escalated', false)
            ->whereHas('priority', fn($q) => $q->where('level', '>=', 3)) // high/critical
            ->where('updated_at', '<', now()->subHours(24))
            ->get();

        foreach ($staleTickets as $ticket) {
            $this->escalateTicket($ticket, 'No update in 24 hours — auto-escalated');
        }
    }

    private function escalateTicket(Ticket $ticket, string $reason): void
    {
        $ticket->update([
            'is_escalated' => true,
            'escalated_at' => now(),
        ]);

        TicketHistory::create([
            'ticket_id'   => $ticket->id,
            'change_type' => 'escalation',
            'description' => $reason,
        ]);

        // Notify IT managers and team leads
        $notifyRoles = ['it_manager', 'team_lead'];
        $users = User::role($notifyRoles)->pluck('id');

        foreach ($users as $userId) {
            Notification::firstOrCreate(
                ['user_id' => $userId, 'ticket_id' => $ticket->id, 'type' => 'ticket_escalated'],
                [
                    'title'   => 'Ticket Auto-Escalated',
                    'message' => "Ticket {$ticket->ticket_number} auto-escalated: {$reason}",
                ]
            );
        }

        Log::info("Auto-escalated ticket {$ticket->ticket_number}: {$reason}");
    }
}
