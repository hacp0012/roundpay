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
        Schema::create('fiches', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('titre');
            $table->text('motif');
            $table->text('description')->nullable();
            $table->string('type', 20)->index();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('montant_impose', 12, 2)->nullable();
            $table->decimal('cagnotte_cible', 12, 2)->nullable();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('statut', 20)->default('ouverte')->index();
            $table->boolean('is_public')->default(false)->index();
            $table->string('beneficiaire')->nullable();
            $table->string('categorie')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fiches');
    }
};
