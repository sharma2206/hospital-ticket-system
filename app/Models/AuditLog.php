<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'description',
        'ip_address',
        'user_agent',
        'url',
        'method',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Convenient static helper to record an audit entry.
     */
    public static function record(
        string $action,
        string $module,
        array $options = []
    ): void {
        try {
            static::create([
                'user_id'    => $options['user_id'] ?? Auth::id(),
                'action'     => $action,
                'module'     => $module,
                'model_type' => $options['model_type'] ?? null,
                'model_id'   => $options['model_id'] ?? null,
                'old_values' => $options['old_values'] ?? null,
                'new_values' => $options['new_values'] ?? null,
                'description'=> $options['description'] ?? null,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
                'url'        => Request::fullUrl(),
                'method'     => Request::method(),
            ]);
        } catch (\Throwable) {
            // Never crash the main request due to audit failure
        }
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }
}
