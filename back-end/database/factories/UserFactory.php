<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $memberNumber = '#M-'.fake()->unique()->numerify('####');

        return [
            'member_number' => $memberNumber,
            'name' => fake()->name(),
            'phone' => fake()->unique()->e164PhoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'username' => null,
            'password' => null,
            'pin' => '1234',
            'avatar' => null,
            'is_member' => true,
            'role' => UserRole::Member,
            'solde_credit' => fake()->randomElement([0, 0, 0, 10, 25, 50, 75]),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
