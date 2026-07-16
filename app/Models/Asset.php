<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'asset_code',
        'name',
        'category',
        'sub_category',
        'brand',
        'model',
        'serial_number',
        'purchase_date',
        'warranty_expiry',
        'amc_expiry',
        'vendor_id',
        'department_id',
        'branch_id',
        'assigned_user_id',
        'status',
        'condition',
        'last_maintenance_date',
        'next_maintenance_date',
        'cost',
        'depreciation_rate',
        'qr_code',
        'barcode',
        'location',
        'ip_address',
        'mac_address',
        'hostname',
        'os_version',
        'specifications',
        'notes',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'amc_expiry' => 'date',
        'last_maintenance_date' => 'date',
        'next_maintenance_date' => 'date',
        'cost' => 'decimal:2',
        'depreciation_rate' => 'decimal:2',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function histories()
    {
        return $this->hasMany(AssetHistory::class)->orderByDesc('created_at');
    }

    public function maintenanceSchedules()
    {
        return $this->hasMany(MaintenanceSchedule::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function isUnderWarranty(): bool
    {
        return $this->warranty_expiry && $this->warranty_expiry->isFuture();
    }

    public function isUnderAMC(): bool
    {
        return $this->amc_expiry && $this->amc_expiry->isFuture();
    }

    public function getMaintenanceStatusAttribute(): string
    {
        if (!$this->next_maintenance_date) return 'not_scheduled';
        if ($this->next_maintenance_date->isPast()) return 'overdue';
        if ($this->next_maintenance_date->diffInDays(now()) <= 7) return 'due_soon';
        return 'ok';
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeMaintenanceDue($query)
    {
        return $query->whereDate('next_maintenance_date', '<=', now()->addDays(7))
                     ->where('status', 'active');
    }
}
