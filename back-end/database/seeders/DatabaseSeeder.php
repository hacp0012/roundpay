<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PortalSettingSeeder::class,
            GroupSeeder::class,
            UserSeeder::class,
            FicheSeeder::class,
            MemberFicheRecordSeeder::class,
            PaymentSeeder::class,
            DepenseSeeder::class,
        ]);
    }
}
