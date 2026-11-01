<?php

namespace Database\Seeders;

use App\Models\Group;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [
                'name' => 'Groupe A - Solidarité',
                'description' => 'Membres actifs du collectif central pour entraide et projets communautaires.',
                'color' => '#3f3bbd',
                'icon' => 'groups',
                'periodicite' => 'Mensuelle',
            ],
            [
                'name' => 'Groupe Jeunesse',
                'description' => 'Jeunes adhérents et étudiants du collectif pour initiatives dynamiques et fêtes.',
                'color' => '#475e90',
                'icon' => 'diversity_3',
                'periodicite' => 'Mensuelle',
            ],
            [
                'name' => 'Bureau Exécutif',
                'description' => 'Coordinateurs, trésorière et responsables de gouvernance.',
                'color' => '#111418',
                'icon' => 'shield_person',
                'periodicite' => 'Trimestrielle',
            ],
            [
                'name' => 'Groupe B - Entraide Diaspo',
                'description' => 'Membres de la diaspora soutenant les micro-investissements et fonds d\'urgence.',
                'color' => '#047857',
                'icon' => 'public',
                'periodicite' => 'Mensuelle',
            ],
        ];

        foreach ($groups as $group) {
            Group::query()->updateOrCreate(
                ['name' => $group['name']],
                $group,
            );
        }
    }
}
