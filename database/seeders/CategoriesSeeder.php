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
            ['name' => 'Hardware', 'code' => 'HW', 'description' => 'Hardware-related issues'],
            ['name' => 'Software', 'code' => 'SW', 'description' => 'Software-related issues'],
            ['name' => 'Network', 'code' => 'NET', 'description' => 'Network connectivity issues'],
            ['name' => 'KareXpert HMS', 'code' => 'HMS', 'description' => 'Issues with KareXpert HMS system'],
            ['name' => 'Printer', 'code' => 'PRT', 'description' => 'Printer-related issues'],
            ['name' => 'Other', 'code' => 'OTH', 'description' => 'Other miscellaneous issues'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
