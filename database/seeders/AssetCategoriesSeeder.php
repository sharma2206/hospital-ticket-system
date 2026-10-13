<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AssetCategory;

class AssetCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Desktop Computers', 'code' => 'DESK', 'description' => 'Workstation desktop towers and all-in-one PCs', 'icon' => 'monitor'],
            ['name' => 'Laptops & Ultrabooks', 'code' => 'LAPT', 'description' => 'Portable laptops and clinician ultrabooks', 'icon' => 'laptop'],
            ['name' => 'Diagnostic & Medical Displays', 'code' => 'DISP', 'description' => 'High-resolution DICOM & radiology diagnostic screens', 'icon' => 'tv'],
            ['name' => 'Standard Monitors', 'code' => 'MONI', 'description' => 'Standard office and nursing station LED monitors', 'icon' => 'monitor'],
            ['name' => 'Barcode & Wristband Printers', 'code' => 'PRNT-BC', 'description' => 'Patient wristband and laboratory thermal barcode printers', 'icon' => 'printer'],
            ['name' => 'Multi-Function Network Printers', 'code' => 'PRNT-MFP', 'description' => 'Departmental high-speed laser and MFP printers', 'icon' => 'printer'],
            ['name' => 'Barcode & 2D Handheld Scanners', 'code' => 'SCAN', 'description' => 'Pharmacy, bedside medication, and billing scanners', 'icon' => 'scan'],
            ['name' => 'Enterprise Rack Servers', 'code' => 'SRVR', 'description' => 'Data center virtualization host & database servers', 'icon' => 'server'],
            ['name' => 'Network Switches', 'code' => 'SWCH', 'description' => 'Core, distribution, and PoE access edge switches', 'icon' => 'network'],
            ['name' => 'Routers & Gateways', 'code' => 'ROUT', 'description' => 'WAN edge routers and SD-WAN gateway appliances', 'icon' => 'router'],
            ['name' => 'Firewalls & Security Appliances', 'code' => 'FWLL', 'description' => 'Next-gen perimeter and internal microsegmentation firewalls', 'icon' => 'shield'],
            ['name' => 'UPS & Backup Power', 'code' => 'UPS', 'description' => 'Server room online UPS and departmental power backups', 'icon' => 'zap'],
            ['name' => 'Biometric Attendance & Access', 'code' => 'BIOM', 'description' => 'Staff biometric punch and RFID door access terminals', 'icon' => 'fingerprint'],
            ['name' => 'CCTV & Security Cameras', 'code' => 'CCTV', 'description' => 'IP surveillance dome, bullet, and PTZ hospital cameras', 'icon' => 'video'],
            ['name' => 'Clinical Tablets', 'code' => 'TABL', 'description' => 'Medical grade bedside handheld tablets and carts', 'icon' => 'tablet'],
            ['name' => 'IP PBX & VoIP Telephones', 'code' => 'VOIP', 'description' => 'Desk VoIP phones, intercoms, and code-blue consoles', 'icon' => 'phone'],
            ['name' => 'Other IT Equipment', 'code' => 'OTHR', 'description' => 'KVM switches, external drives, and peripheral devices', 'icon' => 'cpu'],
        ];

        foreach ($categories as $cat) {
            AssetCategory::firstOrCreate(
                ['code' => $cat['code']],
                [
                    'name'        => $cat['name'],
                    'description' => $cat['description'],
                    'icon'        => $cat['icon'],
                    'is_active'   => true,
                ]
            );
        }
    }
}
