<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentsSeeder extends Seeder
{
    public function run()
    {
        $departments = [
            ['name' => 'Billing',           'code' => 'BILL'],
            ['name' => 'Pharmacy',          'code' => 'PHRM'],
            ['name' => 'OPD',               'code' => 'OPD'],
            ['name' => 'ICU',               'code' => 'ICU'],
            ['name' => 'Laboratory',        'code' => 'LAB'],
            ['name' => 'Operation Theatre', 'code' => 'OT'],
            ['name' => 'IT',                'code' => 'IT'],
            ['name' => 'HR',                'code' => 'HR'],
            ['name' => 'ADT',               'code' => 'ADT'],
            ['name' => 'Accounts',          'code' => 'ACT'],
            ['name' => 'Security',          'code' => 'SEC'],
            ['name' => 'Housekeeping',      'code' => 'HK'],
            ['name' => 'Maintenance',       'code' => 'MNT'],
            ['name' => 'Bio-Medical',       'code' => 'BM'],
            ['name' => 'Transport',         'code' => 'TRN'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['name' => $department['name']],
                $department
            );
        }
    }
}
