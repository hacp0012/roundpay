<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $groupeA = Group::query()->where('name', 'Groupe A - Solidarité')->firstOrFail();
        $jeunesse = Group::query()->where('name', 'Groupe Jeunesse')->firstOrFail();
        $bureau = Group::query()->where('name', 'Bureau Exécutif')->firstOrFail();
        $diaspo = Group::query()->where('name', 'Groupe B - Entraide Diaspo')->firstOrFail();

        $members = [
            [
                'member_number' => '#M-8901',
                'name' => 'Sophie M.',
                'phone' => '+33645129833',
                'email' => 'sophie.tresor@roundpay.org',
                'pin' => '8901',
                'role' => UserRole::Member,
                'solde_credit' => 25,
                'groups' => [$groupeA, $bureau],
            ],
            [
                'member_number' => '#M-8910',
                'name' => 'Amadou Diallo',
                'phone' => '+243825411092',
                'email' => 'amadou.diallo@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 50,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8911',
                'name' => 'Céline Martin',
                'phone' => '+221773422819',
                'email' => 'celine.martin@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8914',
                'name' => 'Marc Leroy',
                'phone' => '+225078819440',
                'email' => 'marc.leroy@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8919',
                'name' => 'Fatima Benali',
                'phone' => '+212661234567',
                'email' => 'fatima.benali@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 75,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8922',
                'name' => 'Awa Traoré',
                'phone' => '+22376543210',
                'email' => 'awa.traore@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 25,
                'groups' => [$groupeA, $diaspo],
            ],
            [
                'member_number' => '#M-8925',
                'name' => 'Thomas Bernard',
                'phone' => '+33688442100',
                'email' => 'thomas.b@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 10,
                'groups' => [$jeunesse],
            ],
            [
                'member_number' => '#M-8930',
                'name' => 'Malik Kane',
                'phone' => '+221709912345',
                'email' => 'malik.k@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8931',
                'name' => 'Sarah Dumont',
                'phone' => '+33760418920',
                'email' => 'sarah.d@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8932',
                'name' => 'David Ouedraogo',
                'phone' => '+22671223344',
                'email' => 'david.o@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
            [
                'member_number' => '#M-8933',
                'name' => 'Amina Camara',
                'phone' => '+22462110099',
                'email' => 'amina.c@example.com',
                'pin' => '1234',
                'role' => UserRole::Member,
                'solde_credit' => 0,
                'groups' => [$groupeA],
            ],
        ];

        foreach ($members as $member) {
            $groups = $member['groups'];
            unset($member['groups']);

            $user = User::query()->updateOrCreate(
                ['member_number' => $member['member_number']],
                [
                    ...$member,
                    'is_member' => true,
                    'email_verified_at' => now(),
                ],
            );

            $user->groups()->sync(collect($groups)->pluck('id'));
        }
    }
}
