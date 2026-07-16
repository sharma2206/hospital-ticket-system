<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', Auth::id())->orderByDesc('created_at');

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate(20);

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'total'        => $notifications->total(),
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
            ],
            'unread_count' => Notification::where('user_id', Auth::id())->whereNull('read_at')->count(),
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', Auth::id())->whereNull('read_at')->count();
        return response()->json(['count' => $count]);
    }

    public function markRead(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllRead(): JsonResponse
    {
        Notification::where('user_id', Auth::id())->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $notification->delete();
        return response()->json(['message' => 'Notification deleted']);
    }
}
