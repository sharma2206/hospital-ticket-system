<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;

class UserController
{
    /**
     * List IT staff members (for ticket assignment dropdown).
     */
    public function itStaff()
    {
        $staff = User::role(['admin', 'it_staff'])
            ->where('is_active', true)
            ->select('id', 'first_name', 'last_name', 'email', 'department_id')
            ->with('department:id,name')
            ->get()
            ->map(function ($u) {
                return [
                    'id'         => $u->id,
                    'name'       => $u->full_name,
                    'email'      => $u->email,
                    'department' => $u->department?->name,
                ];
            });

        return response()->json($staff);
    }

    /**
     * List all active users.
     */
    public function index()
    {
        $users = User::where('is_active', true)
            ->select('id', 'first_name', 'last_name', 'email', 'department_id', 'is_active', 'last_login')
            ->with('department:id,name', 'roles')
            ->orderBy('first_name')
            ->get()
            ->map(function ($u) {
                return [
                    'id'         => $u->id,
                    'name'       => $u->full_name,
                    'email'      => $u->email,
                    'department' => $u->department?->name,
                    'role'       => $u->roles->first()?->name ?? 'user',
                    'is_active'  => $u->is_active,
                    'last_login' => $u->last_login,
                ];
            });

        return response()->json(['data' => $users]);
    }
}
