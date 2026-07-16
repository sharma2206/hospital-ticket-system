<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_to'  => 'required|exists:users,id',
            'team_lead_id' => 'nullable|exists:users,id',
            'notes'        => 'nullable|string|max:500',
        ];
    }
}
