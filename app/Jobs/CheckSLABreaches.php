<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\Notification;
use App\Models\User;
use App\Services\SLAService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckSLABreaches implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(SLAService $slaService): void
    {
        $closedStatuses = TicketStatus::whereIn('code', ['RESOLVED', 'CLOSED'])->pluck('id')->toArray();

        $tickets = Ticket::internal()
            ->whereNotNull('due_date')
            ->where('sla_breached', false)
            ->whereNotIn('status_id', $closedStatuses)
            ->whereNull('sla_paused_at')
            ->get();

        $breachedCount = 0;

        foreach ($tickets as $ticket) {
            if ($slaService->checkBreach($ticket)) {
                $ticket->update(['sla_breached' => true]);
                $breachedCount++;

                // Notify assignee and manager
                $notifyUsers = collect();

                if ($ticket->assigned_to) {
                    $notifyUsers->push($ticket->assigned_to);
                }
                if ($ticket->team_lead_id) {
                    $notifyUsers->push($ticket->team_lead_id);
                }

                $managers = User::role('it_manager')->pluck('id');
                $notifyUsers = $notifyUsers->merge($managers)->unique();

                foreach ($notifyUsers as $userId) {
                    Notification::firstOrCreate(
                        [
                            'user_id'   => $userId,
                            'ticket_id' => $ticket->id,
                            'type'      => 'sla_breached',
                        ],
                        [
                            'title'   => 'SLA Breached',
                            'message' => "Ticket {$ticket->ticket_number} has breached its SLA deadline.",
                        ]
                    );
                }
            }
        }

        Log::info("SLA Check complete. {$breachedCount} new breaches detected.");
    }
}
