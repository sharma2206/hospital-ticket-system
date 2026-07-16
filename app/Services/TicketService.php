<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\SlaRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketService
{
    public function __construct(private SLAService $slaService) {}

    /**
     * Create a new ticket with full field support and SLA calculation.
     */
    public function createTicket(array $data, int $createdBy): Ticket
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $ticket = Ticket::create(array_merge($data, [
                'ticket_number' => Ticket::generateTicketNumber(),
                'ticket_type'   => 'internal',
                'created_by'    => $createdBy,
                'status_id'     => \App\Models\TicketStatus::where('code', 'OPEN')->value('id') ?? 1,
                'due_date'      => $this->slaService->calculateDueDate($data['priority_id']),
            ]));

            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => 'created',
                'changed_by'  => $createdBy,
                'description' => 'Ticket created',
            ]);

            AuditLog::record('created', 'tickets', [
                'model_type' => Ticket::class,
                'model_id'   => $ticket->id,
                'new_values' => $ticket->toArray(),
                'description'=> "Ticket {$ticket->ticket_number} created",
            ]);

            return $ticket;
        });
    }

    /**
     * Update an existing ticket.
     */
    public function updateTicket(Ticket $ticket, array $data, int $updatedBy): Ticket
    {
        return DB::transaction(function () use ($ticket, $data, $updatedBy) {
            $old = $ticket->only(array_keys($data));

            // Recalculate due_date if priority changed
            if (isset($data['priority_id']) && $data['priority_id'] != $ticket->priority_id) {
                $data['due_date'] = $this->slaService->calculateDueDate($data['priority_id'], $ticket->created_at);
                $data['sla_breached'] = false;
            }

            $ticket->update($data);

            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => 'updated',
                'old_value'   => json_encode($old),
                'new_value'   => json_encode($data),
                'changed_by'  => $updatedBy,
                'description' => 'Ticket updated',
            ]);

            AuditLog::record('updated', 'tickets', [
                'model_type' => Ticket::class,
                'model_id'   => $ticket->id,
                'old_values' => $old,
                'new_values' => $data,
            ]);

            return $ticket->fresh();
        });
    }

    /**
     * Assign a ticket to a technician.
     */
    public function assignTicket(Ticket $ticket, int $technicianId, ?int $teamLeadId, int $assignedBy): Ticket
    {
        return DB::transaction(function () use ($ticket, $technicianId, $teamLeadId, $assignedBy) {
            $old = ['assigned_to' => $ticket->assigned_to, 'team_lead_id' => $ticket->team_lead_id];
            $new = ['assigned_to' => $technicianId];
            if ($teamLeadId) $new['team_lead_id'] = $teamLeadId;

            // If ticket was open, move to in-progress
            $inProgressStatus = \App\Models\TicketStatus::where('code', 'IN_PROGRESS')->first();
            $openStatus = \App\Models\TicketStatus::where('code', 'OPEN')->first();
            if ($inProgressStatus && $ticket->status_id === ($openStatus?->id ?? 1)) {
                $new['status_id'] = $inProgressStatus->id;
                $new['first_response_at'] = $new['first_response_at'] ?? now();
            }

            $ticket->update($new);

            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => 'assignment',
                'old_value'   => $old['assigned_to'],
                'new_value'   => $technicianId,
                'changed_by'  => $assignedBy,
                'description' => 'Ticket assigned to technician',
            ]);

            AuditLog::record('assigned', 'tickets', [
                'model_type'  => Ticket::class,
                'model_id'    => $ticket->id,
                'old_values'  => $old,
                'new_values'  => $new,
                'description' => "Ticket assigned to user #{$technicianId}",
            ]);

            // Create in-app notification for assignee
            Notification::create([
                'user_id'   => $technicianId,
                'ticket_id' => $ticket->id,
                'type'      => 'ticket_assigned',
                'title'     => 'Ticket Assigned to You',
                'message'   => "Ticket {$ticket->ticket_number}: {$ticket->title}",
            ]);

            return $ticket->fresh();
        });
    }

    /**
     * Close a ticket with closure notes.
     */
    public function closeTicket(Ticket $ticket, int $userId, string $closureNotes = null, string $rootCause = null): Ticket
    {
        return DB::transaction(function () use ($ticket, $userId, $closureNotes, $rootCause) {
            $status = \App\Models\TicketStatus::where('code', 'CLOSED')->first();
            if (!$status) return $ticket;

            $old = $ticket->status_id;
            $ticket->update([
                'status_id'     => $status->id,
                'closed_at'     => now(),
                'closure_notes' => $closureNotes,
                'root_cause'    => $rootCause ?? $ticket->root_cause,
                'resolved_at'   => $ticket->resolved_at ?? now(),
                'actual_resolution_date' => $ticket->actual_resolution_date ?? now(),
            ]);

            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => 'status_change',
                'old_value'   => $old,
                'new_value'   => $status->id,
                'changed_by'  => $userId,
                'description' => 'Ticket closed',
            ]);

            AuditLog::record('closed', 'tickets', [
                'model_type' => Ticket::class,
                'model_id'   => $ticket->id,
            ]);

            // Notify creator
            Notification::create([
                'user_id'   => $ticket->created_by,
                'ticket_id' => $ticket->id,
                'type'      => 'ticket_closed',
                'title'     => 'Your Ticket Has Been Closed',
                'message'   => "Ticket {$ticket->ticket_number} has been closed.",
            ]);

            return $ticket->fresh();
        });
    }

    /**
     * Reopen a closed/resolved ticket.
     */
    public function reopenTicket(Ticket $ticket, int $userId, string $reason = null): Ticket
    {
        return DB::transaction(function () use ($ticket, $userId, $reason) {
            $status = \App\Models\TicketStatus::where('code', 'OPEN')->first();
            if (!$status) return $ticket;

            $old = $ticket->status_id;
            $ticket->update([
                'status_id'   => $status->id,
                'resolved_at' => null,
                'closed_at'   => null,
            ]);

            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => 'reopened',
                'old_value'   => $old,
                'new_value'   => $status->id,
                'changed_by'  => $userId,
                'description' => $reason ?? 'Ticket reopened',
            ]);

            return $ticket->fresh();
        });
    }

    /**
     * Clone a ticket into a new one.
     */
    public function cloneTicket(Ticket $ticket, int $userId): Ticket
    {
        $cloneData = $ticket->only([
            'title', 'description', 'category_id', 'sub_category_id', 'priority_id',
            'department_id', 'branch_id', 'building', 'floor', 'room_number',
            'location_detail', 'asset_id', 'vendor_id', 'source', 'impact', 'urgency',
        ]);

        $cloneData['title'] = "[CLONE] {$ticket->title}";

        return $this->createTicket($cloneData, $userId);
    }

    /**
     * Merge source ticket into target ticket (source gets closed, linked to target).
     */
    public function mergeTickets(Ticket $target, Ticket $source, int $userId): Ticket
    {
        return DB::transaction(function () use ($target, $source, $userId) {
            // Link source to target as child
            $source->update(['parent_ticket_id' => $target->id]);

            // Close source
            $this->closeTicket($source, $userId, "Merged into {$target->ticket_number}");

            TicketHistory::create([
                'ticket_id'   => $target->id,
                'change_type' => 'merged',
                'changed_by'  => $userId,
                'description' => "Merged ticket {$source->ticket_number} into this ticket",
            ]);

            AuditLog::record('merged', 'tickets', [
                'model_type'  => Ticket::class,
                'model_id'    => $target->id,
                'description' => "Merged {$source->ticket_number} into {$target->ticket_number}",
            ]);

            return $target->fresh();
        });
    }

    /**
     * Escalate a ticket manually.
     */
    public function escalateTicket(Ticket $ticket, int $userId, string $reason = null): Ticket
    {
        $ticket->update([
            'is_escalated' => true,
            'escalated_at' => now(),
        ]);

        TicketHistory::create([
            'ticket_id'   => $ticket->id,
            'change_type' => 'escalation',
            'changed_by'  => $userId,
            'description' => $reason ?? 'Ticket manually escalated',
        ]);

        AuditLog::record('escalated', 'tickets', [
            'model_type' => Ticket::class,
            'model_id'   => $ticket->id,
        ]);

        // Notify IT Manager
        $managers = \App\Models\User::role('it_manager')->get();
        foreach ($managers as $manager) {
            Notification::create([
                'user_id'   => $manager->id,
                'ticket_id' => $ticket->id,
                'type'      => 'ticket_escalated',
                'title'     => 'Ticket Escalated',
                'message'   => "Ticket {$ticket->ticket_number} has been escalated. Reason: " . ($reason ?? 'No reason given'),
            ]);
        }

        return $ticket->fresh();
    }

    /**
     * Handle file attachment upload.
     */
    public function storeAttachment(Ticket $ticket, UploadedFile $file, int $userId): \App\Models\TicketAttachment
    {
        $path = $file->store("tickets/{$ticket->id}/attachments", 'public');

        return \App\Models\TicketAttachment::create([
            'ticket_id'   => $ticket->id,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
            'uploaded_by' => $userId,
        ]);
    }
}
