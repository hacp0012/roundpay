<?php

namespace Database\Factories;

use App\Enums\FicheStatus;
use App\Enums\FicheType;
use App\Models\Fiche;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Fiche>
 */
class FicheFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(FicheType::cases());
        $isObligatoire = $type === FicheType::Obligatoire;

        return [
            'code' => 'FC-'.fake()->unique()->numerify('####-##'),
            'titre' => fake()->sentence(4),
            'motif' => fake()->paragraph(),
            'description' => fake()->paragraphs(2, true),
            'type' => $type,
            'group_id' => $isObligatoire ? Group::factory() : null,
            'montant_impose' => $isObligatoire ? fake()->randomElement([15, 20, 25, 50]) : null,
            'cagnotte_cible' => fake()->randomElement([600, 1200, 3000, 5000]),
            'date_debut' => fake()->dateTimeBetween('-3 months', 'now'),
            'date_fin' => fake()->optional()->dateTimeBetween('now', '+2 months'),
            'statut' => FicheStatus::Ouverte,
            'is_public' => fake()->boolean(50),
            'beneficiaire' => fake()->company(),
            'categorie' => fake()->randomElement(['Équipement', 'Rénovation & Travaux', 'Événement Solidaire', 'Tontine Mutuelle', 'Solidarité d\'Urgence']),
        ];
    }

    public function obligatoire(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => FicheType::Obligatoire,
            'group_id' => Group::factory(),
            'montant_impose' => 25,
        ]);
    }

    public function libre(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => FicheType::Libre,
            'group_id' => null,
            'montant_impose' => null,
            'is_public' => true,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_public' => true,
        ]);
    }
}
