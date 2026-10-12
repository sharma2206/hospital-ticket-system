<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use App\Models\Category;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class SubCategoryController extends Controller
{
    /**
     * Display a listing of subcategories.
     * Can filter by category_id, search term, and status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SubCategory::query();

        // Filter by parent category if provided
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Status filtering: 'active', 'inactive', 'all'
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        } elseif (!$request->boolean('all') && !$request->boolean('admin')) {
            // Default behavior for general ticket forms and lookups: only active subcategories
            $query->where('is_active', true);
        }

        // Search by name or code
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Eager load category and tickets count
        $query->with('category:id,name,code,color,is_active')
              ->withCount('tickets');

        // Sorting
        $allowedSorts = ['name', 'code', 'sort_order', 'created_at', 'updated_at', 'is_active', 'tickets_count'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts, true) ? $request->get('sort_by') : 'sort_order';
        $sortOrder = $request->get('sort_order', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortOrder)->orderBy('name', 'asc');

        // Pagination if requested
        if ($request->has('page') || $request->boolean('paginate')) {
            $perPage = min((int) $request->get('per_page', 15), 100);
            $paginated = $query->paginate($perPage);

            return response()->json([
                'data' => $paginated->items(),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                ]
            ]);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Store a newly created subcategory.
     * Super Admin / Admin only.
     */
    public function store(Request $request): JsonResponse
    {
        $categoryId = $request->category_id;

        $validated = $request->validate([
            'category_id' => [
                'required',
                'exists:categories,id',
            ],
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('sub_categories', 'name')
                    ->where(fn($q) => $q->where('category_id', $categoryId)->whereNull('deleted_at')),
            ],
            'code'        => 'nullable|string|max:30',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'boolean',
        ], [
            'category_id.required' => 'Please select a parent category.',
            'category_id.exists'   => 'The selected category does not exist.',
            'name.required'        => 'Subcategory name is required.',
            'name.unique'          => 'A subcategory with this name already exists under the selected category.',
        ]);

        $validated['name'] = trim($validated['name']);

        // Auto-generate code if empty
        if (empty($validated['code'])) {
            $validated['code'] = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $validated['name']), 0, 10));
        } else {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active']  = $validated['is_active'] ?? true;

        $subCategory = SubCategory::create($validated);
        $subCategory->load('category:id,name,code,color')->loadCount('tickets');

        AuditLog::record('created', 'sub_categories', [
            'model_type'  => SubCategory::class,
            'model_id'    => $subCategory->id,
            'description' => "Subcategory '{$subCategory->name}' created under Category ID {$subCategory->category_id}",
        ]);

        return response()->json([
            'message' => 'Subcategory created successfully',
            'data'    => $subCategory,
        ], 201);
    }

    /**
     * Display the specified subcategory.
     */
    public function show(SubCategory $subCategory): JsonResponse
    {
        $subCategory->load('category:id,name,code,color,is_active')->loadCount('tickets');

        return response()->json(['data' => $subCategory]);
    }

    /**
     * Update the specified subcategory.
     * Super Admin / Admin only.
     */
    public function update(Request $request, SubCategory $subCategory): JsonResponse
    {
        $targetCategoryId = $request->get('category_id', $subCategory->category_id);

        $validated = $request->validate([
            'category_id' => [
                'sometimes',
                'required',
                'exists:categories,id',
            ],
            'name'        => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('sub_categories', 'name')
                    ->where(fn($q) => $q->where('category_id', $targetCategoryId)->whereNull('deleted_at'))
                    ->ignore($subCategory->id),
            ],
            'code'        => 'nullable|string|max:30',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'boolean',
        ], [
            'name.unique' => 'A subcategory with this name already exists under the selected category.',
        ]);

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }
        if (isset($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $subCategory->update($validated);
        $subCategory->load('category:id,name,code,color')->loadCount('tickets');

        AuditLog::record('updated', 'sub_categories', [
            'model_type'  => SubCategory::class,
            'model_id'    => $subCategory->id,
            'description' => "Subcategory '{$subCategory->name}' updated",
        ]);

        return response()->json([
            'message' => 'Subcategory updated successfully',
            'data'    => $subCategory,
        ]);
    }

    /**
     * Toggle the active status of the subcategory.
     * Super Admin / Admin only.
     */
    public function toggleActive(SubCategory $subCategory): JsonResponse
    {
        $subCategory->is_active = !$subCategory->is_active;
        $subCategory->save();

        $affectedTickets = $subCategory->tickets()->count();

        AuditLog::record('updated', 'sub_categories', [
            'model_type'  => SubCategory::class,
            'model_id'    => $subCategory->id,
            'description' => "Subcategory '{$subCategory->name}' " . ($subCategory->is_active ? 'activated' : 'deactivated'),
        ]);

        return response()->json([
            'message'          => "Subcategory successfully " . ($subCategory->is_active ? 'activated' : 'deactivated'),
            'data'             => $subCategory->fresh()->load('category:id,name,code,color')->loadCount('tickets'),
            'affected_tickets' => $affectedTickets,
        ]);
    }

    /**
     * Delete the specified subcategory if no tickets are linked.
     * Super Admin / Admin only.
     */
    public function destroy(SubCategory $subCategory): JsonResponse
    {
        $ticketCount = $subCategory->tickets()->count();
        if ($ticketCount > 0) {
            return response()->json([
                'message' => "Cannot delete subcategory '{$subCategory->name}' because {$ticketCount} ticket(s) reference it. Please deactivate the subcategory instead to preserve ticket history.",
                'error'   => 'referenced_by_tickets',
                'count'   => $ticketCount,
            ], 422);
        }

        $subCategoryName = $subCategory->name;
        $subCategoryId = $subCategory->id;
        $subCategory->delete();

        AuditLog::record('deleted', 'sub_categories', [
            'model_type'  => SubCategory::class,
            'model_id'    => $subCategoryId,
            'description' => "Subcategory '{$subCategoryName}' deleted",
        ]);

        return response()->json([
            'message' => "Subcategory '{$subCategoryName}' deleted successfully",
        ]);
    }
}
