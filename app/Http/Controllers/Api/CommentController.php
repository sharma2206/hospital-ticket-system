<?php

namespace App\Http\Controllers\Api;

use App\Models\TicketComment;
use App\Models\Ticket;
use App\Models\Notification;
use Illuminate\Http\Request;

class CommentController
{
    public function index(Ticket $ticket)
    {
        $comments = $ticket->comments()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['data' => $comments]);
    }

    public function store(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'required|string',
            'is_internal' => 'boolean',
            'mentions' => 'array',
        ]);

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            ...$validated,
        ]);

        // Notify mentioned users
        if (!empty($validated['mentions'])) {
            foreach ($validated['mentions'] as $userId) {
                Notification::create([
                    'user_id' => $userId,
                    'ticket_id' => $ticket->id,
                    'type' => 'mentioned',
                    'title' => 'You were mentioned',
                    'message' => auth()->user()->full_name . ' mentioned you in ticket ' . $ticket->ticket_number,
                ]);
            }
        }

        return response()->json([
            'message' => 'Comment added successfully',
            'data' => $comment->load('user'),
        ], 201);
    }

    public function update(Request $request, TicketComment $comment)
    {
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'comment' => 'required|string',
        ]);

        $comment->update($validated);

        return response()->json([
            'message' => 'Comment updated successfully',
            'data' => $comment,
        ]);
    }

    public function destroy(TicketComment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}
