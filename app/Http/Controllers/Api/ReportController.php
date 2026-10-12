<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\Asset;
use App\Models\Feedback;
use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Ticket summary report with filters.
     * GET /api/reports/tickets
     */
    public function tickets(Request $request): JsonResponse
    {
        $from = $request->filled('from_date') ? Carbon::parse($request->from_date)->startOfDay() : now()->subDays(30)->startOfDay();
        $to   = $request->filled('to_date')   ? Carbon::parse($request->to_date)->endOfDay()   : now()->endOfDay();

        $base = Ticket::internal()->whereBetween('tickets.created_at', [$from, $to]);

        if ($request->filled('department_id')) {
            $base->where('tickets.department_id', $request->department_id);
        }
        if ($request->filled('branch_id')) {
            $base->where('tickets.branch_id', $request->branch_id);
        }
        if ($request->filled('category_id')) {
            $base->where('tickets.category_id', $request->category_id);
        }
        if ($request->filled('sub_category_id')) {
            $base->where('tickets.sub_category_id', $request->sub_category_id);
        }

        $total    = (clone $base)->count();
        $resolved = (clone $base)->whereHas('status', fn($q) => $q->where('code', 'RESOLVED'))->count();
        $closed   = (clone $base)->whereHas('status', fn($q) => $q->where('code', 'CLOSED'))->count();
        $breached = (clone $base)->where('tickets.sla_breached', true)->count();
        $escalated= (clone $base)->where('tickets.is_escalated', true)->count();

        $diffSql = $this->diffMinutesSql('tickets.created_at', 'tickets.resolved_at');
        $avgResolution = (clone $base)
            ->whereNotNull('tickets.resolved_at')
            ->selectRaw("AVG({$diffSql}) as avg")
            ->value('avg');

        // Daily trend for chart
        $trend = (clone $base)
            ->selectRaw('DATE(tickets.created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // By priority
        $byPriority = (clone $base)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->selectRaw('priorities.name, priorities.color, COUNT(*) as count')
            ->groupBy('priorities.name', 'priorities.color')
            ->get();

        // By category
        $byCategory = (clone $base)
            ->join('categories', 'tickets.category_id', '=', 'categories.id')
            ->selectRaw('categories.name, COUNT(*) as count')
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // By department
        $byDepartment = (clone $base)
            ->join('departments', 'tickets.department_id', '=', 'departments.id')
            ->selectRaw('departments.name, COUNT(*) as count')
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'summary' => [
                'total'              => $total,
                'resolved'           => $resolved,
                'closed'             => $closed,
                'sla_breached'       => $breached,
                'escalated'          => $escalated,
                'avg_resolution_min' => round($avgResolution ?? 0),
                'from_date'          => $from->toDateString(),
                'to_date'            => $to->toDateString(),
            ],
            'trend'         => $trend,
            'by_priority'   => $byPriority,
            'by_category'   => $byCategory,
            'by_department' => $byDepartment,
        ]);
    }

    /**
     * SLA compliance report.
     * GET /api/reports/sla
     */
    public function slaCompliance(Request $request): JsonResponse
    {
        $from = $request->filled('from_date') ? Carbon::parse($request->from_date)->startOfDay() : now()->subDays(30)->startOfDay();
        $to   = $request->filled('to_date')   ? Carbon::parse($request->to_date)->endOfDay()   : now()->endOfDay();

        $base = Ticket::internal()->whereBetween('tickets.created_at', [$from, $to]);

        $total        = (clone $base)->count();
        $breached     = (clone $base)->where('tickets.sla_breached', true)->count();
        $compliant    = $total - $breached;
        $complianceRate = $total > 0 ? round(($compliant / $total) * 100, 1) : 0;

        // Breach by priority
        $byPriority = (clone $base)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->selectRaw('priorities.name, priorities.color, COUNT(*) as total, SUM(CASE WHEN tickets.sla_breached = 1 THEN 1 ELSE 0 END) as breached')
            ->groupBy('priorities.name', 'priorities.color')
            ->get()
            ->map(function ($row) {
                $row->compliance_rate = $row->total > 0
                    ? round((($row->total - $row->breached) / $row->total) * 100, 1)
                    : 100;
                return $row;
            });

        // Avg resolution by priority
        $diffPrioritySql = $this->diffMinutesSql('tickets.created_at', 'tickets.resolved_at');
        $avgByPriority = (clone $base)
            ->whereNotNull('tickets.resolved_at')
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->selectRaw("priorities.name, AVG({$diffPrioritySql}) as avg_min")
            ->groupBy('priorities.name')
            ->get();

        return response()->json([
            'summary' => [
                'total'           => $total,
                'breached'        => $breached,
                'compliant'       => $compliant,
                'compliance_rate' => $complianceRate . '%',
            ],
            'by_priority'       => $byPriority,
            'avg_by_priority'   => $avgByPriority,
        ]);
    }

    /**
     * Technician performance report.
     * GET /api/reports/technician
     */
    public function technicianPerformance(Request $request): JsonResponse
    {
        $from = $request->filled('from_date') ? Carbon::parse($request->from_date)->startOfDay() : now()->subDays(30)->startOfDay();
        $to   = $request->filled('to_date')   ? Carbon::parse($request->to_date)->endOfDay()   : now()->endOfDay();

        $nameSql = $this->concatNameSql();
        $diffTechSql = $this->diffMinutesSql('tickets.created_at', 'tickets.resolved_at');

        $performance = Ticket::internal()
            ->whereBetween('tickets.created_at', [$from, $to])
            ->whereNotNull('tickets.assigned_to')
            ->join('users', 'tickets.assigned_to', '=', 'users.id')
            ->selectRaw("
                users.id,
                {$nameSql} as name,
                COUNT(*) as total_assigned,
                SUM(CASE WHEN tickets.sla_breached = 1 THEN 1 ELSE 0 END) as sla_breached,
                SUM(CASE WHEN tickets.resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved,
                AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN {$diffTechSql} ELSE NULL END) as avg_resolution_min
            ")
            ->groupBy('users.id', 'users.first_name', 'users.last_name')
            ->orderByDesc('total_assigned')
            ->limit(20)
            ->get()
            ->map(function ($row) {
                $row->avg_resolution_min = round($row->avg_resolution_min ?? 0);
                $row->resolution_rate = $row->total_assigned > 0
                    ? round(($row->resolved / $row->total_assigned) * 100, 1)
                    : 0;
                return $row;
            });

        return response()->json([
            'summary' => [
                'total_technicians' => $performance->count(),
                'from_date'         => $from->toDateString(),
                'to_date'           => $to->toDateString(),
            ],
            'data' => $performance,
        ]);
    }

    /**
     * Customer satisfaction report.
     * GET /api/reports/satisfaction
     */
    public function satisfaction(Request $request): JsonResponse
    {
        $avgRating = Feedback::avg('rating');

        $distribution = Feedback::selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->orderBy('rating', 'desc')
            ->get();

        $total = Feedback::count();

        return response()->json([
            'summary' => [
                'total_responses' => $total,
                'average_rating'  => round($avgRating ?? 0, 2),
            ],
            'distribution' => $distribution,
        ]);
    }

    /**
     * Asset report.
     * GET /api/reports/assets
     */
    public function assets(Request $request): JsonResponse
    {
        $total      = Asset::count();
        $active     = Asset::where('status', 'active')->count();
        $maintenance= Asset::where('status', 'maintenance')->count();
        $retired    = Asset::where('status', 'retired')->count();
        $disposed   = Asset::where('status', 'disposed')->count();

        $warrantyExpiring = Asset::whereNotNull('warranty_expiry')
            ->where('warranty_expiry', '<=', now()->addDays(30))
            ->where('warranty_expiry', '>=', now())
            ->count();

        $amcExpiring = Asset::whereNotNull('amc_expiry')
            ->where('amc_expiry', '<=', now()->addDays(30))
            ->where('amc_expiry', '>=', now())
            ->count();

        $byCategory = Asset::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        $byDepartment = Asset::join('departments', 'assets.department_id', '=', 'departments.id')
            ->selectRaw('departments.name, COUNT(*) as count')
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'total'              => $total,
                'active'             => $active,
                'maintenance'        => $maintenance,
                'retired'            => $retired,
                'disposed'           => $disposed,
                'warranty_expiring'  => $warrantyExpiring,
                'amc_expiring'       => $amcExpiring,
            ],
            'by_category'   => $byCategory,
            'by_department' => $byDepartment,
        ]);
    }

    private function diffMinutesSql(string $fromCol, string $toCol): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "((strftime('%s', {$toCol}) - strftime('%s', {$fromCol})) / 60)";
        }
        return "TIMESTAMPDIFF(MINUTE, {$fromCol}, {$toCol})";
    }

    private function concatNameSql(): string
    {
        if (DB::getDriverName() === 'sqlite') {
            return "(users.first_name || ' ' || users.last_name)";
        }
        return 'CONCAT(users.first_name, " ", users.last_name)';
    }
}
