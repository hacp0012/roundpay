<?php

namespace App\Quest;

use App\Models\Depense;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;

class DepenseQuest
{
    #[QuestSpaw(ref: 'depenses.list', method: SpawMethod::GET)]
    public function getDepenses(): array
    {
        QuestAuth::requireStaff();

        return Depense::query()
            ->with('createdBy')
            ->orderByDesc('spent_at')
            ->get()
            ->map(fn (Depense $depense) => ApiPresenter::depense($depense))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'depenses.add')]
    public function addDepense(
        string $titre,
        float|int $montant,
        string $categorie,
        string $description,
        ?string $cree_par = null,
    ): array {
        $staff = QuestAuth::requireStaff();

        $depense = Depense::query()->create([
            'titre' => $titre,
            'montant' => $montant,
            'spent_at' => now()->toDateString(),
            'categorie' => $categorie,
            'description' => $description,
            'created_by_admin_id' => $staff->id,
        ]);

        return ApiPresenter::depense($depense->load('createdBy'));
    }
}
