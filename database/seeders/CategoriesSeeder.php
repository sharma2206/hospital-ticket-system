<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Internal IT categories
            ['name' => 'Hardware', 'code' => 'HW', 'description' => 'Hardware-related issues'],
            ['name' => 'Software', 'code' => 'SW', 'description' => 'Software-related issues'],
            ['name' => 'Network', 'code' => 'NET', 'description' => 'Network connectivity issues'],
            ['name' => 'KareXpert HMS', 'code' => 'HMS', 'description' => 'Issues with KareXpert HMS system'],
            ['name' => 'Printer', 'code' => 'PRT', 'description' => 'Printer-related issues'],
            ['name' => 'Other', 'code' => 'OTH', 'description' => 'Other miscellaneous issues'],
            // KareXpert-specific categories
            ['name' => 'Bug Fix', 'code' => 'BUG', 'description' => 'Software bug requiring fix from KareXpert'],
            ['name' => 'Feature Request', 'code' => 'FEAT', 'description' => 'New feature or enhancement request'],
            ['name' => 'Configuration', 'code' => 'CFG', 'description' => 'System configuration or setup changes'],
            ['name' => 'Data Correction', 'code' => 'DATA', 'description' => 'Data fix or correction needed in HMS'],
            ['name' => 'Training/Support', 'code' => 'TRN', 'description' => 'Training or technical support needed'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
