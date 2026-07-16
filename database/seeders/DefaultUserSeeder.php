<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $branch = Branch::where('code', 'MAIN')->first();
        $itDept = Department::where('code', 'IT')
                            ->orWhere('name', 'like', '%IT%')
                            ->orWhere('name', 'like', '%Information Technology%')
                            ->first();

        // ── Super Admin ──────────────────────────────────────────────
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@hospital.com'],
            [
                'first_name'  => 'Super',
                'last_name'   => 'Admin',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'department_id' => $itDept?->id,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP001',
                'designation' => 'System Administrator',
            ]
        );
        $superAdmin->syncRoles(['super_admin']);

        // ── IT Manager ───────────────────────────────────────────────
        $itManager = User::updateOrCreate(
            ['email' => 'it.manager@hospital.com'],
            [
                'first_name'  => 'Vikram',
                'last_name'   => 'Mehta',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'department_id' => $itDept?->id,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP002',
                'designation' => 'IT Manager',
            ]
        );
        $itManager->syncRoles(['it_manager']);

        // ── Team Lead ─────────────────────────────────────────────────
        $teamLead = User::updateOrCreate(
            ['email' => 'teamlead@hospital.com'],
            [
                'first_name'  => 'Anita',
                'last_name'   => 'Sharma',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'department_id' => $itDept?->id,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP003',
                'designation' => 'Team Lead - IT Support',
            ]
        );
        $teamLead->syncRoles(['team_lead']);

        // ── Technicians ───────────────────────────────────────────────
        $tech1 = User::updateOrCreate(
            ['email' => 'technician1@hospital.com'],
            [
                'first_name'  => 'Rahul',
                'last_name'   => 'Kumar',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'department_id' => $itDept?->id,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP004',
                'designation' => 'IT Technician',
            ]
        );
        $tech1->syncRoles(['technician']);

        $tech2 = User::updateOrCreate(
            ['email' => 'technician2@hospital.com'],
            [
                'first_name'  => 'Priya',
                'last_name'   => 'Singh',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'department_id' => $itDept?->id,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP005',
                'designation' => 'Network Technician',
            ]
        );
        $tech2->syncRoles(['technician']);

        // ── Department Coordinator ────────────────────────────────────
        $deptCoord = User::updateOrCreate(
            ['email' => 'coordinator@hospital.com'],
            [
                'first_name'  => 'Meera',
                'last_name'   => 'Nair',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'branch_id'   => $branch?->id,
                'employee_id' => 'EMP006',
                'designation' => 'Department IT Coordinator',
            ]
        );
        $deptCoord->syncRoles(['dept_coordinator']);

        // ── Employees ─────────────────────────────────────────────────
        $employees = [
            ['email' => 'billing@hospital.com',  'first_name' => 'Amit',  'last_name' => 'Sharma', 'emp' => 'EMP007', 'dept' => 'Billing'],
            ['email' => 'opd@hospital.com',       'first_name' => 'Sneha', 'last_name' => 'Patel',  'emp' => 'EMP008', 'dept' => 'OPD'],
            ['email' => 'pharmacy@hospital.com',  'first_name' => 'Ravi',  'last_name' => 'Verma',  'emp' => 'EMP009', 'dept' => 'Pharmacy'],
            ['email' => 'radiology@hospital.com', 'first_name' => 'Suman', 'last_name' => 'Das',    'emp' => 'EMP010', 'dept' => 'Radiology'],
        ];

        foreach ($employees as $emp) {
            $dept = Department::where('name', 'like', "%{$emp['dept']}%")->first();
            $user = User::updateOrCreate(
                ['email' => $emp['email']],
                [
                    'first_name'   => $emp['first_name'],
                    'last_name'    => $emp['last_name'],
                    'password'     => Hash::make('Admin@1234'),
                    'is_active'    => true,
                    'department_id'=> $dept?->id,
                    'branch_id'    => $branch?->id,
                    'employee_id'  => $emp['emp'],
                    'designation'  => 'Staff',
                ]
            );
            $user->syncRoles(['employee']);
        }

        // ── Vendor User ───────────────────────────────────────────────
        $vendorUser = User::updateOrCreate(
            ['email' => 'vendor@hospital.com'],
            [
                'first_name'  => 'Vendor',
                'last_name'   => 'Support',
                'password'    => Hash::make('Admin@1234'),
                'is_active'   => true,
                'employee_id' => 'VND001',
                'designation' => 'Vendor Representative',
            ]
        );
        $vendorUser->syncRoles(['vendor']);

        // ── Legacy users (backward compatibility) ─────────────────────
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'Admin',
                'last_name'  => 'User',
                'password'   => Hash::make('password'),
                'is_active'  => true,
            ]
        );
        $admin->syncRoles(['admin']);

        foreach (['it1@example.com' => 'Rahul', 'it2@example.com' => 'Priya'] as $email => $name) {
            $u = User::updateOrCreate(
                ['email' => $email],
                ['first_name' => $name, 'last_name' => 'IT', 'password' => Hash::make('password'), 'is_active' => true]
            );
            $u->syncRoles(['it_staff']);
        }

        foreach (['billing@example.com', 'opd@example.com', 'pharmacy@example.com', 'test@example.com'] as $email) {
            $u = User::firstOrCreate(
                ['email' => $email],
                ['first_name' => 'User', 'last_name' => ucfirst(explode('@', $email)[0]), 'password' => Hash::make('password'), 'is_active' => true]
            );
            if (!$u->hasAnyRole(['user', 'employee'])) {
                $u->syncRoles(['user']);
            }
        }
    }
}
