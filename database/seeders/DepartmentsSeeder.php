<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentsSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Billing',           'code' => 'BILL',  'location' => 'Ground Floor'],
            ['name' => 'Pharmacy',          'code' => 'PHRM',  'location' => 'Ground Floor'],
            ['name' => 'OPD',               'code' => 'OPD',   'location' => 'First Floor'],
            ['name' => 'Radiology',         'code' => 'RAD',   'location' => 'Second Floor'],
            ['name' => 'ICU',               'code' => 'ICU',   'location' => 'Third Floor'],
            ['name' => 'Laboratory',        'code' => 'LAB',   'location' => 'Ground Floor'],
            ['name' => 'Operation Theatre', 'code' => 'OT',    'location' => 'Third Floor'],
            ['name' => 'Emergency',         'code' => 'EMG',   'location' => 'Ground Floor'],
            ['name' => 'Administration',    'code' => 'ADMIN', 'location' => 'First Floor'],
            ['name' => 'IT',                'code' => 'IT',    'location' => 'First Floor'],
            ['name' => 'HR',                'code' => 'HR',    'location' => 'First Floor'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['name' => $department['name']],
                $department
            );
        }
    }
}
