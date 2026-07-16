<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                 => 'sometimes|string|max:255',
            'description'           => 'sometimes|string|min:10',
            'category_id'           => 'sometimes|exists:categories,id',
            'sub_category_id'       => 'nullable|exists:sub_categories,id',
            'priority_id'           => 'sometimes|exists:priorities,id',
            'department_id'         => 'sometimes|exists:departments,id',
            'branch_id'             => 'nullable|exists:branches,id',
            'building'              => 'nullable|string|max:100',
            'floor'                 => 'nullable|string|max:20',
            'room_number'           => 'nullable|string|max:50',
            'location_detail'       => 'nullable|string|max:255',
            'requester_name'        => 'nullable|string|max:150',
            'requester_employee_id' => 'nullable|string|max:50',
            'requester_mobile'      => 'nullable|string|max:20',
            'requester_email'       => 'nullable|email|max:150',
            'asset_id'              => 'nullable|exists:assets,id',
            'vendor_id'             => 'nullable|exists:vendors,id',
            'source'                => 'nullable|in:self_service,email,whatsapp,phone,walk_in,mobile_app,vendor,monitoring,api',
            'impact'                => 'nullable|in:low,medium,high,critical',
            'urgency'               => 'nullable|in:low,medium,high,critical',
            'assigned_to'           => 'nullable|exists:users,id',
            'team_lead_id'          => 'nullable|exists:users,id',
            'status_id'             => 'nullable|exists:ticket_statuses,id',
            'resolution_notes'      => 'nullable|string',
            'root_cause'            => 'nullable|string',
            'closure_notes'         => 'nullable|string',
        ];
    }
}
