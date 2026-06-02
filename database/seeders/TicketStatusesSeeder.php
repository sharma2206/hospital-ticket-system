<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\TicketStatus;

class TicketStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            // Internal ticket statuses
            ['name' => 'open', 'code' => 'open', 'color' => '#fbbf24', 'description' => 'Ticket is open and awaiting assignment'],
            ['name' => 'in_progress', 'code' => 'in_progress', 'color' => '#3b82f6', 'description' => 'Ticket is being worked on'],
            ['name' => 'resolved', 'code' => 'resolved', 'color' => '#10b981', 'description' => 'Ticket has been resolved'],
            ['name' => 'closed', 'code' => 'closed', 'color' => '#6b7280', 'description' => 'Ticket is closed'],
            // KareXpert ticket statuses
            ['name' => 'raised', 'code' => 'raised', 'color' => '#f59e0b', 'description' => 'Ticket raised to KareXpert team'],
            ['name' => 'acknowledged', 'code' => 'acknowledged', 'color' => '#8b5cf6', 'description' => 'KareXpert acknowledged the ticket'],
            ['name' => 'karexpert_working', 'code' => 'karexpert_working', 'color' => '#0ea5e9', 'description' => 'KareXpert team is working on it'],
            ['name' => 'awaiting_deployment', 'code' => 'awaiting_deployment', 'color' => '#f97316', 'description' => 'Fix ready, awaiting deployment'],
            ['name' => 'deployed', 'code' => 'deployed', 'color' => '#10b981', 'description' => 'Fix deployed to production'],
        ];

        foreach ($statuses as $index => $status) {
            TicketStatus::updateOrCreate(
                ['name' => $status['name']],
                array_merge($status, ['order' => $index + 1])
            );
        }
    }
}
