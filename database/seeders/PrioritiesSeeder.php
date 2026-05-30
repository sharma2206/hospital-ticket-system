<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Priority;

class PrioritiesSeeder extends Seeder
{
    public function run(): void
    {
        $priorities = [
            ['name' => 'low', 'level' => 1, 'color' => '#6b7280', 'description' => 'Low priority issue'],
            ['name' => 'medium', 'level' => 2, 'color' => '#f59e0b', 'description' => 'Medium priority issue'],
            ['name' => 'high', 'level' => 3, 'color' => '#ef4444', 'description' => 'High priority issue'],
            ['name' => 'critical', 'level' => 4, 'color' => '#dc2626', 'description' => 'Critical priority issue'],
        ];

        foreach ($priorities as $priority) {
            Priority::updateOrCreate(
                ['name' => $priority['name']],
                $priority
            );
        }
    }
}
