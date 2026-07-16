<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Core system
            RolesAndPermissionsSeeder::class,
            BranchesSeeder::class,
            DepartmentsSeeder::class,
            CategoriesSeeder::class,
            SubCategoriesSeeder::class,
            PrioritiesSeeder::class,
            TicketStatusesSeeder::class,
            VendorsSeeder::class,
            SlaRulesSeeder::class,
            SettingsSeeder::class,

            // Users (must be after branches/departments/roles)
            DefaultUserSeeder::class,
        ]);
    }
}
