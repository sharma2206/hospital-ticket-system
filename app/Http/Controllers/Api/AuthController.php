<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|string|email|unique:users',
            'password'      => 'required|string|min:8|confirmed',
            'phone'         => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $user = User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole('user');

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message'   => 'User registered successfully',
            'user'      => $this->userWithRole($user),
            'token'     => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'     => 'required|email',
            'password'  => 'required|string',
        ]);

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = JWTAuth::user();
        $user->update(['last_login' => now()]);

        return response()->json([
            'message'   => 'Login successful',
            'token'     => $token,
            'user'      => $this->userWithRole($user),
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());
        return response()->json(['message' => 'Logout successful']);
    }

    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return response()->json([
            'message' => 'Token refreshed',
            'token' => $token,
        ]);
    }

    public function me()
    {
        $user = Auth::user();
        return response()->json($this->userWithRole($user));
    }

    /**
     * Return user data with roles and permissions.
     */
    private function userWithRole($user)
    {
        $roles = $user->getRoleNames();
        return [
            'id'            => $user->id,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'name'          => $user->full_name,
            'email'         => $user->email,
            'phone'         => $user->phone,
            'department_id' => $user->department_id,
            'department'    => $user->department?->name,
            'avatar_url'    => $user->avatar_url,
            'is_active'     => $user->is_active,
            'last_login'    => $user->last_login,
            'roles'         => $roles,
            'role'          => $roles->first() ?? 'user',
        ];
    }
}
