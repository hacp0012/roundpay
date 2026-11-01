<?php

namespace App\Services;

use App\Enums\AdminRole;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminAccountService
{
    private const USERNAME_PATTERN = '/^[a-z0-9._-]{3,32}$/';

    private const MIN_PASSWORD_LENGTH = 8;

    /**
     * @param  array{name: string, username: string, password: string, email?: ?string, role?: ?string}  $data
     */
    public function create(array $data): Admin
    {
        return DB::transaction(function () use ($data) {
            $name = $this->cleanName($data['name'] ?? '');
            $username = $this->cleanUsername($data['username'] ?? '');
            $email = $this->cleanEmail($data['email'] ?? null);
            $password = $this->cleanPassword($data['password'] ?? '');
            $role = $this->parseRole($data['role'] ?? AdminRole::Admin->value);

            $this->assertUnique($username, $email);

            return Admin::query()->create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'password' => $password,
                'role' => $role,
                'is_active' => true,
            ]);
        });
    }

    /**
     * @param  array{name?: string, username?: string, email?: ?string, role?: string, password?: ?string}  $data
     */
    public function update(Admin $actor, Admin $target, array $data): Admin
    {
        return DB::transaction(function () use ($actor, $target, $data) {
            if (array_key_exists('name', $data)) {
                $target->name = $this->cleanName((string) $data['name']);
            }

            if (array_key_exists('username', $data)) {
                $username = $this->cleanUsername((string) $data['username']);
                $this->assertUnique($username, null, $target);
                $target->username = $username;
            }

            if (array_key_exists('email', $data)) {
                $email = $this->cleanEmail($data['email']);
                $this->assertUnique($target->username, $email, $target);
                $target->email = $email;
            }

            if (array_key_exists('role', $data)) {
                $role = $this->parseRole((string) $data['role']);
                if ($role !== $target->role) {
                    $this->guardPrincipalDemotion($actor, $target);
                    $target->role = $role;
                }
            }

            $passwordChanged = false;
            if (! empty($data['password'])) {
                $target->password = $this->cleanPassword((string) $data['password']);
                $passwordChanged = true;
            }

            $target->save();

            if ($passwordChanged && ! $actor->is($target)) {
                $target->forceFill(['api_token' => null])->save();
            }

            return $target->refresh();
        });
    }

    public function setActive(Admin $actor, Admin $target, bool $isActive): Admin
    {
        return DB::transaction(function () use ($actor, $target, $isActive) {
            if ($target->is_active === $isActive) {
                return $target;
            }

            if (! $isActive) {
                if ($actor->is($target)) {
                    throw new RuntimeException('Vous ne pouvez pas désactiver votre propre compte.');
                }
                if ($target->isPrincipal()) {
                    $this->ensureAnotherActivePrincipal($target);
                }
            }

            $target->is_active = $isActive;
            if (! $isActive) {
                $target->api_token = null;
            }
            $target->save();

            return $target->refresh();
        });
    }

    private function guardPrincipalDemotion(Admin $actor, Admin $target): void
    {
        if (! $target->isPrincipal()) {
            return;
        }

        if ($actor->is($target)) {
            throw new RuntimeException('Vous ne pouvez pas retirer votre propre rôle principal.');
        }

        $this->ensureAnotherActivePrincipal($target);
    }

    private function ensureAnotherActivePrincipal(Admin $target): void
    {
        $hasOtherPrincipal = Admin::query()
            ->where('role', AdminRole::Principal)
            ->where('is_active', true)
            ->whereKeyNot($target->getKey())
            ->exists();

        if (! $hasOtherPrincipal) {
            throw new RuntimeException('Il doit toujours rester au moins un administrateur principal actif.');
        }
    }

    private function assertUnique(?string $username, ?string $email, ?Admin $ignore = null): void
    {
        $query = Admin::query();
        if ($ignore) {
            $query->whereKeyNot($ignore->getKey());
        }

        if ($username !== null && (clone $query)->where('username', $username)->exists()) {
            throw new RuntimeException('Cet identifiant est déjà utilisé par un autre administrateur.');
        }

        if ($email !== null && (clone $query)->where('email', $email)->exists()) {
            throw new RuntimeException('Cette adresse e-mail est déjà utilisée par un autre administrateur.');
        }
    }

    private function cleanName(string $name): string
    {
        $clean = trim($name);
        if ($clean === '') {
            throw new RuntimeException('Le nom est obligatoire.');
        }

        return $clean;
    }

    private function cleanUsername(string $username): string
    {
        $clean = strtolower(trim($username));
        if (! preg_match(self::USERNAME_PATTERN, $clean)) {
            throw new RuntimeException('L’identifiant doit contenir 3 à 32 caractères : lettres minuscules, chiffres, point, tiret ou underscore.');
        }

        return $clean;
    }

    private function cleanEmail(?string $email): ?string
    {
        $clean = strtolower(trim((string) $email));
        if ($clean === '') {
            return null;
        }
        if (! filter_var($clean, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Adresse e-mail invalide.');
        }

        return $clean;
    }

    private function cleanPassword(string $password): string
    {
        $clean = trim($password);
        if (mb_strlen($clean) < self::MIN_PASSWORD_LENGTH) {
            throw new RuntimeException('Le mot de passe doit contenir au moins '.self::MIN_PASSWORD_LENGTH.' caractères.');
        }

        return $clean;
    }

    private function parseRole(string $role): AdminRole
    {
        $parsed = AdminRole::tryFrom($role);
        if (! $parsed) {
            throw new RuntimeException('Rôle administrateur inconnu.');
        }

        return $parsed;
    }
}
