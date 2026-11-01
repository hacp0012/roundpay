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
        Schema::create('member_fiche_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fiche_id')->constrained()->cascadeOnDelete();
            $table->decimal('montant_impose', 12, 2);
            $table->decimal('montant_paye', 12, 2)->default(0);
            $table->decimal('reste', 12, 2)->default(0);
            $table->string('statut', 20)->default('retard')->index();
            $table->timestamp('last_payment_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'fiche_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_fiche_records');
    }
};
