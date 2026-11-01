<?php

namespace Database\Seeders;

use App\Enums\ContributorStatus;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use App\Models\User;
use Illuminate\Database\Seeder;

class MemberFicheRecordSeeder extends Seeder
{
    public function run(): void
    {
        $fiche = Fiche::query()->where('code', 'FC-2024-08')->firstOrFail();

        $records = [
            ['member_number' => '#M-8910', 'montant_paye' => 25, 'reste' => 0, 'statut' => ContributorStatus::Paye, 'last_payment_date' => '2024-11-14 09:15:00'],
            ['member_number' => '#M-8911', 'montant_paye' => 10, 'reste' => 15, 'statut' => ContributorStatus::Partiel, 'last_payment_date' => '2024-11-10 14:20:00'],
            ['member_number' => '#M-8914', 'montant_paye' => 0, 'reste' => 25, 'statut' => ContributorStatus::Retard, 'last_payment_date' => null],
            ['member_number' => '#M-8919', 'montant_paye' => 100, 'reste' => 0, 'statut' => ContributorStatus::PayeAvance, 'last_payment_date' => '2024-11-13 17:15:00'],
            ['member_number' => '#M-8922', 'montant_paye' => 25, 'reste' => 0, 'statut' => ContributorStatus::Paye, 'last_payment_date' => '2024-11-12 20:05:00'],
            ['member_number' => '#M-8930', 'montant_paye' => 0, 'reste' => 25, 'statut' => ContributorStatus::Retard, 'last_payment_date' => null],
            ['member_number' => '#M-8931', 'montant_paye' => 0, 'reste' => 25, 'statut' => ContributorStatus::Retard, 'last_payment_date' => null],
            ['member_number' => '#M-8932', 'montant_paye' => 15, 'reste' => 10, 'statut' => ContributorStatus::Partiel, 'last_payment_date' => '2024-11-08 11:30:00'],
            ['member_number' => '#M-8933', 'montant_paye' => 25, 'reste' => 0, 'statut' => ContributorStatus::Paye, 'last_payment_date' => '2024-11-05 16:45:00'],
            ['member_number' => '#M-8901', 'montant_paye' => 25, 'reste' => 0, 'statut' => ContributorStatus::Paye, 'last_payment_date' => '2024-11-02 10:00:00'],
        ];

        foreach ($records as $record) {
            $user = User::query()->where('member_number', $record['member_number'])->firstOrFail();

            MemberFicheRecord::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'fiche_id' => $fiche->id,
                ],
                [
                    'montant_impose' => 25,
                    'montant_paye' => $record['montant_paye'],
                    'reste' => $record['reste'],
                    'statut' => $record['statut'],
                    'last_payment_date' => $record['last_payment_date'],
                ],
            );
        }
    }
}
