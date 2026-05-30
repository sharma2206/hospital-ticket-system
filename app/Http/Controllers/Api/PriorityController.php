<?php

namespace App\Http\Controllers\Api;

use App\Models\Priority;
use Illuminate\Http\Request;

class PriorityController
{
    public function index()
    {
        $priorities = Priority::orderBy('level')->get();
        return response()->json(['data' => $priorities]);
    }
}
