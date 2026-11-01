<?php

namespace Database\Factories;

use App\Enums\MobileMoneyProvider;
use App\Enums\PaymentStatus;
use App\Models\Fiche;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $montant = fake()->randomElement([15, 25, 50, 100, 250]);
        $regle = min(25, $montant);

        return [
            'fiche_id' => Fiche::factory(),
            'user_id' => User::factory(),
            'nom_donateur_libre' => null,
            'is_anonymous' => false,
            'montant' => $montant,
            'paid_at' => fake()->dateTimeBetween('-2 months', 'now'),
            'mobile_provider' => fake()->randomElement(MobileMoneyProvider::cases()),
            'phone_number' => fake()->e164PhoneNumber(),
            'reference' => strtoupper(fake()->unique()->bothify('??-#####-###')),
            'statut' => PaymentStatus::Valide,
            'regle_fiche' => $regle,
            'credite_solde' => max(0, $montant - $regle),
            'note' => fake()->optional()->sentence(),
        ];
    }

    public function anonymous(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => null,
            'is_anonymous' => true,
            'nom_donateur_libre' => 'Donateur Bienfaiteur',
            'regle_fiche' => null,
            'credite_solde' => 0,
        ]);
    }
}
