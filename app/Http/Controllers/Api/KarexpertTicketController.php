<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\TicketStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KarexpertTicketController
{
    protected $user;
    protected $userId;

    public function __construct()
    {
        $this->user   = Auth::user() ?? null;
        $this->userId = $this->user ? $this->user->id : null;
    }

    /**
     * KareXpert dashboard stats.
     */
    public function dashboard(Request $request)
    {
        $base = Ticket::karexpert();

        // Status counts
        $statusCounts = (clone $base)
            ->join('ticket_statuses', 'tickets.status_id', '=', 'ticket_statuses.id')
            ->selectRaw('ticket_statuses.name as status, count(*) as count')
            ->groupBy('ticket_statuses.name')
            ->pluck('count', 'status');

        // Priority counts
        $priorityCounts = (clone $base)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->selectRaw('priorities.name as priority, count(*) as count')
            ->groupBy('priorities.name')
            ->pluck('count', 'priority');

        // Module counts
        $moduleCounts = (clone $base)
            ->whereNotNull('karexpert_module')
            ->selectRaw('karexpert_module, count(*) as count')
            ->groupBy('karexpert_module')
            ->orderByDesc('count')
            ->pluck('count', 'karexpert_module');

        // Category counts
        $categoryCounts = (clone $base)
            ->join('categories', 'tickets.category_id', '=', 'categories.id')
            ->selectRaw('categories.name as category, count(*) as count')
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->pluck('count', 'category');

        // Recent 5 tickets
        $recentTickets = (clone $base)
            ->with(['creator:id,first_name,last_name', 'status:id,name,code,color', 'priority:id,name,color', 'category:id,name,code'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'summary' => [
                'total'                => (clone $base)->count(),
                'raised'               => $statusCounts['raised'] ?? 0,
                'acknowledged'         => $statusCounts['acknowledged'] ?? 0,
                'karexpert_working'    => $statusCounts['karexpert_working'] ?? 0,
                'awaiting_deployment'  => $statusCounts['awaiting_deployment'] ?? 0,
                'deployed'             => $statusCounts['deployed'] ?? 0,
            ],
            'by_status'     => $statusCounts,
            'by_priority'   => $priorityCounts,
            'by_module'     => $moduleCounts,
            'by_category'   => $categoryCounts,
            'recent_tickets' => $recentTickets,
        ]);
    }

    /**
     * List KareXpert tickets with filters.
     */
    public function index(Request $request)
    {
        $query = Ticket::karexpert();

        // Filter by status
        if ($request->filled('status')) {
            $query->whereHas('status', fn($q) => $q->where('name', $request->status));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->whereHas('priority', fn($q) => $q->where('name', $request->priority));
        }

        // Filter by module
        if ($request->filled('module')) {
            $query->where('karexpert_module', $request->module);
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('ticket_number', 'like', '%' . $request->search . '%')
                  ->orWhere('karexpert_ref_id', 'like', '%' . $request->search . '%');
            });
        }

        // Date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $allowed   = ['created_at', 'updated_at', 'title', 'ticket_number'];
        if (in_array($sortBy, $allowed)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = min((int) $request->get('per_page', 15), 100);

        $tickets = $query->with([
            'creator:id,first_name,last_name',
            'category:id,name,code',
            'priority:id,name,level,description,color',
            'status:id,name,code,color',
            'parentTicket:id,ticket_number,title',
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

    /**
     * Create a new KareXpert ticket.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'required|string',
            'category_id'      => 'required|exists:categories,id',
            'priority_id'      => 'required|exists:priorities,id',
            'karexpert_module' => 'required|string|max:100',
            'karexpert_ref_id' => 'nullable|string|max:100',
            'karexpert_contact'=> 'nullable|string|max:255',
            'parent_ticket_id' => 'nullable|exists:tickets,id',
        ]);

        // Get 'raised' status id
        $raisedStatusId = TicketStatus::where('name', 'raised')->value('id');

        // Get IT department id for KareXpert tickets
        $itDeptId = \App\Models\Department::where('code', 'IT')->value('id');

        $ticket = Ticket::create([
            ...$validated,
            'ticket_type'   => 'karexpert',
            'ticket_number' => 'KX-' . date('Ymd') . '-' . str_pad(
                Ticket::karexpert()->count() + 1, 5, '0', STR_PAD_LEFT
            ),
            'created_by'    => $this->userId,
            'department_id' => $itDeptId,
            'status_id'     => $raisedStatusId,
        ]);

        // Record history
        TicketHistory::create([
            'ticket_id'   => $ticket->id,
            'change_type' => 'created',
            'changed_by'  => $this->userId,
            'description' => 'KareXpert ticket created',
        ]);

        return response()->json([
            'message' => 'KareXpert ticket created successfully',
            'data'    => $ticket->load(['creator', 'category', 'priority', 'status', 'parentTicket']),
        ], 201);
    }

    /**
     * Show a single KareXpert ticket.
     */
    public function show(Ticket $ticket)
    {
        if ($ticket->ticket_type !== 'karexpert') {
            return response()->json(['message' => 'Not a KareXpert ticket'], 404);
        }

        return response()->json(
            $ticket->load([
                'creator:id,first_name,last_name,department_id',
                'category:id,name,code',
                'priority:id,name,color',
                'status:id,name,code,color',
                'parentTicket:id,ticket_number,title',
                'comments.user:id,first_name,last_name',
                'history' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
                'history.changedBy:id,first_name,last_name',
            ])
        );
    }

    /**
     * Update a KareXpert ticket.
     */
    public function update(Request $request, Ticket $ticket)
    {
        if ($ticket->ticket_type !== 'karexpert') {
            return response()->json(['message' => 'Not a KareXpert ticket'], 404);
        }

        $validated = $request->validate([
            'title'              => 'sometimes|string|max:255',
            'description'        => 'sometimes|string',
            'category_id'        => 'sometimes|exists:categories,id',
            'priority_id'        => 'sometimes|exists:priorities,id',
            'status_id'          => 'sometimes|exists:ticket_statuses,id',
            'karexpert_ref_id'   => 'sometimes|nullable|string|max:100',
            'karexpert_module'   => 'sometimes|string|max:100',
            'karexpert_contact'  => 'sometimes|nullable|string|max:255',
            'resolution_notes'   => 'sometimes|nullable|string',
        ]);

        $changes = [];

        // Track status change
        if (isset($validated['status_id']) && $validated['status_id'] != $ticket->status_id) {
            $oldStatus = $ticket->status?->name;
            $newStatus = TicketStatus::find($validated['status_id'])?->name;
            $changes[] = "Status: {$oldStatus} → {$newStatus}";

            // Auto-set resolved/closed timestamps
            if ($newStatus === 'deployed') {
                $validated['resolved_at'] = now();
                $validated['actual_resolution_date'] = now();
            }
        }

        if (isset($validated['karexpert_ref_id']) && $validated['karexpert_ref_id'] !== $ticket->karexpert_ref_id) {
            $changes[] = "KareXpert Ref: " . ($validated['karexpert_ref_id'] ?: 'cleared');
        }

        if (isset($validated['karexpert_contact']) && $validated['karexpert_contact'] !== $ticket->karexpert_contact) {
            $changes[] = "Contact: " . ($validated['karexpert_contact'] ?: 'cleared');
        }

        $ticket->update($validated);

        if (!empty($changes)) {
            TicketHistory::create([
                'ticket_id'   => $ticket->id,
                'change_type' => isset($validated['status_id']) ? 'status_change' : 'update',
                'old_value'   => $ticket->getOriginal('status_id'),
                'new_value'   => $validated['status_id'] ?? null,
                'changed_by'  => $this->userId,
                'description' => implode('; ', $changes),
            ]);
        }

        return response()->json([
            'message' => 'KareXpert ticket updated successfully',
            'data'    => $ticket->fresh()->load(['creator', 'category', 'priority', 'status', 'parentTicket']),
        ]);
    }
}
