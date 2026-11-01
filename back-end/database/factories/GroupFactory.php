<?php

namespace Database\Factories;

use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Group>
 */
class GroupFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(12),
            'color' => fake()->hexColor(),
            'icon' => fake()->randomElement(['groups', 'diversity_3', 'shield_person', 'public', 'account_balance_wallet']),
        ];
    }
}
