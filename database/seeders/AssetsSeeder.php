<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Asset;
use App\Models\AssetHistory;
use App\Models\MaintenanceSchedule;
use App\Models\Department;
use App\Models\Branch;
use App\Models\Vendor;
use App\Models\User;

class AssetsSeeder extends Seeder
{
    public function run(): void
    {
        if (Asset::count() > 0) {
            return;
        }

        $branches = Branch::all();
        $departments = Department::all();
        $vendors = Vendor::all();
        $users = User::all();

        $mainBranch = $branches->first();
        $emrgDept = $departments->where('code', 'EMRG')->first() ?? $departments->first();
        $icuDept = $departments->where('code', 'ICU')->first() ?? $departments->first();
        $billingDept = $departments->where('code', 'BILL')->first() ?? $departments->first();
        $itDept = $departments->where('code', 'IT')->first() ?? $departments->first();
        $radiologyDept = $departments->where('code', 'RAD')->first() ?? $departments->first();

        $hpVendor = $vendors->first();
        $dellVendor = $vendors->skip(1)->first() ?? $hpVendor;
        $ciscoVendor = $vendors->skip(2)->first() ?? $hpVendor;

        $nurseUser = $users->where('email', 'sarah.connor@hospital.org')->first() ?? $users->first();
        $itUser = $users->where('email', 'david.tech@hospital.org')->first() ?? $users->first();

        $items = [
            [
                'asset_code'          => 'AST-2026-0001',
                'name'                => 'ICU Patient Telemetry Workstation',
                'category'            => 'Desktop Computers',
                'brand'               => 'Dell',
                'model'               => 'OptiPlex 7090 Micro',
                'serial_number'       => 'DL-OPT-7090-001',
                'department_id'       => $icuDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => $nurseUser?->id,
                'vendor_id'           => $dellVendor?->id,
                'status'              => 'active',
                'condition'           => 'excellent',
                'location'            => 'ICU Block A, Bed Console 1',
                'ip_address'          => '192.168.10.45',
                'hostname'            => 'ICU-PC-01',
                'cost'                => 65000.00,
                'purchase_date'       => now()->subMonths(6),
                'warranty_expiry'     => now()->addMonths(30),
                'next_maintenance_date'=> now()->addDays(20),
            ],
            [
                'asset_code'          => 'AST-2026-0002',
                'name'                => 'Emergency Reception Thermal Receipt Printer',
                'category'            => 'Barcode & Wristband Printers',
                'brand'               => 'Zebra',
                'model'               => 'ZD421 Direct Thermal',
                'serial_number'       => 'ZB-ZD421-9921',
                'department_id'       => $emrgDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => null,
                'vendor_id'           => $hpVendor?->id,
                'status'              => 'maintenance',
                'condition'           => 'fair',
                'location'            => 'Emergency Reception Desk 2',
                'ip_address'          => '192.168.20.12',
                'cost'                => 28500.00,
                'purchase_date'       => now()->subMonths(14),
                'warranty_expiry'     => now()->addDays(15), // Expiring soon!
                'last_maintenance_date'=> now()->subMonths(3),
                'next_maintenance_date'=> now()->subDays(2), // Overdue!
            ],
            [
                'asset_code'          => 'AST-2026-0003',
                'name'                => 'Billing Counter Laser MFP Printer',
                'category'            => 'Multi-Function Network Printers',
                'brand'               => 'HP',
                'model'               => 'LaserJet Enterprise M528dn',
                'serial_number'       => 'HP-M528-77123',
                'department_id'       => $billingDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => null,
                'vendor_id'           => $hpVendor?->id,
                'status'              => 'active',
                'condition'           => 'good',
                'location'            => 'Billing Central Hall, Counter 3',
                'ip_address'          => '192.168.30.5',
                'hostname'            => 'PRNT-BILL-01',
                'cost'                => 84000.00,
                'purchase_date'       => now()->subMonths(8),
                'warranty_expiry'     => now()->addMonths(16),
                'next_maintenance_date'=> now()->addDays(5), // Due soon!
            ],
            [
                'asset_code'          => 'AST-2026-0004',
                'name'                => 'Radiology Diagnostic High-Res Display',
                'category'            => 'Diagnostic & Medical Displays',
                'brand'               => 'Barco',
                'model'               => 'Nio Color 3MP (MDNC-3421)',
                'serial_number'       => 'BAR-NIO3-4412',
                'department_id'       => $radiologyDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => null,
                'vendor_id'           => $dellVendor?->id,
                'status'              => 'active',
                'condition'           => 'excellent',
                'location'            => 'Radiology Reading Room 1',
                'cost'                => 240000.00,
                'purchase_date'       => now()->subYears(2),
                'warranty_expiry'     => now()->subMonths(1), // Expired!
                'next_maintenance_date'=> now()->addMonths(2),
            ],
            [
                'asset_code'          => 'AST-2026-0005',
                'name'                => 'Core Distribution Network Switch',
                'category'            => 'Network Switches',
                'brand'               => 'Cisco',
                'model'               => 'Catalyst 9300 48-Port PoE+',
                'serial_number'       => 'CSCO-C9300-8812',
                'department_id'       => $itDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => $itUser?->id,
                'vendor_id'           => $ciscoVendor?->id,
                'status'              => 'active',
                'condition'           => 'excellent',
                'location'            => 'Main Server Room, Rack 2, U14',
                'ip_address'          => '10.0.0.1',
                'hostname'            => 'SW-CORE-01',
                'cost'                => 350000.00,
                'purchase_date'       => now()->subMonths(10),
                'warranty_expiry'     => now()->addMonths(26),
                'next_maintenance_date'=> now()->addMonths(4),
            ],
            [
                'asset_code'          => 'AST-2026-0006',
                'name'                => 'Hospital Central Server Room Online UPS',
                'category'            => 'UPS & Backup Power',
                'brand'               => 'APC by Schneider',
                'model'               => 'Smart-UPS On-Line 10kVA',
                'serial_number'       => 'APC-SRT10K-009',
                'department_id'       => $itDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => $itUser?->id,
                'vendor_id'           => $hpVendor?->id,
                'status'              => 'active',
                'condition'           => 'good',
                'location'            => 'Main Server Room, Power Room',
                'cost'                => 420000.00,
                'purchase_date'       => now()->subYears(1),
                'warranty_expiry'     => now()->addMonths(12),
                'next_maintenance_date'=> now()->addDays(7), // Due soon!
            ],
            [
                'asset_code'          => 'AST-2026-0007',
                'name'                => 'Legacy Billing Desktop PC (Decommissioned)',
                'category'            => 'Desktop Computers',
                'brand'               => 'Lenovo',
                'model'               => 'ThinkCentre M720',
                'serial_number'       => 'LEN-M720-3312',
                'department_id'       => $billingDept?->id,
                'branch_id'           => $mainBranch?->id,
                'assigned_user_id'    => null,
                'vendor_id'           => $dellVendor?->id,
                'status'              => 'retired',
                'condition'           => 'poor',
                'location'            => 'IT Salvage & Scrap Room',
                'cost'                => 38000.00,
                'purchase_date'       => now()->subYears(5),
                'warranty_expiry'     => now()->subYears(2),
            ],
        ];

        foreach ($items as $data) {
            $asset = Asset::create($data);

            AssetHistory::create([
                'asset_id'     => $asset->id,
                'action'       => 'created',
                'description'  => "Asset {$asset->asset_code} registered in system",
                'new_values'   => $asset->toArray(),
                'performed_by' => $itUser?->id,
            ]);

            if ($asset->assigned_user_id) {
                AssetHistory::create([
                    'asset_id'     => $asset->id,
                    'action'       => 'assigned',
                    'description'  => "Assigned to {$asset->assignedUser?->first_name} {$asset->assignedUser?->last_name}",
                    'new_values'   => ['assigned_user_id' => $asset->assigned_user_id],
                    'performed_by' => $itUser?->id,
                ]);
            }

            // Create maintenance schedule for scheduled ones
            if ($asset->next_maintenance_date) {
                MaintenanceSchedule::create([
                    'asset_id'        => $asset->id,
                    'title'           => "Preventive Service: {$asset->name}",
                    'description'     => "Routine quarterly diagnostics, dust extraction, thermal check, firmware check",
                    'type'            => 'preventive',
                    'frequency'       => 'quarterly',
                    'next_due_date'   => $asset->next_maintenance_date,
                    'last_done_date'  => $asset->last_maintenance_date,
                    'assigned_to'     => $itUser?->id,
                    'department_id'   => $asset->department_id,
                    'status'          => $asset->next_maintenance_date->isPast() ? 'overdue' : 'pending',
                    'is_active'       => true,
                ]);
            }
        }
    }
}
