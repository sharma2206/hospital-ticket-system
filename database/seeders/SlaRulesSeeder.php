<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SlaRule;
use App\Models\Priority;

class SlaRulesSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            'critical' => ['response' => 15,  'resolution' => 120,  'name' => 'Critical SLA'],
            'high'     => ['response' => 30,  'resolution' => 240,  'name' => 'High SLA'],
            'medium'   => ['response' => 120, 'resolution' => 480,  'name' => 'Medium SLA'],
            'low'      => ['response' => 240, 'resolution' => 1440, 'name' => 'Low SLA'],
        ];

        foreach ($rules as $priorityName => $rule) {
            $priority = Priority::where('name', 'like', "%{$priorityName}%")->first();

            if ($priority) {
                SlaRule::firstOrCreate(
                    ['priority_id' => $priority->id],
                    [
                        'name'               => $rule['name'],
                        'response_minutes'   => $rule['response'],
                        'resolution_minutes' => $rule['resolution'],
                        'is_active'          => true,
                        'description'        => "Response: {$rule['response']} min, Resolution: {$rule['resolution']} min",
                    ]
                );
            }
        }
    }
}
