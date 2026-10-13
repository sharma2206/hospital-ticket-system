<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssetCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AssetCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AssetCategory::withCount('assets')->orderBy('name');

        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100|unique:asset_categories,name',
            'code'        => 'required|string|max:50|unique:asset_categories,code',
            'description' => 'nullable|string|max:255',
            'icon'        => 'nullable|string|max:50',
            'is_active'   => 'nullable|boolean',
        ]);

        $category = AssetCategory::create($validated);

        return response()->json([
            'message' => 'Asset category created successfully',
            'data'    => $category,
        ], 201);
    }

    public function show(AssetCategory $assetCategory): JsonResponse
    {
        return response()->json([
            'data' => $assetCategory->loadCount('assets'),
        ]);
    }

    public function update(Request $request, AssetCategory $assetCategory): JsonResponse
    {
        $validated = $request->validate([
            'name'        => "required|string|max:100|unique:asset_categories,name,{$assetCategory->id}",
            'code'        => "required|string|max:50|unique:asset_categories,code,{$assetCategory->id}",
            'description' => 'nullable|string|max:255',
            'icon'        => 'nullable|string|max:50',
            'is_active'   => 'nullable|boolean',
        ]);

        $assetCategory->update($validated);

        return response()->json([
            'message' => 'Asset category updated successfully',
            'data'    => $assetCategory,
        ]);
    }

    public function toggleActive(AssetCategory $assetCategory): JsonResponse
    {
        $assetCategory->update(['is_active' => !$assetCategory->is_active]);

        return response()->json([
            'message'   => 'Asset category status updated',
            'is_active' => $assetCategory->is_active,
            'data'      => $assetCategory,
        ]);
    }

    public function destroy(AssetCategory $assetCategory): JsonResponse
    {
        if ($assetCategory->assets()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that is assigned to existing assets. You can deactivate it instead.',
            ], 422);
        }

        $assetCategory->delete();

        return response()->json([
            'message' => 'Asset category deleted successfully',
        ]);
    }
}
