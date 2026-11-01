<?php

namespace App\Quest;

use App\Models\Admin;
use App\Services\AdminAccountService;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use RuntimeException;

class AdminQuest
{
    private function accounts(): AdminAccountService
    {
        return app(AdminAccountService::class);
    }

    #[QuestSpaw(ref: 'admins.list', method: SpawMethod::GET)]
    public function getAdmins(): array
    {
        QuestAuth::requirePrincipal();

        return Admin::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Admin $admin) => ApiPresenter::admin($admin))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'admins.create')]
    public function createAdmin(
        string $name,
        string $username,
        string $password,
        ?string $email = null,
        ?string $role = 'admin',
    ): array {
        QuestAuth::requirePrincipal();

        $admin = $this->accounts()->create([
            'name' => $name,
            'username' => $username,
            'password' => $password,
            'email' => $email,
            'role' => $role,
        ]);

        return ApiPresenter::admin($admin);
    }

    #[QuestSpaw(ref: 'admins.update')]
    public function updateAdmin(string $adminId, array $data): array
    {
        $actor = QuestAuth::requirePrincipal();
        $target = $this->findAdmin($adminId);

        $admin = $this->accounts()->update($actor, $target, $data);

        return ApiPresenter::admin($admin);
    }

    #[QuestSpaw(ref: 'admins.setActive')]
    public function setAdminActive(string $adminId, bool $isActive): array
    {
        $actor = QuestAuth::requirePrincipal();
        $target = $this->findAdmin($adminId);

        $admin = $this->accounts()->setActive($actor, $target, $isActive);

        return ApiPresenter::admin($admin);
    }

    private function findAdmin(string $adminId): Admin
    {
        $admin = Admin::query()->find($adminId);
        if (! $admin) {
            throw new RuntimeException('Administrateur introuvable.');
        }

        return $admin;
    }
}
