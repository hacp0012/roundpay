<?php

namespace App\Quest;

use App\Enums\ContributorStatus;
use App\Enums\FicheStatus;
use App\Enums\PaymentStatus;
use App\Models\Depense;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use App\Models\Payment;
use App\Models\User;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;

class TreasuryQuest
{
    #[QuestSpaw(ref: 'treasury.overview', method: SpawMethod::GET)]
    public function getTreasuryOverview(): array
    {
        QuestAuth::requireStaff();

        $totalCollecte = (float) Payment::query()->where('statut', PaymentStatus::Valide)->sum('montant');
        $totalDepense = (float) Depense::query()->sum('montant');
        $credits = (float) User::query()->sum('solde_credit');

        $obligatoires = Fiche::query()->where('type', 'obligatoire')->where('statut', FicheStatus::Ouverte)->count();
        $libres = Fiche::query()->where('type', 'libre')->where('statut', FicheStatus::Ouverte)->count();

        $aJour = MemberFicheRecord::query()
            ->whereIn('statut', [ContributorStatus::Paye, ContributorStatus::PayeAvance])
            ->pluck('user_id')
            ->unique()
            ->count();
        $totalCotisants = MemberFicheRecord::query()->pluck('user_id')->unique()->count();
        $donateurs = Payment::query()
            ->where('statut', PaymentStatus::Valide)
            ->where(fn ($query) => $query->where('is_anonymous', true)->orWhereNull('user_id'))
            ->count();

        return [
            'solde_total_caisse' => $totalCollecte - $totalDepense,
            'total_collecte' => $totalCollecte,
            'total_depense' => $totalDepense,
            'total_solde_credits' => $credits,
            'fiches_obligatoires_count' => $obligatoires,
            'collectes_libres_count' => $libres,
            'cotisants_a_jour_count' => $aJour,
            'cotisants_total_count' => $totalCotisants,
            'donateurs_actifs_count' => $donateurs,
        ];
    }
}
