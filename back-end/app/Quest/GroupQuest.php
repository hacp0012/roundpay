<?php

namespace App\Quest;

use App\Models\Group;
use App\Models\User;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use RuntimeException;

class GroupQuest
{
    #[QuestSpaw(ref: 'groups.list', method: SpawMethod::GET)]
    public function getGroups(): array
    {
        QuestAuth::requireAccount();

        return Group::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Group $group) => ApiPresenter::group($group))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'groups.create')]
    public function createGroup(
        string $name,
        ?string $description = null,
        ?string $color = null,
        ?string $icon = null,
        ?string $periodicite = null,
    ): array {
        QuestAuth::requireStaff();

        $group = Group::query()->create([
            'name' => trim($name),
            'description' => $description,
            'color' => $color ?: '#3f3bbd',
            'icon' => $icon ?: 'groups',
            'periodicite' => $periodicite,
        ]);

        return ApiPresenter::group($group);
    }

    #[QuestSpaw(ref: 'groups.update')]
    public function updateGroup(
        string $groupId,
        ?string $name = null,
        ?string $description = null,
        ?string $color = null,
        ?string $icon = null,
        ?string $periodicite = null,
    ): ?array {
        QuestAuth::requireStaff();
        $group = Group::query()->find($groupId);
        if (! $group) {
            return null;
        }

        $group->fill(array_filter([
            'name' => $name !== null ? trim($name) : null,
            'description' => $description,
            'color' => $color,
            'icon' => $icon,
            'periodicite' => $periodicite,
        ], fn ($value) => $value !== null));
        $group->save();

        return ApiPresenter::group($group);
    }

    #[QuestSpaw(ref: 'groups.delete')]
    public function deleteGroup(string $groupId): bool
    {
        QuestAuth::requireStaff();
        $group = Group::query()->find($groupId);
        if (! $group) {
            return false;
        }

        if ($group->fiches()->exists()) {
            throw new RuntimeException('Impossible de supprimer un groupe lié à des fiches de cotisation.');
        }

        $group->users()->detach();
        $group->delete();

        return true;
    }

    #[QuestSpaw(ref: 'groups.members.set')]
    public function setGroupMembers(string $groupId, array $user_ids): array
    {
        QuestAuth::requireStaff();
        $group = Group::query()->find($groupId);
        if (! $group) {
            throw new RuntimeException('Groupe introuvable.');
        }

        $ids = array_values(array_unique(array_map('intval', $user_ids)));
        $group->users()->sync($ids);

        return ApiPresenter::group($group->fresh());
    }

    #[QuestSpaw(ref: 'groups.members.add')]
    public function addMemberToGroup(string $groupId, string $userId): array
    {
        QuestAuth::requireStaff();
        $group = Group::query()->find($groupId);
        $user = User::query()->find($userId);
        if (! $group || ! $user) {
            throw new RuntimeException('Groupe ou membre introuvable.');
        }

        $group->users()->syncWithoutDetaching([(int) $userId]);

        return ApiPresenter::group($group->fresh());
    }

    #[QuestSpaw(ref: 'groups.members.remove')]
    public function removeMemberFromGroup(string $groupId, string $userId): array
    {
        QuestAuth::requireStaff();
        $group = Group::query()->find($groupId);
        if (! $group) {
            throw new RuntimeException('Groupe introuvable.');
        }

        $group->users()->detach((int) $userId);

        return ApiPresenter::group($group->fresh());
    }
}
