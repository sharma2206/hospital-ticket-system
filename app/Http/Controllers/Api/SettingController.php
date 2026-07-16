<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Setting::query();

        if ($request->filled('group')) {
            $query->where('group', $request->group);
        }
        // Non-admin users only get public settings
        if (!$request->user()->hasAnyRole(['super_admin', 'admin', 'it_manager'])) {
            $query->where('is_public', true);
        }

        $settings = $query->orderBy('group')->orderBy('key')->get();
        $grouped = $settings->groupBy('group');

        return response()->json(['data' => $grouped]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings'       => 'required|array',
            'settings.*.key' => 'required|string|exists:settings,key',
            'settings.*.value' => 'required',
        ]);

        foreach ($validated['settings'] as $item) {
            Setting::set($item['key'], $item['value']);
        }

        AuditLog::record('updated', 'settings', ['description' => 'System settings updated']);

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function updateSingle(Request $request, string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->firstOrFail();
        $request->validate(['value' => 'required']);

        Setting::set($key, $request->value);

        return response()->json(['message' => "Setting '{$key}' updated", 'data' => $setting->fresh()]);
    }

    public function groups(): JsonResponse
    {
        $groups = Setting::distinct()->pluck('group')->sort()->values();
        return response()->json(['data' => $groups]);
    }
}
