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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiche_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom_donateur_libre')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->decimal('montant', 12, 2);
            $table->timestamp('paid_at');
            $table->string('mobile_provider', 32)->index();
            $table->string('phone_number', 32)->nullable();
            $table->string('reference')->unique();
            $table->string('statut', 20)->default('valide')->index();
            $table->decimal('regle_fiche', 12, 2)->nullable();
            $table->decimal('credite_solde', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
