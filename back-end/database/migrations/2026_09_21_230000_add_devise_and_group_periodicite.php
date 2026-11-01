<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portal_settings', function (Blueprint $table) {
            $table->string('devise', 8)->default('CDF')->after('message_bienvenue');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->string('periodicite', 32)->nullable()->after('icon');
        });
    }

    public function down(): void
    {
        Schema::table('portal_settings', function (Blueprint $table) {
            $table->dropColumn('devise');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('periodicite');
        });
    }
};
