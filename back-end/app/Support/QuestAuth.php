<?php

namespace App\Support;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class QuestAuth
{
    private const ACCOUNT_ATTRIBUTE = 'quest_account';

    /**
     * Compte connecté (membre ou administrateur) à partir du jeton Bearer.
     * Résolu une seule fois par requête, sans état partagé entre requêtes.
     */
    public static function account(): User|Admin|null
    {
        $request = request();

        if ($request->attributes->has(self::ACCOUNT_ATTRIBUTE)) {
            return $request->attributes->get(self::ACCOUNT_ATTRIBUTE);
        }

        $account = self::resolveAccount($request->bearerToken());
        $request->attributes->set(self::ACCOUNT_ATTRIBUTE, $account);

        return $account;
    }

    private static function resolveAccount(?string $plain): User|Admin|null
    {
        if (! $plain) {
            return null;
        }

        $hashed = hash('sha256', $plain);

        return Admin::query()->where('api_token', $hashed)->where('is_active', true)->first()
            ?? User::query()->where('api_token', $hashed)->first();
    }

    /**
     * Membre connecté uniquement : un administrateur n'est jamais traité comme membre.
     */
    public static function user(): ?User
    {
        $account = self::account();

        return $account instanceof User ? $account : null;
    }

    public static function requireUser(): User
    {
        $user = self::user();
        if (! $user) {
            throw new RuntimeException('Authentification requise.');
        }

        return $user;
    }

    /**
     * Membre ou administrateur connecté, pour les lectures partagées par les deux espaces.
     */
    public static function requireAccount(): User|Admin
    {
        $account = self::account();
        if (! $account) {
            throw new RuntimeException('Authentification requise.');
        }

        return $account;
    }

    public static function requireStaff(): Admin
    {
        $account = self::account();
        if (! $account) {
            throw new RuntimeException('Authentification requise.');
        }
        if (! $account instanceof Admin) {
            throw new RuntimeException('Accès réservé à la trésorerie.');
        }

        return $account;
    }

    public static function requirePrincipal(): Admin
    {
        $admin = self::requireStaff();
        if (! $admin->isPrincipal()) {
            throw new RuntimeException('Accès réservé à l’administrateur principal.');
        }

        return $admin;
    }

    public static function issueToken(User|Admin $account): string
    {
        $plain = Str::random(48);
        $account->forceFill(['api_token' => hash('sha256', $plain)])->save();

        return $plain;
    }

    public static function revoke(User|Admin $account): void
    {
        $account->forceFill(['api_token' => null])->save();
    }
}
