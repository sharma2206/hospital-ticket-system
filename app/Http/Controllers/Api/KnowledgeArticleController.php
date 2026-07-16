<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeArticle;
use App\Models\Ticket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class KnowledgeArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeArticle::with(['category:id,name', 'author:id,first_name,last_name']);

        // Non-staff users see only published articles
        $user = Auth::user();
        $staffRoles = ['super_admin', 'admin', 'it_manager', 'team_lead', 'technician', 'it_staff'];
        if (!$user->hasAnyRole($staffRoles)) {
            $query->published();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('solution_summary', 'like', "%{$s}%")
                  ->orWhereJsonContains('tags', $s)
            );
        }

        $articles = $query->orderByDesc('created_at')->paginate(15);

        return response()->json([
            'data' => $articles->items(),
            'pagination' => [
                'total'        => $articles->total(),
                'current_page' => $articles->currentPage(),
                'last_page'    => $articles->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'category_id'      => 'nullable|exists:categories,id',
            'content'          => 'required|string',
            'symptoms'         => 'nullable|string',
            'solution_summary' => 'nullable|string|max:500',
            'tags'             => 'nullable|array',
            'tags.*'           => 'string|max:50',
            'status'           => 'nullable|in:draft,published',
        ]);

        $article = KnowledgeArticle::create(array_merge($validated, [
            'author_id'    => Auth::id(),
            'published_at' => ($validated['status'] ?? '') === 'published' ? now() : null,
        ]));

        AuditLog::record('created', 'knowledge_base', ['model_type' => KnowledgeArticle::class, 'model_id' => $article->id]);

        return response()->json(['message' => 'Article created', 'data' => $article->load('category', 'author')], 201);
    }

    public function show(KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $knowledgeArticle->incrementViews();
        return response()->json([
            'data' => $knowledgeArticle->load(['category', 'author:id,first_name,last_name', 'tickets:id,ticket_number,title']),
        ]);
    }

    public function update(Request $request, KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'category_id'      => 'nullable|exists:categories,id',
            'content'          => 'sometimes|string',
            'symptoms'         => 'nullable|string',
            'solution_summary' => 'nullable|string|max:500',
            'tags'             => 'nullable|array',
            'status'           => 'nullable|in:draft,published,archived',
        ]);

        $validated['updated_by'] = Auth::id();
        $knowledgeArticle->update($validated);

        return response()->json(['message' => 'Article updated', 'data' => $knowledgeArticle->fresh()->load('category')]);
    }

    public function publish(KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $knowledgeArticle->publish();
        return response()->json(['message' => 'Article published', 'data' => $knowledgeArticle]);
    }

    public function unpublish(KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $knowledgeArticle->unpublish();
        return response()->json(['message' => 'Article unpublished', 'data' => $knowledgeArticle]);
    }

    public function linkToTicket(Request $request, KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $request->validate(['ticket_id' => 'required|exists:tickets,id']);
        $knowledgeArticle->tickets()->syncWithoutDetaching([
            $request->ticket_id => ['linked_by' => Auth::id()],
        ]);
        return response()->json(['message' => 'Article linked to ticket']);
    }

    public function destroy(KnowledgeArticle $knowledgeArticle): JsonResponse
    {
        $knowledgeArticle->delete();
        return response()->json(['message' => 'Article deleted']);
    }
}
