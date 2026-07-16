<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vendor;

class VendorsSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = [
            [
                'name'           => 'HP India Pvt Ltd',
                'code'           => 'HPT',
                'contact_person' => 'Rajesh Kumar',
                'email'          => 'support@hp-india.com',
                'phone'          => '+91-80-12345678',
                'category'       => 'Hardware',
                'services'       => 'Printers, Laptops, Desktops, Servers',
                'is_active'      => true,
            ],
            [
                'name'           => 'Dell Technologies India',
                'code'           => 'DELL',
                'contact_person' => 'Priya Sharma',
                'email'          => 'enterprise@dell.in',
                'phone'          => '+91-80-23456789',
                'category'       => 'Hardware',
                'services'       => 'Servers, Workstations, Storage',
                'is_active'      => true,
            ],
            [
                'name'           => 'Cisco Systems India',
                'code'           => 'CSCO',
                'contact_person' => 'Anand Mehta',
                'email'          => 'network@cisco.in',
                'phone'          => '+91-80-34567890',
                'category'       => 'Network',
                'services'       => 'Switches, Routers, Firewalls, WiFi',
                'is_active'      => true,
            ],
            [
                'name'           => 'Microsoft India',
                'code'           => 'MSFT',
                'contact_person' => 'Sanjay Nair',
                'email'          => 'enterprise@microsoft.in',
                'phone'          => '+91-80-45678901',
                'category'       => 'Software',
                'services'       => 'Windows OS, MS Office, Azure, M365',
                'is_active'      => true,
            ],
            [
                'name'           => 'KareXpert Technologies',
                'code'           => 'KXT',
                'contact_person' => 'Support Team',
                'email'          => 'support@karexpert.com',
                'phone'          => '+91-22-56789012',
                'category'       => 'Hospital Application',
                'services'       => 'HIS, EMR, Billing, LIS, RIS, PACS',
                'is_active'      => true,
            ],
        ];

        foreach ($vendors as $vendor) {
            Vendor::firstOrCreate(['code' => $vendor['code']], $vendor);
        }
    }
}
