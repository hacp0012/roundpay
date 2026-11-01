<?php

namespace Database\Seeders;

use App\Enums\MobileMoneyProvider;
use App\Enums\PaymentStatus;
use App\Models\Fiche;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $ficheChaises = Fiche::query()->where('code', 'FC-2024-08')->firstOrFail();
        $ficheSalle = Fiche::query()->where('code', 'FC-2024-10')->firstOrFail();

        $payments = [
            [
                'reference' => 'OM-88219-940',
                'fiche_id' => $ficheChaises->id,
                'member_number' => '#M-8914',
                'nom_donateur_libre' => null,
                'is_anonymous' => false,
                'montant' => 100,
                'paid_at' => '2024-11-14 11:24:00',
                'mobile_provider' => MobileMoneyProvider::OrangeMoney,
                'phone_number' => '+225078819440',
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => 25,
                'credite_solde' => 75,
                'note' => 'Cotisation et 3 mois d\'avance portefeuilles',
            ],
            [
                'reference' => 'MP-99410-02',
                'fiche_id' => $ficheSalle->id,
                'member_number' => null,
                'nom_donateur_libre' => 'Donateur Bienfaiteur',
                'is_anonymous' => true,
                'montant' => 250,
                'paid_at' => '2024-11-14 09:42:00',
                'mobile_provider' => MobileMoneyProvider::Mpesa,
                'phone_number' => '+243810000250',
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => null,
                'credite_solde' => 0,
                'note' => 'Don participatif toiture',
            ],
            [
                'reference' => 'AIR-55102-300',
                'fiche_id' => $ficheChaises->id,
                'member_number' => '#M-8919',
                'nom_donateur_libre' => null,
                'is_anonymous' => false,
                'montant' => 300,
                'paid_at' => '2024-11-13 17:15:00',
                'mobile_provider' => MobileMoneyProvider::AirtelMoney,
                'phone_number' => '+212661234567',
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => 25,
                'credite_solde' => 275,
                'note' => 'Avance pour l\'année',
            ],
            [
                'reference' => 'WV-19283-050',
                'fiche_id' => $ficheChaises->id,
                'member_number' => '#M-8922',
                'nom_donateur_libre' => null,
                'is_anonymous' => false,
                'montant' => 50,
                'paid_at' => '2024-11-12 20:05:00',
                'mobile_provider' => MobileMoneyProvider::Wave,
                'phone_number' => '+22376543210',
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => 25,
                'credite_solde' => 25,
                'note' => 'Paiement Wave instantané',
            ],
            [
                'reference' => 'GC-2024-0915',
                'fiche_id' => $ficheChaises->id,
                'member_number' => '#M-8910',
                'nom_donateur_libre' => null,
                'is_anonymous' => false,
                'montant' => 25,
                'paid_at' => '2024-11-14 09:15:00',
                'mobile_provider' => MobileMoneyProvider::CashGuichet,
                'phone_number' => '+243825411092',
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => 25,
                'credite_solde' => 0,
                'note' => 'Espèces remises au guichet trésorerie',
            ],
        ];

        foreach ($payments as $payment) {
            $memberNumber = $payment['member_number'];
            unset($payment['member_number']);

            $payment['user_id'] = $memberNumber
                ? User::query()->where('member_number', $memberNumber)->firstOrFail()->id
                : null;

            Payment::query()->updateOrCreate(
                ['reference' => $payment['reference']],
                $payment,
            );
        }
    }
}
