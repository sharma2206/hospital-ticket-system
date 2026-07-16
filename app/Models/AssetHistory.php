<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'action',
        'description',
        'old_values',
        'new_values',
        'performed_by',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
