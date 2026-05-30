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
            ['name' => 'open', 'code' => 'open', 'color' => '#fbbf24', 'description' => 'Ticket is open and awaiting assignment'],
            ['name' => 'in_progress', 'code' => 'in_progress', 'color' => '#3b82f6', 'description' => 'Ticket is being worked on'],
            ['name' => 'resolved', 'code' => 'resolved', 'color' => '#10b981', 'description' => 'Ticket has been resolved'],
            ['name' => 'closed', 'code' => 'closed', 'color' => '#6b7280', 'description' => 'Ticket is closed'],
        ];

        foreach ($statuses as $index => $status) {
            TicketStatus::updateOrCreate(
                ['name' => $status['name']],
                array_merge($status, ['order' => $index + 1])
            );
        }
    }
}
