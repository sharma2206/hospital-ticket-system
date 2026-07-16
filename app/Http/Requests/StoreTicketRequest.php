<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                 => 'required|string|max:255',
            'description'           => 'required|string|min:10',
            'category_id'           => 'required|exists:categories,id',
            'sub_category_id'       => 'nullable|exists:sub_categories,id',
            'priority_id'           => 'required|exists:priorities,id',
            'department_id'         => 'required|exists:departments,id',
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
            'attachments'           => 'nullable|array',
            'attachments.*'         => 'file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip,txt,log',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'Please provide a ticket title.',
            'description.required' => 'Please describe the issue in detail.',
            'description.min'      => 'Description must be at least 10 characters.',
            'category_id.required' => 'Please select a category.',
            'priority_id.required' => 'Please select a priority level.',
            'department_id.required'=> 'Please select the affected department.',
        ];
    }
}
