<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
        $isStaff = $user->hasAnyRole($staffRoles);

        // Base query
        $base = Ticket::internal();
        if (!$isStaff) {
            $base->where('created_by', $user->id);
        }

        // Status IDs
        $statuses = TicketStatus::pluck('id', 'code');
        $openId       = $statuses['OPEN'] ?? null;
        $inProgressId = $statuses['IN_PROGRESS'] ?? null;
        $resolvedId   = $statuses['RESOLVED'] ?? null;
        $closedId     = $statuses['CLOSED'] ?? null;
        $activeIds    = array_filter([$openId, $inProgressId]);

        // Core counts
        $total    = (clone $base)->count();
        $open     = (clone $base)->where('status_id', $openId)->count();
        $inProg   = (clone $base)->where('status_id', $inProgressId)->count();
        $resolved = (clone $base)->where('status_id', $resolvedId)->count();
        $closed   = (clone $base)->where('status_id', $closedId)->count();
        $pending  = $open + $inProg;

        // SLA & overdue
        $slaBreached = (clone $base)->where('sla_breached', true)->whereIn('status_id', $activeIds)->count();
        $overdue = (clone $base)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->whereIn('status_id', $activeIds)
            ->count();

        // Time-based
        $today   = (clone $base)->whereDate('created_at', today())->count();
        $weekly  = (clone $base)->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $monthly = (clone $base)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count();

        // Escalated
        $escalated = (clone $base)->where('is_escalated', true)->whereIn('status_id', $activeIds)->count();

        // Staff-only stats
        $unassigned = null;
        $myAssigned = null;
        if ($isStaff) {
            $unassigned = Ticket::internal()->whereNull('assigned_to')->whereIn('status_id', $activeIds)->count();
            $myAssigned = Ticket::internal()->where('assigned_to', $user->id)->whereIn('status_id', $activeIds)->count();
        }

        // Avg resolution time (minutes)
        $avgResolution = (clone $base)
            ->whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_minutes')
            ->value('avg_minutes');

        // Avg first response time (minutes)
        $avgFirstResponse = (clone $base)
            ->whereNotNull('first_response_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) as avg_minutes')
            ->value('avg_minutes');

        // Priority distribution
        $byPriority = (clone $base)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->selectRaw('priorities.name, priorities.color, count(*) as count')
            ->groupBy('priorities.name', 'priorities.color')
            ->get();

        // Status distribution
        $byStatus = (clone $base)
            ->join('ticket_statuses', 'tickets.status_id', '=', 'ticket_statuses.id')
            ->selectRaw('ticket_statuses.name, ticket_statuses.color, count(*) as count')
            ->groupBy('ticket_statuses.name', 'ticket_statuses.color')
            ->get();

        // Department distribution
        $byDepartment = (clone $base)
            ->join('departments', 'tickets.department_id', '=', 'departments.id')
            ->selectRaw('departments.name, count(*) as count')
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Branch distribution
        $byBranch = (clone $base)
            ->leftJoin('branches', 'tickets.branch_id', '=', 'branches.id')
            ->selectRaw('COALESCE(branches.name, "Unassigned") as name, count(*) as count')
            ->groupBy('branches.name')
            ->orderByDesc('count')
            ->get();

        // Category distribution
        $byCategory = (clone $base)
            ->join('categories', 'tickets.category_id', '=', 'categories.id')
            ->selectRaw('categories.name, count(*) as count')
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Technician workload (staff only)
        $technicianWorkload = [];
        if ($isStaff) {
            $technicianWorkload = Ticket::internal()
                ->whereIn('status_id', $activeIds)
                ->whereNotNull('assigned_to')
                ->join('users', 'tickets.assigned_to', '=', 'users.id')
                ->selectRaw('CONCAT(users.first_name, " ", users.last_name) as name, count(*) as count')
                ->groupBy('users.first_name', 'users.last_name')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
        }

        // 30-day trend
        $trend = (clone $base)
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill in missing days
        $trendData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $trendData[] = ['date' => $date, 'count' => $trend[$date]->count ?? 0];
        }

        // Recent tickets
        $recentTickets = (clone $base)
            ->with(['creator:id,first_name,last_name', 'assignee:id,first_name,last_name', 'status:id,name,code,color', 'priority:id,name,color'])
            ->latest()
            ->limit(10)
            ->get(['id', 'ticket_number', 'title', 'created_at', 'assigned_to', 'created_by', 'status_id', 'priority_id']);

        // Satisfaction score
        $avgRating = (clone $base)->whereNotNull('rating')->avg('rating');

        return response()->json([
            'summary' => [
                'total'             => $total,
                'open'              => $open,
                'in_progress'       => $inProg,
                'resolved'          => $resolved,
                'closed'            => $closed,
                'pending'           => $pending,
                'sla_breached'      => $slaBreached,
                'overdue'           => $overdue,
                'today'             => $today,
                'weekly'            => $weekly,
                'monthly'           => $monthly,
                'escalated'         => $escalated,
                'unassigned'        => $unassigned,
                'my_assigned'       => $myAssigned,
                'avg_resolution_min'=> round($avgResolution ?? 0),
                'avg_response_min'  => round($avgFirstResponse ?? 0),
                'avg_satisfaction'  => round($avgRating ?? 0, 1),
            ],
            'by_status'           => $byStatus,
            'by_priority'         => $byPriority,
            'by_department'       => $byDepartment,
            'by_branch'           => $byBranch,
            'by_category'         => $byCategory,
            'technician_workload' => $technicianWorkload,
            'trend'               => $trendData,
            'recent_tickets'      => $recentTickets,
        ]);
    }
}
