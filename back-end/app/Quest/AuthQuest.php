<?php

namespace App\Quest;

use App\Models\Admin;
use App\Models\User;
use App\Support\ApiPresenter;
use App\Support\Phone;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use Illuminate\Support\Facades\Hash;

class AuthQuest
{
    /**
     * @return array{user: array, token: string}|null
     */
    #[QuestSpaw(ref: 'auth.login.client')]
    public function loginClient(string $phone, string $pin): ?array
    {
        $users = User::query()->where('is_member', true)->with('groups')->get();

        $user = $users->first(function (User $candidate) use ($phone, $pin) {
            if (! Phone::matches($candidate->phone, $phone)) {
                return false;
            }

            return $candidate->pin && Hash::check(trim($pin), $candidate->pin);
        });

        if (! $user) {
            return null;
        }

        return [
            'user' => ApiPresenter::user($user),
            'token' => QuestAuth::issueToken($user),
        ];
    }

    /**
     * @return array{user: array, token: string}|null
     */
    #[QuestSpaw(ref: 'auth.login.admin')]
    public function loginAdmin(string $username, string $password): ?array
    {
        $identifier = strtolower(trim($username));
        if ($identifier === '' || trim($password) === '') {
            return null;
        }

        $admin = Admin::query()
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if (! $admin || ! $admin->is_active || ! Hash::check(trim($password), $admin->password)) {
            return null;
        }

        $admin->forceFill(['last_login_at' => now()])->save();

        return [
            'user' => ApiPresenter::admin($admin),
            'token' => QuestAuth::issueToken($admin),
        ];
    }

    /**
     * @return array{user: array}|null
     */
    #[QuestSpaw(ref: 'auth.me', method: SpawMethod::GET)]
    public function me(): ?array
    {
        $account = QuestAuth::account();

        if ($account instanceof Admin) {
            return ['user' => ApiPresenter::admin($account)];
        }

        if ($account instanceof User) {
            return ['user' => ApiPresenter::user($account->load('groups'))];
        }

        return null;
    }

    #[QuestSpaw(ref: 'auth.logout')]
    public function logout(): bool
    {
        $account = QuestAuth::account();
        if ($account) {
            QuestAuth::revoke($account);
        }

        return true;
    }
}
