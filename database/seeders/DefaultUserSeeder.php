<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with default users.
     */
    public function run(): void
    {
        // Admin user
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => null,
            ]
        );
        $admin->syncRoles(['admin']);

        // IT Staff users
        $itStaff1 = User::updateOrCreate(
            ['email' => 'it1@example.com'],
            [
                'first_name' => 'Rahul',
                'last_name' => 'Kumar',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => 11, // IT
            ]
        );
        $itStaff1->syncRoles(['it_staff']);

        $itStaff2 = User::updateOrCreate(
            ['email' => 'it2@example.com'],
            [
                'first_name' => 'Priya',
                'last_name' => 'Singh',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => 11, // IT
            ]
        );
        $itStaff2->syncRoles(['it_staff']);

        // Regular department users
        $user1 = User::updateOrCreate(
            ['email' => 'billing@example.com'],
            [
                'first_name' => 'Amit',
                'last_name' => 'Sharma',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => 1, // Billing
            ]
        );
        $user1->syncRoles(['user']);

        $user2 = User::updateOrCreate(
            ['email' => 'opd@example.com'],
            [
                'first_name' => 'Sneha',
                'last_name' => 'Patel',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => 3, // OPD
            ]
        );
        $user2->syncRoles(['user']);

        $user3 = User::updateOrCreate(
            ['email' => 'pharmacy@example.com'],
            [
                'first_name' => 'Ravi',
                'last_name' => 'Verma',
                'password' => Hash::make('password'),
                'is_active' => true,
                'department_id' => 2, // Pharmacy
            ]
        );
        $user3->syncRoles(['user']);

        // Test user (kept for backward compat)
        $testUser = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $testUser->syncRoles(['user']);
    }
}
