<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $isStaff = $user->hasAnyRole(['admin', 'it_staff']);

        // Get status ids for open and in_progress
        $openStatusId = \App\Models\TicketStatus::where('name', 'open')->value('id');
        $inProgressStatusId = \App\Models\TicketStatus::where('name', 'in_progress')->value('id');

        // Base query — users see only their tickets
        $base = Ticket::query();
        if (!$isStaff) {
            $base->where('created_by', $user->id);
        }

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

        // Department counts
        $deptCounts = (clone $base)
            ->join('departments', 'tickets.department_id', '=', 'departments.id')
            ->selectRaw('departments.name as department, count(*) as count')
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->pluck('count', 'department');

        // Recent 5 tickets
        $recentTickets = (clone $base)
            ->with(['creator', 'assignee', 'status', 'priority', 'department'])
            ->latest()
            ->limit(5)
            ->get(['id', 'ticket_number', 'title', 'created_at', 'assigned_to', 'created_by', 'status_id', 'priority_id', 'department_id']);

        // Unassigned count (staff only)
        $unassigned = $isStaff
            ? Ticket::whereNull('assigned_to')
            ->whereIn('status_id', [$openStatusId, $inProgressStatusId])
            ->count()
            : null;

        // My assigned tickets count (it_staff)
        $myAssigned = $isStaff
            ? Ticket::where('assigned_to', $user->id)
            ->whereIn('status_id', [$openStatusId, $inProgressStatusId])
            ->count()
            : null;

        return response()->json([
            'summary' => [
                'total'       => (clone $base)->count(),
                'open'        => $statusCounts['open']        ?? 0,
                'in_progress' => $statusCounts['in_progress'] ?? 0,
                'resolved'    => $statusCounts['resolved']    ?? 0,
                'closed'      => $statusCounts['closed']      ?? 0,
                'critical'    => $priorityCounts['critical']  ?? 0,
                'unassigned'  => $unassigned,
                'my_assigned' => $myAssigned,
            ],
            'by_status'     => $statusCounts,
            'by_priority'   => $priorityCounts,
            'by_department' => $deptCounts,
            'recent_tickets' => $recentTickets,
        ]);
    }
}
