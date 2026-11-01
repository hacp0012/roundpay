<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_gateway', 32)->nullable()->after('mobile_provider');
            $table->string('currency', 3)->nullable()->after('payment_gateway');
            $table->string('gateway_order_number')->nullable()->after('payment_gateway');
            $table->string('provider_reference')->nullable()->after('gateway_order_number');
            $table->index(['payment_gateway', 'reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_gateway', 'reference']);
            $table->dropColumn(['payment_gateway', 'currency', 'gateway_order_number', 'provider_reference']);
        });
    }
};
