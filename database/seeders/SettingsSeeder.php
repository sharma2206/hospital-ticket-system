<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Branding
            ['key' => 'app_name',       'value' => 'HIMS Support',             'group' => 'branding',  'type' => 'string',  'label' => 'Application Name',      'is_public' => true],
            ['key' => 'app_tagline',    'value' => 'Hospital IT Ticket System', 'group' => 'branding',  'type' => 'string',  'label' => 'Tagline',               'is_public' => true],
            ['key' => 'support_email',  'value' => 'itsupport@hospital.com',   'group' => 'branding',  'type' => 'string',  'label' => 'Support Email',         'is_public' => true],
            ['key' => 'support_phone',  'value' => '+91-22-12345678',           'group' => 'branding',  'type' => 'string',  'label' => 'Support Phone',         'is_public' => true],

            // General
            ['key' => 'timezone',       'value' => 'Asia/Kolkata',             'group' => 'general',   'type' => 'string',  'label' => 'Timezone',              'is_public' => false],
            ['key' => 'date_format',    'value' => 'd M Y',                    'group' => 'general',   'type' => 'string',  'label' => 'Date Format',           'is_public' => false],
            ['key' => 'items_per_page', 'value' => '15',                       'group' => 'general',   'type' => 'integer', 'label' => 'Items Per Page',        'is_public' => false],

            // Working Hours
            ['key' => 'work_start',     'value' => '09:00',                    'group' => 'working_hours', 'type' => 'string', 'label' => 'Work Day Start',    'is_public' => false],
            ['key' => 'work_end',       'value' => '18:00',                    'group' => 'working_hours', 'type' => 'string', 'label' => 'Work Day End',      'is_public' => false],
            ['key' => 'work_days',      'value' => '["Mon","Tue","Wed","Thu","Fri","Sat"]', 'group' => 'working_hours', 'type' => 'json', 'label' => 'Working Days', 'is_public' => false],

            // Notifications
            ['key' => 'email_notifications',   'value' => '1', 'group' => 'notifications', 'type' => 'boolean', 'label' => 'Email Notifications',  'is_public' => false],
            ['key' => 'sms_notifications',     'value' => '0', 'group' => 'notifications', 'type' => 'boolean', 'label' => 'SMS Notifications',    'is_public' => false],
            ['key' => 'whatsapp_notifications','value' => '0', 'group' => 'notifications', 'type' => 'boolean', 'label' => 'WhatsApp Notifications','is_public' => false],

            // SLA
            ['key' => 'sla_enabled',          'value' => '1',     'group' => 'sla', 'type' => 'boolean', 'label' => 'SLA Enabled',               'is_public' => false],
            ['key' => 'sla_pause_on_waiting', 'value' => '1',     'group' => 'sla', 'type' => 'boolean', 'label' => 'Pause SLA on Waiting',      'is_public' => false],
            ['key' => 'escalation_enabled',   'value' => '1',     'group' => 'sla', 'type' => 'boolean', 'label' => 'Auto-Escalation Enabled',   'is_public' => false],
            ['key' => 'escalation_threshold', 'value' => '80',    'group' => 'sla', 'type' => 'integer', 'label' => 'Escalation at SLA % used',  'is_public' => false],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                array_merge($setting, ['is_public' => $setting['is_public'] ?? false])
            );
        }
    }
}
