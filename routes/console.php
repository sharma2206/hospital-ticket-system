<?php

use Illuminate\Support\Facades\Schedule;
use App\Jobs\CheckSLABreaches;
use App\Jobs\ProcessEscalations;

// SLA breach check — every 5 minutes
Schedule::job(new CheckSLABreaches)->everyFiveMinutes();

// Auto-escalation — every 15 minutes
Schedule::job(new ProcessEscalations)->everyFifteenMinutes();
