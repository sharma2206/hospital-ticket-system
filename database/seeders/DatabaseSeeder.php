<?php

namespace Database\Seeders;

use Database\Seeders\DefaultUserSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DepartmentsSeeder::class,
            CategoriesSeeder::class,
            PrioritiesSeeder::class,
            TicketStatusesSeeder::class,
            RolesAndPermissionsSeeder::class,
            DefaultUserSeeder::class,
        ]);
    }
}
