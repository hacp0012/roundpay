<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Sort les administrateurs de la table users (membres) pour les placer dans la table admins.
     * Le premier administrateur existant devient le principal ; sinon le principal est créé
     * à partir de ADMIN_PRINCIPAL_USERNAME / ADMIN_PRINCIPAL_PASSWORD.
     */
    public function up(): void
    {
        $idMap = [];

        $legacyAdmins = DB::table('users')
            ->whereIn('role', ['admin', 'manager'])
            ->orderBy('id')
            ->get();

        foreach ($legacyAdmins as $index => $legacy) {
            $idMap[$legacy->id] = DB::table('admins')->insertGetId([
                'name' => $legacy->name,
                'username' => strtolower(trim((string) ($legacy->username ?: 'admin-'.$legacy->id))),
                'email' => $legacy->email,
                'password' => $legacy->password ?: Hash::make(Str::random(40)),
                'role' => $index === 0 ? 'principal' : 'admin',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::table('depenses', function (Blueprint $table) {
            $table->foreignId('created_by_admin_id')->nullable()->after('created_by_user_id')->constrained('admins')->nullOnDelete();
        });

        foreach ($idMap as $legacyUserId => $adminId) {
            DB::table('depenses')
                ->where('created_by_user_id', $legacyUserId)
                ->update(['created_by_admin_id' => $adminId]);
        }

        Schema::table('depenses', function (Blueprint $table) {
            $table->dropForeign(['created_by_user_id']);
            $table->dropColumn('created_by_user_id');
        });

        if ($idMap !== []) {
            DB::table('group_user')->whereIn('user_id', array_keys($idMap))->delete();
            DB::table('users')->whereIn('id', array_keys($idMap))->delete();
        }

        if (! DB::table('admins')->where('role', 'principal')->exists()) {
            DB::table('admins')->insert([
                'name' => 'Administrateur principal',
                'username' => strtolower(trim((string) env('ADMIN_PRINCIPAL_USERNAME', 'admin'))),
                'email' => null,
                'password' => Hash::make((string) env('ADMIN_PRINCIPAL_PASSWORD', 'admin123')),
                'role' => 'principal',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        throw new RuntimeException('Cette migration ne peut pas être annulée automatiquement : les administrateurs ne sont plus dans users.');
    }
};
