<?php

namespace App\Quest;

use App\Models\Admin;
use App\Models\User;
use App\Services\AdminAccountService;
use App\Services\ContributionService;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class UserQuest
{
    private function contributions(): ContributionService
    {
        return app(ContributionService::class);
    }

    #[QuestSpaw(ref: 'users.list', method: SpawMethod::GET)]
    public function getUsers(): array
    {
        QuestAuth::requireAccount();

        return User::query()
            ->with('groups')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => ApiPresenter::user($user))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'users.get', method: SpawMethod::GET)]
    public function getUserById(string $id): ?array
    {
        $actor = QuestAuth::requireAccount();
        if ($actor instanceof User && $actor->id !== (int) $id) {
            throw new RuntimeException('Accès refusé.');
        }

        $user = User::query()->with('groups')->find($id);

        return $user ? ApiPresenter::user($user) : null;
    }

    #[QuestSpaw(ref: 'users.add')]
    public function addMember(
        string $name,
        string $phone,
        string $pin,
        ?string $email = null,
        float|int|null $solde_credit = 0,
        ?array $group_ids = null,
        ?string $avatar = null,
    ): array {
        QuestAuth::requireStaff();

        $user = $this->contributions()->addMember([
            'name' => $name,
            'phone' => $phone,
            'pin' => $pin,
            'email' => $email,
            'solde_credit' => $solde_credit,
            'group_ids' => $group_ids ?? [],
            'avatar' => $avatar,
        ]);

        return ApiPresenter::user($user);
    }

    #[QuestSpaw(ref: 'users.update.pin')]
    public function updateMemberPin(string $userId, string $newPin): bool
    {
        QuestAuth::requireStaff();
        $user = User::query()->find($userId);
        if (! $user) {
            return false;
        }

        $user->pin = trim($newPin);
        $user->save();

        return true;
    }

    #[QuestSpaw(ref: 'users.update')]
    public function updateMember(string $userId, array $data): ?array
    {
        QuestAuth::requireStaff();
        $user = User::query()->find($userId);
        if (! $user) {
            return null;
        }

        unset($data['password'], $data['pin'], $data['api_token']);
        $groupIds = $data['group_ids'] ?? null;
        unset($data['group_ids'], $data['id'], $data['member_number'], $data['created_at']);

        $user->fill($data);
        $user->save();

        if (is_array($groupIds)) {
            $user->groups()->sync(array_map('intval', $groupIds));
        }

        return ApiPresenter::user($user->fresh('groups'));
    }

    #[QuestSpaw(ref: 'users.profile.update')]
    public function updateProfile(
        ?string $name = null,
        ?string $email = null,
        ?string $username = null,
        ?string $password = null,
    ): array {
        $admin = QuestAuth::requireStaff();

        $changes = array_filter(
            ['name' => $name, 'email' => $email, 'username' => $username, 'password' => $password],
            fn (mixed $value) => $value !== null,
        );

        $updated = app(AdminAccountService::class)->update($admin, $admin, $changes);

        return ApiPresenter::admin($updated);
    }

    #[QuestSpaw(ref: 'users.avatar.update', filePocket: 'photo')]
    public function updateAvatar(UploadedFile $photo): array
    {
        $account = QuestAuth::requireAccount();

        if ($account instanceof Admin) {
            throw new RuntimeException("L'espace administrateur n'utilise pas de photo de profil.");
        }
        $user = $account;

        if (! $photo->isValid()) {
            throw new RuntimeException('Le fichier photo est invalide.');
        }

        $mime = (string) $photo->getMimeType();
        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            throw new RuntimeException('Formats acceptés : JPG, PNG, WEBP ou GIF.');
        }

        if ($photo->getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException('La photo ne doit pas dépasser 5 Mo.');
        }

        $extension = match ($mime) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };

        $previous = $user->avatar;
        $filename = 'user-'.$user->id.'-'.now()->timestamp.'.'.$extension;
        $stored = $photo->storeAs('avatars', $filename, 'public');

        $user->avatar = '/storage/'.$stored;
        $user->save();

        if (is_string($previous) && str_starts_with($previous, '/storage/avatars/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $previous));
        }

        return ApiPresenter::user($user->fresh('groups'));
    }
}
