<?php

namespace App\Quest;

use App\Enums\FicheStatus;
use App\Models\Fiche;
use App\Services\ContributionService;
use App\Services\ReminderService;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;

class FicheQuest
{
    private function contributions(): ContributionService
    {
        return app(ContributionService::class);
    }

    #[QuestSpaw(ref: 'fiches.list', method: SpawMethod::GET)]
    public function getFiches(): array
    {
        QuestAuth::requireAccount();

        return Fiche::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (Fiche $fiche) => ApiPresenter::fiche($fiche))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'fiches.get', method: SpawMethod::GET)]
    public function getFicheById(string $id): ?array
    {
        $fiche = Fiche::query()->find($id);
        if (! $fiche) {
            return null;
        }

        if ($fiche->statut !== FicheStatus::Ouverte) {
            return null;
        }

        if (! $fiche->is_public && $fiche->type->value !== 'libre') {
            QuestAuth::requireAccount();
        }

        return ApiPresenter::fiche($fiche);
    }

    #[QuestSpaw(ref: 'fiches.records', method: SpawMethod::GET)]
    public function getMemberRecordsForFiche(string $fiche_id): array
    {
        QuestAuth::requireAccount();
        $fiche = Fiche::query()->find($fiche_id);
        if (! $fiche) {
            return [];
        }

        $this->contributions()->ensureRecordsForFiche($fiche);

        return $fiche->records()
            ->get()
            ->map(fn ($record) => ApiPresenter::record($record))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'fiches.create')]
    public function createFiche(
        string $titre,
        string $motif,
        string $type,
        ?string $description = null,
        ?string $group_id = null,
        float|int|null $montant_impose = null,
        float|int|null $cagnotte_cible = null,
        ?string $date_debut = null,
        ?string $date_fin = null,
        ?bool $is_public = null,
        ?string $beneficiaire = null,
        ?string $categorie = null,
    ): array {
        QuestAuth::requireStaff();

        $fiche = $this->contributions()->createFiche([
            'titre' => $titre,
            'motif' => $motif,
            'description' => $description,
            'type' => $type,
            'group_id' => $group_id,
            'montant_impose' => $montant_impose,
            'cagnotte_cible' => $cagnotte_cible,
            'date_debut' => $date_debut,
            'date_fin' => $date_fin,
            'is_public' => $is_public,
            'beneficiaire' => $beneficiaire,
            'categorie' => $categorie,
        ]);

        return ApiPresenter::fiche($fiche);
    }

    #[QuestSpaw(ref: 'fiches.toggle.public')]
    public function toggleFichePublicStatus(string $ficheId, bool $isPublic): ?array
    {
        QuestAuth::requireStaff();
        $fiche = Fiche::query()->find($ficheId);
        if (! $fiche) {
            return null;
        }

        $fiche->is_public = $isPublic;
        $fiche->save();

        return ApiPresenter::fiche($fiche);
    }

    #[QuestSpaw(ref: 'fiches.update')]
    public function updateFiche(string $ficheId, array $updates): ?array
    {
        QuestAuth::requireStaff();
        $fiche = Fiche::query()->find($ficheId);
        if (! $fiche) {
            return null;
        }

        $fiche->fill($updates);
        $fiche->save();

        return ApiPresenter::fiche($fiche);
    }

    #[QuestSpaw(ref: 'fiches.remind')]
    public function remindLateMembers(string $ficheId): array
    {
        QuestAuth::requireStaff();
        $fiche = Fiche::query()->find($ficheId);
        if (! $fiche) {
            throw new \RuntimeException('Fiche introuvable.');
        }

        return app(ReminderService::class)->remindLateMembers($fiche);
    }
}
