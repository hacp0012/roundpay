<?php

namespace Database\Seeders;

use App\Enums\AdminRole;
use App\Models\Admin;
use App\Models\Depense;
use Illuminate\Database\Seeder;

class DepenseSeeder extends Seeder
{
    public function run(): void
    {
        $principal = Admin::query()->where('role', AdminRole::Principal)->firstOrFail();

        $depenses = [
            [
                'titre' => 'Achat 30 chaises pliantes renforcées',
                'montant' => 450,
                'spent_at' => '2024-11-10',
                'categorie' => 'Mobilier',
                'description' => 'Facture Fournisseur MobilierPro SAS n° 2024-81',
                'created_by_admin_id' => $principal->id,
                'preuve_ref' => 'FAC-MOB-2024-81.pdf',
            ],
            [
                'titre' => 'Matériaux étanchéité toiture salle',
                'montant' => 1200,
                'spent_at' => '2024-11-04',
                'categorie' => 'Travaux & Rénovation',
                'description' => 'Rouleaux goudron bitume et vis de fixation charpente',
                'created_by_admin_id' => $principal->id,
                'preuve_ref' => 'FAC-BTP-912.pdf',
            ],
            [
                'titre' => 'Système micro sans fil & amplificateur',
                'montant' => 380,
                'spent_at' => '2024-10-25',
                'categorie' => 'Équipement',
                'description' => 'Sono pour les réunions plénières et assemblées générales',
                'created_by_admin_id' => $principal->id,
                'preuve_ref' => 'FAC-SONO-441.pdf',
            ],
        ];

        foreach ($depenses as $depense) {
            Depense::query()->updateOrCreate(
                ['preuve_ref' => $depense['preuve_ref']],
                $depense,
            );
        }
    }
}
