<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\AuditLog;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     * Accessible by authenticated users for lookups and admin management.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Status filtering: 'active', 'inactive', 'all'
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        } elseif (!$request->boolean('all') && !$request->boolean('admin')) {
            // Default behavior for general ticket forms and lookups: only active categories
            $query->where('is_active', true);
        }

        // Search by name, code, or description
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Include subcategories relation if requested
        if ($request->boolean('with_subcategories')) {
            $query->with(['subCategories' => function ($q) use ($request) {
                if (!$request->boolean('all') && !$request->boolean('admin')) {
                    $q->where('is_active', true);
                }
                $q->orderBy('sort_order')->orderBy('name');
            }]);
        }

        // Counts
        $query->withCount(['subCategories', 'tickets']);

        // Sorting
        $allowedSorts = ['name', 'code', 'created_at', 'updated_at', 'is_active', 'sub_categories_count', 'tickets_count'];
        $sortBy = in_array($request->get('sort_by'), $allowedSorts, true) ? $request->get('sort_by') : 'name';
        $sortOrder = $request->get('sort_order', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortOrder);

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
     * Store a newly created category.
     * Super Admin / Admin only.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name'),
            ],
            'code'        => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('categories', 'code'),
            ],
            'description' => 'nullable|string|max:1000',
            'icon'        => 'nullable|string|max:50',
            'color'       => ['nullable', 'string', 'max:30', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'is_active'   => 'boolean',
        ], [
            'name.unique'  => 'A category with this name already exists.',
            'code.unique'  => 'A category with this code already exists.',
            'color.regex'  => 'Color must be a valid hex code (e.g. #3b82f6).',
        ]);

        // Auto-generate code if not provided
        if (empty($validated['code'])) {
            $baseCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $validated['name']), 0, 8));
            $code = $baseCode ?: 'CAT';
            $counter = 1;
            while (Category::where('code', $code)->exists()) {
                $code = substr($baseCode, 0, 6) . '_' . $counter;
                $counter++;
            }
            $validated['code'] = $code;
        } else {
            $validated['code'] = strtoupper(trim($validated['code']));
        }

        $validated['name'] = trim($validated['name']);
        $validated['color'] = $validated['color'] ?? '#3b82f6';
        $validated['is_active'] = $validated['is_active'] ?? true;

        $category = Category::create($validated);
        $category->loadCount(['subCategories', 'tickets']);

        AuditLog::record('created', 'categories', [
            'model_type'  => Category::class,
            'model_id'    => $category->id,
            'description' => "Category '{$category->name}' ({$category->code}) created",
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'data'    => $category,
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        $category->load(['subCategories' => fn($q) => $q->orderBy('sort_order')->withCount('tickets')])
                 ->loadCount(['subCategories', 'tickets']);

        return response()->json(['data' => $category]);
    }

    /**
     * Update the specified category.
     * Super Admin / Admin only.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'code'        => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('categories', 'code')->ignore($category->id),
            ],
            'description' => 'nullable|string|max:1000',
            'icon'        => 'nullable|string|max:50',
            'color'       => ['nullable', 'string', 'max:30', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'is_active'   => 'boolean',
        ], [
            'name.unique'  => 'A category with this name already exists.',
            'code.unique'  => 'A category with this code already exists.',
            'color.regex'  => 'Color must be a valid hex code (e.g. #3b82f6).',
        ]);

        if (!empty($validated['code'])) {
            $validated['code'] = strtoupper(trim($validated['code']));
        }
        $validated['name'] = trim($validated['name']);

        $category->update($validated);
        $category->loadCount(['subCategories', 'tickets']);

        AuditLog::record('updated', 'categories', [
            'model_type'  => Category::class,
            'model_id'    => $category->id,
            'description' => "Category '{$category->name}' ({$category->code}) updated",
        ]);

        return response()->json([
            'message' => 'Category updated successfully',
            'data'    => $category,
        ]);
    }

    /**
     * Toggle the active status of the category.
     * Super Admin / Admin only.
     */
    public function toggleActive(Category $category): JsonResponse
    {
        $category->is_active = !$category->is_active;
        $category->save();

        $affectedTickets = $category->tickets()->count();
        $affectedSubCategories = $category->subCategories()->count();

        AuditLog::record('updated', 'categories', [
            'model_type'  => Category::class,
            'model_id'    => $category->id,
            'description' => "Category '{$category->name}' " . ($category->is_active ? 'activated' : 'deactivated'),
        ]);

        return response()->json([
            'message'               => "Category successfully " . ($category->is_active ? 'activated' : 'deactivated'),
            'data'                  => $category->fresh()->loadCount(['subCategories', 'tickets']),
            'affected_tickets'      => $affectedTickets,
            'affected_subcategories'=> $affectedSubCategories,
        ]);
    }

    /**
     * Delete the specified category if no tickets are linked.
     * Super Admin / Admin only.
     */
    public function destroy(Category $category): JsonResponse
    {
        // Check if any tickets reference this category directly
        $ticketCount = $category->tickets()->count();
        if ($ticketCount > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because {$ticketCount} ticket(s) are associated with it. Please deactivate the category instead to preserve historical records.",
                'error'   => 'referenced_by_tickets',
                'count'   => $ticketCount,
            ], 422);
        }

        // Check if subcategories of this category are linked to tickets
        $subCategoryIds = $category->subCategories()->pluck('id');
        $subTicketsCount = Ticket::whereIn('sub_category_id', $subCategoryIds)->count();
        if ($subTicketsCount > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because its subcategories are linked to {$subTicketsCount} ticket(s). Please deactivate the category instead.",
                'error'   => 'subcategories_referenced_by_tickets',
                'count'   => $subTicketsCount,
            ], 422);
        }

        // Safe to remove subcategories and category
        $category->subCategories()->delete();
        $categoryName = $category->name;
        $categoryId = $category->id;
        $category->delete();

        AuditLog::record('deleted', 'categories', [
            'model_type'  => Category::class,
            'model_id'    => $categoryId,
            'description' => "Category '{$categoryName}' deleted",
        ]);

        return response()->json([
            'message' => "Category '{$categoryName}' and its empty subcategories were deleted successfully",
        ]);
    }
}
