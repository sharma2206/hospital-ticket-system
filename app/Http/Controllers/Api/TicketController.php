<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TicketController
{
    public $user;
    public $userId;

    public function __construct()
    {
        $this->user     = Auth::user() ?? null;
        $this->userId   = $this->user ? $this->user->id : null;
    }

    public function index(Request $request)
    {
        $query = Ticket::internal();

        // ── Filters ──────────────────────────────────────────

        // Filter by status_id OR status name
        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        } elseif ($request->filled('status')) {
            $query->whereHas(
                'status',
                fn($q) =>
                $q->where('name', $request->status)
                    ->orWhere('code', strtoupper($request->status))
            );
        }

        // Filter by priority_id OR priority name
        if ($request->filled('priority_id')) {
            $query->where('priority_id', $request->priority_id);
        } elseif ($request->filled('priority')) {
            $query->whereHas(
                'priority',
                fn($q) =>
                $q->where('name', $request->priority)
                    ->orWhere('code', strtoupper($request->priority))
            );
        }

        // Filter by department_id OR department name
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        } elseif ($request->filled('department')) {
            $query->whereHas(
                'department',
                fn($q) =>
                $q->where('name', $request->department)
            );
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by assigned staff
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Filter escalated tickets
        if ($request->filled('is_escalated')) {
            $query->where('is_escalated', filter_var($request->is_escalated, FILTER_VALIDATE_BOOLEAN));
        }

        // Search by title or ticket number
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('ticket_number', 'like', '%' . $request->search . '%');
            });
        }

        // Date range filter
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // ── Role-based visibility ─────────────────────────────

        if ($this->user && $this->user->hasRole('admin')) {
            // Admin sees all tickets — no restriction
        } elseif ($this->user && $this->user->hasRole('it_staff')) {
            // IT staff sees tickets from all departments
            // but can filter to only their assigned tickets
            if ($request->filled('my_tickets')) {
                $query->where('assigned_to', $this->userId);
            }
        } elseif ($this->user && $this->user->hasRole('user')) {
            // Regular user sees only their own tickets
            $query->where('created_by', $this->userId);
        }

        // ── Sorting ──────────────────────────────────────────

        $sortBy    = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSorts = ['created_at', 'updated_at', 'title', 'ticket_number'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        // ── Paginate ─────────────────────────────────────────

        $perPage = min((int) $request->get('per_page', 15), 100);

        $tickets = $query->with([
            'creator:id,first_name,last_name,department_id',
            'assignee:id,first_name,last_name',
            'category:id,name,code',
            'priority:id,name,level,description,color',
            'status:id,name,code,color',
            'department:id,name,code',
        ])->paginate($perPage);

        return response()->json([
            'data' => $tickets->items(),
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'department_id' => 'required|exists:departments,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        $ticket = Ticket::create([
            ...$validated,
            'ticket_number' => 'TKT-' . date('Ymd') . '-' . str_pad(Ticket::count() + 1, 5, '0', STR_PAD_LEFT),
            'created_by' => $this->userId,
            'status_id' => 1, // Open status
        ]);

        // Notify department
        // Notification::create([
        //     'user_id'   => $ticket->department->manager_id,
        //     'ticket_id' => $ticket->id,
        //     'type'      => 'ticket_created',
        //     'title'     => 'New Ticket Created',
        //     'message'   => 'A new ticket has been created: ' . $ticket->title,
        // ]);

        return response()->json([
            'message' => 'Ticket created successfully',
            'data' => $ticket->load(['creator', 'category', 'priority', 'status', 'department']),
        ], 201);
    }

    // Simple version without policy
    public function show(Ticket $ticket)
    {
        $user = request()->user();

        // Users can only view their own tickets
        if ($user && $user->hasRole('user') && $ticket->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            $ticket->load([
                'creator:id,first_name,last_name,department_id',
                'assignee:id,first_name,last_name,department_id',
                'comments.user:id,first_name,last_name',
            ])
        );
    }

    public function update(Request $request, Ticket $ticket)
    {

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'priority_id' => 'sometimes|exists:priorities,id',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        $ticket->update($validated);

        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'change_type' => 'update',
            'changed_by' => $this->userId,
            'description' => 'Ticket updated',
        ]);

        return response()->json([
            'message' => 'Ticket updated successfully',
            'data' => $ticket,
        ]);
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status_id' => 'required|exists:ticket_statuses,id',
        ]);

        $oldStatus = $ticket->status_id;
        $ticket->update(['status_id' => $validated['status_id']]);

        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'change_type' => 'status_change',
            'old_value' => $oldStatus,
            'new_value' => $validated['status_id'],
            'changed_by' => $this->userId,
        ]);

        // Notify creator
        Notification::create([
            'user_id' => $ticket->created_by,
            'ticket_id' => $ticket->id,
            'type' => 'status_changed',
            'title' => 'Ticket Status Updated',
            'message' => 'Your ticket status has been updated to: ' . $ticket->status->name,
        ]);

        return response()->json([
            'message' => 'Status updated successfully',
            'data' => $ticket,
        ]);
    }

    public function escalate(Request $request, Ticket $ticket)
    {
        $ticket->escalate($request->input('reason'));

        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'change_type' => 'escalation',
            'changed_by' => $this->userId,
            'description' => $request->input('reason'),
        ]);

        return response()->json([
            'message' => 'Ticket escalated successfully',
            'data' => $ticket,
        ]);
    }

    public function destroy(Ticket $ticket)
    {
        $ticket->delete();
        return response()->json(['message' => 'Ticket deleted successfully']);
    }
}
