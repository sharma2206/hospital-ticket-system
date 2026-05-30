<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController
{
    public function index()
    {
        $categories = Category::where('is_active', true)->get();

        return response()->json(['data' => $categories]);
    }
}
