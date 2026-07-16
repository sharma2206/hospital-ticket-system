<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubCategory;
use App\Models\Category;

class SubCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Hardware' => [
                'Desktop', 'Laptop', 'Printer', 'Scanner', 'UPS', 'Switch',
                'Router', 'CCTV', 'Biometric', 'Barcode Printer', 'Barcode Scanner',
                'Monitor', 'Keyboard', 'Mouse', 'RAM', 'Hard Drive', 'Server',
            ],
            'Software' => [
                'Windows', 'MS Office', 'Outlook', 'Antivirus', 'Browser',
                'Adobe', 'AutoCAD', 'VPN Client', 'Remote Desktop',
            ],
            'Hospital Applications' => [
                'KareXpert HIS', 'EMR', 'LIS', 'RIS', 'PACS', 'Pharmacy System',
                'Billing System', 'HRMS', 'Payroll', 'Finance Module', 'OPD Module',
                'IPD Module', 'Radiology Module',
            ],
            'Network' => [
                'LAN', 'WiFi', 'Internet', 'VPN', 'Firewall', 'IP Phone',
                'Network Cable', 'DNS', 'Proxy',
            ],
            'Access Management' => [
                'User Creation', 'Password Reset', 'Permission Change', 'MFA Setup',
                'Doctor Access', 'Nurse Access', 'Admin Access', 'Account Lock',
                'Active Directory',
            ],
        ];

        foreach ($data as $categoryName => $subCategories) {
            $category = Category::where('name', 'like', "%{$categoryName}%")->first();
            if (!$category) continue;

            foreach ($subCategories as $index => $subName) {
                SubCategory::firstOrCreate(
                    ['category_id' => $category->id, 'name' => $subName],
                    [
                        'code'       => strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $subName), 0, 10)),
                        'is_active'  => true,
                        'sort_order' => $index + 1,
                    ]
                );
            }
        }
    }
}
