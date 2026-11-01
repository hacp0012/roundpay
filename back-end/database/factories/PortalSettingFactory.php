<?php

namespace Database\Factories;

use App\Models\PortalSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortalSetting>
 */
class PortalSettingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom_collectif' => 'Collectif Solidaire roundPay',
            'slogan' => 'L\'entraide transparente et l\'impact communautaire au cœur de nos initiatives.',
            'about_us' => fake()->paragraphs(2, true),
            'contact_email' => 'contact@roundpay-collectif.org',
            'contact_phone' => '+33 6 45 12 98 33',
            'contact_whatsapp' => '+33 6 45 12 98 33',
            'contact_adresse' => fake()->address(),
            'contact_horaires' => 'Permanence chaque samedi de 14h à 18h',
            'message_bienvenue' => fake()->paragraph(),
        ];
    }
}
