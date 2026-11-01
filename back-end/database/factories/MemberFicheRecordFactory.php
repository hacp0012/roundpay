<?php

namespace Database\Factories;

use App\Enums\ContributorStatus;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MemberFicheRecord>
 */
class MemberFicheRecordFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $impose = fake()->randomElement([15, 20, 25, 50]);
        $paye = fake()->randomElement([0, $impose / 2, $impose, $impose * 2]);
        $reste = max(0, $impose - $paye);

        $statut = match (true) {
            $paye > $impose => ContributorStatus::PayeAvance,
            $paye >= $impose => ContributorStatus::Paye,
            $paye > 0 => ContributorStatus::Partiel,
            default => ContributorStatus::Retard,
        };

        return [
            'user_id' => User::factory(),
            'fiche_id' => Fiche::factory()->obligatoire(),
            'montant_impose' => $impose,
            'montant_paye' => $paye,
            'reste' => $reste,
            'statut' => $statut,
            'last_payment_date' => $paye > 0 ? fake()->dateTimeBetween('-1 month', 'now') : null,
        ];
    }
}
