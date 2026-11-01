<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\Depense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Depense>
 */
class DepenseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'titre' => fake()->sentence(5),
            'montant' => fake()->randomFloat(2, 50, 2000),
            'spent_at' => fake()->dateTimeBetween('-3 months', 'now'),
            'categorie' => fake()->randomElement(['Mobilier', 'Travaux & Rénovation', 'Équipement', 'Événement']),
            'description' => fake()->sentence(10),
            'created_by_admin_id' => Admin::factory(),
            'preuve_ref' => 'FAC-'.fake()->numerify('####').'.pdf',
        ];
    }
}
