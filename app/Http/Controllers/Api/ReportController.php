<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController
{
    public function overview(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);

        $period = $request->input('period', '7'); // days
        $startDate = Carbon::now()->subDays($period);

        $totalTickets = Ticket::count();
        $openTickets = Ticket::whereHas('status', function ($q) {
            $q->where('name', 'Open');
        })->count();
        $resolvedTickets = Ticket::whereHas('status', function ($q) {
            $q->where('name', 'Resolved');
        })->count();
        $escalatedTickets = Ticket::where('is_escalated', true)->count();

        $averageResolutionTime = Ticket::whereNotNull('resolved_at')
            ->avg(\DB::raw('TIMESTAMPDIFF(MINUTE, created_at, resolved_at)'));

        $averageRating = Feedback::avg('rating');

        return response()->json([
            'overview' => [
                'total_tickets' => $totalTickets,
                'open_tickets' => $openTickets,
                'resolved_tickets' => $resolvedTickets,
                'escalated_tickets' => $escalatedTickets,
                'avg_resolution_time_minutes' => round($averageResolutionTime, 2),
                'avg_customer_rating' => round($averageRating, 2),
            ],
        ]);
    }

    public function departmentMetrics($departmentId)
    {
        $this->authorize('viewAny', Ticket::class);

        $ticketsByStatus = Ticket::where('department_id', $departmentId)
            ->groupBy('status_id')
            ->with('status')
            ->selectRaw('status_id, count(*) as count')
            ->get();

        $ticketsByPriority = Ticket::where('department_id', $departmentId)
            ->groupBy('priority_id')
            ->with('priority')
            ->selectRaw('priority_id, count(*) as count')
            ->get();

        $topStaff = Ticket::where('department_id', $departmentId)
            ->groupBy('assigned_to')
            ->with('assignee')
            ->selectRaw('assigned_to, count(*) as count')
            ->limit(10)
            ->get();

        return response()->json([
            'by_status' => $ticketsByStatus,
            'by_priority' => $ticketsByPriority,
            'top_staff' => $topStaff,
        ]);
    }

    public function slaMetrics()
    {
        $this->authorize('viewAny', Ticket::class);

        $totalSLA = \App\Models\TicketSLA::count();
        $breachedSLA = \App\Models\TicketSLA::where('is_breached', true)->count();
        $complianceRate = $totalSLA > 0 ? (($totalSLA - $breachedSLA) / $totalSLA) * 100 : 0;

        return response()->json([
            'total' => $totalSLA,
            'breached' => $breachedSLA,
            'compliance_rate' => round($complianceRate, 2) . '%',
        ]);
    }

    public function trendAnalysis(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);

        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $ticketTrend = Ticket::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $resolutionTrend = Ticket::where('resolved_at', '>=', $startDate)
            ->selectRaw('DATE(resolved_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'ticket_creation_trend' => $ticketTrend,
            'resolution_trend' => $resolutionTrend,
        ]);
    }

    public function customerSatisfaction()
    {
        $this->authorize('viewAny', Ticket::class);

        $ratings = Feedback::selectRaw('rating, count(*) as count')
            ->groupBy('rating')
            ->orderBy('rating', 'desc')
            ->get();

        $averageRating = Feedback::avg('rating');

        return response()->json([
            'average_rating'        => round($averageRating, 2),
            'ratings_distribution'  => $ratings,
        ]);
    }
}
