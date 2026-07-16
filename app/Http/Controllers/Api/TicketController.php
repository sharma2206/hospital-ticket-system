<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Requests\AssignTicketRequest;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\AuditLog;
use App\Services\TicketService;
use App\Services\SLAService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    public function __construct(
        private TicketService $ticketService,
        private SLAService $slaService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Ticket::internal();

        // ── Role-based visibility ─────────────────────────────
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
        $isStaff = $user->hasAnyRole($staffRoles);

        if (!$isStaff) {
            $query->where('created_by', $user->id);
        } elseif ($request->filled('my_tickets')) {
            $query->where('assigned_to', $user->id);
        }

        // ── Filters ───────────────────────────────────────────
        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        } elseif ($request->filled('status')) {
            $query->whereHas('status', fn($q) =>
                $q->where('name', $request->status)->orWhere('code', strtoupper($request->status))
            );
        }

        if ($request->filled('priority_id')) {
            $query->where('priority_id', $request->priority_id);
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('sub_category_id')) {
            $query->where('sub_category_id', $request->sub_category_id);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->boolean('is_escalated')) {
            $query->where('is_escalated', true);
        }

        if ($request->boolean('sla_breached')) {
            $query->where('sla_breached', true);
        }

        if ($request->boolean('overdue')) {
            $query->overdue();
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('ticket_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('requester_name', 'like', "%{$search}%")
                  ->orWhere('requester_employee_id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // ── Sorting ───────────────────────────────────────────
        $allowed = ['created_at', 'updated_at', 'title', 'ticket_number', 'due_date', 'priority_id'];
        $sortBy = in_array($request->get('sort_by'), $allowed) ? $request->get('sort_by') : 'created_at';
        $sortOrder = $request->get('sort_order', 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->get('per_page', 15), 100);

        $tickets = $query->with([
            'creator:id,first_name,last_name,employee_id',
            'assignee:id,first_name,last_name,employee_id',
            'teamLead:id,first_name,last_name',
            'category:id,name,code',
            'subCategory:id,name',
            'priority:id,name,level,color',
            'status:id,name,code,color',
            'department:id,name,code',
            'branch:id,name,code',
            'asset:id,asset_code,name',
            'vendor:id,name',
        ])->paginate($perPage);

        // Append SLA status to each ticket
        $items = collect($tickets->items())->map(function ($ticket) {
            $ticket->sla_status = $this->slaService->getSLAStatus($ticket);
            return $ticket;
        });

        return response()->json([
            'data' => $items,
            'pagination' => [
                'total'        => $tickets->total(),
                'per_page'     => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page'    => $tickets->lastPage(),
                'from'         => $tickets->firstItem(),
                'to'           => $tickets->lastItem(),
            ],
        ]);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['source'] = $data['source'] ?? 'self_service';

        $ticket = $this->ticketService->createTicket($data, Auth::id());

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $this->ticketService->storeAttachment($ticket, $file, Auth::id());
            }
        }

        return response()->json([
            'message' => 'Ticket created successfully',
            'data'    => $ticket->load([
                'creator', 'category', 'subCategory', 'priority', 'status', 'department', 'branch',
            ]),
        ], 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $user = Auth::user();
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];

        if (!$user->hasAnyRole($staffRoles) && $ticket->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ticket->load([
            'creator:id,first_name,last_name,employee_id,email,phone',
            'assignee:id,first_name,last_name,employee_id,email,phone',
            'teamLead:id,first_name,last_name',
            'category:id,name,code',
            'subCategory:id,name,code',
            'priority:id,name,level,color,description',
            'status:id,name,code,color',
            'department:id,name,code',
            'branch:id,name,code',
            'asset:id,asset_code,name,brand,model',
            'vendor:id,name,contact_person,email,phone',
            'comments.user:id,first_name,last_name',
            'attachments',
            'history.changer:id,first_name,last_name',
            'watchers:id,first_name,last_name,email',
            'knowledgeArticles:id,title,slug,status',
            'childTickets:id,ticket_number,title,status_id',
            'parentTicket:id,ticket_number,title',
            'feedback',
        ]);

        $ticket->sla_status = $this->slaService->getSLAStatus($ticket);

        return response()->json(['data' => $ticket]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $user = Auth::user();
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];

        if (!$user->hasAnyRole($staffRoles) && $ticket->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ticket = $this->ticketService->updateTicket($ticket, $request->validated(), $user->id);

        return response()->json([
            'message' => 'Ticket updated successfully',
            'data'    => $ticket->load(['category', 'subCategory', 'priority', 'status', 'department']),
        ]);
    }

    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status_id'      => 'required|exists:ticket_statuses,id',
            'resolution_notes'=> 'nullable|string',
            'root_cause'     => 'nullable|string',
            'closure_notes'  => 'nullable|string',
        ]);

        $user = Auth::user();
        $newStatus = TicketStatus::find($validated['status_id']);
        $old = $ticket->status_id;

        $ticket->update(array_filter([
            'status_id'       => $validated['status_id'],
            'resolution_notes'=> $validated['resolution_notes'] ?? null,
            'root_cause'      => $validated['root_cause'] ?? null,
            'closure_notes'   => $validated['closure_notes'] ?? null,
            'resolved_at'     => in_array($newStatus?->code, ['RESOLVED', 'CLOSED']) ? ($ticket->resolved_at ?? now()) : null,
            'closed_at'       => $newStatus?->code === 'CLOSED' ? now() : null,
            'first_response_at' => $ticket->first_response_at ?? (in_array($newStatus?->code, ['IN_PROGRESS']) ? now() : null),
        ], fn($v) => $v !== null));

        $ticket->recordHistory('status_change', $user->id, $old, $validated['status_id']);

        \App\Models\Notification::create([
            'user_id'   => $ticket->created_by,
            'ticket_id' => $ticket->id,
            'type'      => 'status_changed',
            'title'     => 'Ticket Status Updated',
            'message'   => "Ticket {$ticket->ticket_number} status changed to: {$newStatus?->name}",
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'data'    => $ticket->load(['status', 'priority']),
        ]);
    }

    public function assign(AssignTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket = $this->ticketService->assignTicket(
            $ticket,
            $request->assigned_to,
            $request->team_lead_id,
            Auth::id()
        );

        return response()->json([
            'message' => 'Ticket assigned successfully',
            'data'    => $ticket->load(['assignee', 'teamLead', 'status']),
        ]);
    }

    public function escalate(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);
        $ticket = $this->ticketService->escalateTicket($ticket, Auth::id(), $request->reason);

        return response()->json([
            'message' => 'Ticket escalated successfully',
            'data'    => $ticket,
        ]);
    }

    public function reopen(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);
        $ticket = $this->ticketService->reopenTicket($ticket, Auth::id(), $request->reason);

        return response()->json([
            'message' => 'Ticket reopened successfully',
            'data'    => $ticket->load(['status']),
        ]);
    }

    public function clone(Ticket $ticket): JsonResponse
    {
        $clone = $this->ticketService->cloneTicket($ticket, Auth::id());
        return response()->json([
            'message' => 'Ticket cloned successfully',
            'data'    => $clone->load(['category', 'priority', 'status', 'department']),
        ], 201);
    }

    public function merge(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['source_ticket_id' => 'required|exists:tickets,id']);
        $source = Ticket::findOrFail($request->source_ticket_id);
        $ticket = $this->ticketService->mergeTickets($ticket, $source, Auth::id());

        return response()->json([
            'message' => 'Tickets merged successfully',
            'data'    => $ticket,
        ]);
    }

    public function addWatcher(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $ticket->watchers()->syncWithoutDetaching([$request->user_id]);

        return response()->json(['message' => 'Watcher added successfully']);
    }

    public function removeWatcher(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $ticket->watchers()->detach($request->user_id);

        return response()->json(['message' => 'Watcher removed successfully']);
    }

    public function uploadAttachment(Request $request, Ticket $ticket): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip,txt,log',
        ]);

        $attachment = $this->ticketService->storeAttachment($ticket, $request->file('file'), Auth::id());

        return response()->json([
            'message' => 'Attachment uploaded successfully',
            'data'    => $attachment,
        ], 201);
    }

    public function deleteAttachment(Ticket $ticket, \App\Models\TicketAttachment $attachment): JsonResponse
    {
        if ($attachment->ticket_id !== $ticket->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully']);
    }

    public function pauseSLA(Ticket $ticket): JsonResponse
    {
        $this->slaService->pauseSLA($ticket);
        return response()->json(['message' => 'SLA paused', 'data' => $ticket->fresh()]);
    }

    public function resumeSLA(Ticket $ticket): JsonResponse
    {
        $this->slaService->resumeSLA($ticket);
        return response()->json(['message' => 'SLA resumed', 'data' => $ticket->fresh()]);
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticketNumber = $ticket->ticket_number;
        $ticket->delete();

        AuditLog::record('deleted', 'tickets', [
            'model_type'  => Ticket::class,
            'model_id'    => $ticket->id,
            'description' => "Ticket {$ticketNumber} deleted",
        ]);

        return response()->json(['message' => 'Ticket deleted successfully']);
    }
}
