<?php

namespace Database\Seeders;

use App\Enums\FicheStatus;
use App\Enums\FicheType;
use App\Models\Fiche;
use App\Models\Group;
use Illuminate\Database\Seeder;

class FicheSeeder extends Seeder
{
    public function run(): void
    {
        $groupeA = Group::query()->where('name', 'Groupe A - Solidarité')->firstOrFail();
        $jeunesse = Group::query()->where('name', 'Groupe Jeunesse')->firstOrFail();

        $fiches = [
            [
                'code' => 'FC-2024-08',
                'titre' => 'Achat Chaises & Tables',
                'motif' => 'Collecte solidaire pour l\'aménagement de l\'espace communautaire des Lilas. Cotisation forfaitaire obligatoire avec redistribution transparente.',
                'description' => 'Ce projet vise à équiper l\'espace communautaire de 40 nouvelles chaises robustes et 6 grandes tables pliantes pour accueillir dignement nos réunions de quartier, ateliers d\'aide aux devoirs et célébrations collectives.',
                'type' => FicheType::Obligatoire,
                'group_id' => $groupeA->id,
                'montant_impose' => 25,
                'cagnotte_cible' => 600,
                'date_debut' => '2024-11-01',
                'date_fin' => '2024-12-20',
                'statut' => FicheStatus::Ouverte,
                'is_public' => true,
                'beneficiaire' => 'Espace Communautaire des Lilas',
                'categorie' => 'Équipement & Mobilier',
            ],
            [
                'code' => 'FC-2024-09',
                'titre' => 'Achat Mobilier & Chaises communautaires',
                'motif' => 'Renouvellement de 30 chaises pliantes et 4 tables pour l\'espace commun.',
                'description' => 'Complément d\'équipement pour la salle polyvalente annexe, nécessaire pour faire face à l\'affluence croissante des sessions d\'entraide le weekend.',
                'type' => FicheType::Obligatoire,
                'group_id' => $groupeA->id,
                'montant_impose' => 15,
                'cagnotte_cible' => 330,
                'date_debut' => '2024-11-15',
                'date_fin' => '2024-12-15',
                'statut' => FicheStatus::Ouverte,
                'is_public' => false,
                'beneficiaire' => 'Groupe A Solidarité',
                'categorie' => 'Équipement',
            ],
            [
                'code' => 'FC-2024-10',
                'titre' => 'Soutien Rénovation Salle Polyvalente',
                'motif' => 'Participation ouverte aux sympathisants, parents et membres d\'honneur pour les travaux d\'insonorisation et toiture.',
                'description' => 'Notre salle commune accueille chaque semaine plus de 150 personnes. Un chantier participatif de réfection du toit et de pose de panneaux acoustiques est lancé.',
                'type' => FicheType::Libre,
                'group_id' => null,
                'montant_impose' => null,
                'cagnotte_cible' => 5000,
                'date_debut' => '2024-10-01',
                'date_fin' => null,
                'statut' => FicheStatus::Ouverte,
                'is_public' => true,
                'beneficiaire' => 'Maison Commune des Quartiers Solidaires',
                'categorie' => 'Rénovation & Travaux',
            ],
            [
                'code' => 'FC-2024-11',
                'titre' => 'Cotisation Décembre - Fêtes de fin d\'année',
                'motif' => 'Banquet annuel, animation musicale et paniers solidaires pour les aînés du collectif.',
                'description' => 'Organisation de la grande fête de fin d\'année réunissant toutes les générations.',
                'type' => FicheType::Obligatoire,
                'group_id' => $jeunesse->id,
                'montant_impose' => 20,
                'cagnotte_cible' => 600,
                'date_debut' => '2024-11-20',
                'date_fin' => '2024-12-28',
                'statut' => FicheStatus::Ouverte,
                'is_public' => true,
                'beneficiaire' => 'Aînés et Jeunesse du Collectif',
                'categorie' => 'Événement Solidaire',
            ],
            [
                'code' => 'FC-2024-12',
                'titre' => 'Tontine Santé Solidarité - Tour 4/12',
                'motif' => 'Tontine mutuelle mensuelle de santé. Bénéficiaire désigné ce mois : Fatima Benali.',
                'description' => 'Mécanisme d\'épargne rotative et de prévoyance santé pour les membres cotisants du Groupe A.',
                'type' => FicheType::Obligatoire,
                'group_id' => $groupeA->id,
                'montant_impose' => 50,
                'cagnotte_cible' => 1200,
                'date_debut' => '2024-11-01',
                'date_fin' => '2024-11-30',
                'statut' => FicheStatus::Ouverte,
                'is_public' => false,
                'beneficiaire' => 'Fatima Benali (Tour 4)',
                'categorie' => 'Tontine Mutuelle',
            ],
            [
                'code' => 'FC-2024-13',
                'titre' => 'Fonds d\'Urgence Santé & Solidarité Familles',
                'motif' => 'Caisse de secours immédiate pour la prise en charge d\'ordonnances et frais d\'hospitalisation d\'urgence.',
                'description' => 'Ce fonds ouvert permet d\'intervenir en moins de 24 heures pour débloquer des avances de frais médicaux.',
                'type' => FicheType::Libre,
                'group_id' => null,
                'montant_impose' => null,
                'cagnotte_cible' => 3000,
                'date_debut' => '2024-09-01',
                'date_fin' => null,
                'statut' => FicheStatus::Ouverte,
                'is_public' => true,
                'beneficiaire' => 'Familles en détresse médicale',
                'categorie' => 'Solidarité d\'Urgence',
            ],
        ];

        foreach ($fiches as $fiche) {
            Fiche::query()->updateOrCreate(
                ['code' => $fiche['code']],
                $fiche,
            );
        }
    }
}
