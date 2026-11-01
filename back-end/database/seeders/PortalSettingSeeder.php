<?php

namespace Database\Seeders;

use App\Models\PortalSetting;
use Illuminate\Database\Seeder;

class PortalSettingSeeder extends Seeder
{
    public function run(): void
    {
        PortalSetting::query()->updateOrCreate(
            ['contact_email' => 'contact@roundpay-collectif.org'],
            [
                'nom_collectif' => 'Collectif Solidaire roundPay',
                'slogan' => 'L\'entraide transparente et l\'impact communautaire au cœur de nos initiatives.',
                'about_us' => 'Fondé en 2022 par des membres engagés, roundPay est une initiative communautaire indépendante dédiée à la solidarité mutuelle, la gestion de tontines transparentes et le financement participatif de projets de proximité. Chaque euro collecté fait l\'objet d\'une traçabilité publique et d\'un contrôle collégial rigoureux.',
                'contact_phone' => '+33 6 45 12 98 33',
                'contact_whatsapp' => '+33 6 45 12 98 33',
                'contact_adresse' => '14 Rue de la Fraternité, 75020 Paris (Permanence salle polyvalente)',
                'contact_horaires' => 'Permanence d\'accueil chaque samedi de 14h à 18h • Support WhatsApp & Mobile Money 7j/7',
                'message_bienvenue' => 'Bienvenue sur notre portail public. Découvrez ci-dessous nos projets et collectes ouvertes. Vous pouvez soutenir nos actions librement et sans inscription préalable.',
                'devise' => 'CDF',
            ],
        );
    }
}
