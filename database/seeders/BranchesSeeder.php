<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;

class BranchesSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name'      => 'Main Hospital',
                'code'      => 'MAIN',
                'address'   => '1, Hospital Road, Sector 5',
                'city'      => 'Mumbai',
                'phone'     => '+91-22-12345678',
                'is_active' => true,
            ],
            [
                'name'      => 'North Campus',
                'code'      => 'NORTH',
                'address'   => '45, North Avenue, Phase 2',
                'city'      => 'Mumbai',
                'phone'     => '+91-22-23456789',
                'is_active' => true,
            ],
            [
                'name'      => 'South Clinic',
                'code'      => 'SOUTH',
                'address'   => '12, South Street, Zone A',
                'city'      => 'Mumbai',
                'phone'     => '+91-22-34567890',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $branch) {
            Branch::firstOrCreate(['code' => $branch['code']], $branch);
        }
    }
}
