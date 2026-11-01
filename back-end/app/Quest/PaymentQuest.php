<?php

namespace App\Quest;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\ContributionService;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;

class PaymentQuest
{
    private function contributions(): ContributionService
    {
        return app(ContributionService::class);
    }

    #[QuestSpaw(ref: 'payments.list', method: SpawMethod::GET)]
    public function getPayments(): array
    {
        return Payment::query()
            ->with('fiche')
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn (Payment $payment) => ApiPresenter::payment($payment))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'payments.forFiche', method: SpawMethod::GET)]
    public function getPaymentsForFiche(string $fiche_id): array
    {
        return Payment::query()
            ->with('fiche')
            ->where('fiche_id', $fiche_id)
            ->where('statut', PaymentStatus::Valide)
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn (Payment $payment) => ApiPresenter::payment($payment))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'payments.record')]
    public function recordPayment(
        string $fiche_id,
        float|int $montant,
        string $mobile_provider,
        ?string $user_id = null,
        ?string $nom_donateur_libre = null,
        ?bool $is_anonymous = false,
        ?string $phone_number = null,
        ?string $reference = null,
        ?string $note = null,
    ): array {
        return $this->contributions()->recordPayment([
            'fiche_id' => $fiche_id,
            'user_id' => $user_id,
            'nom_donateur_libre' => $nom_donateur_libre,
            'is_anonymous' => $is_anonymous,
            'montant' => $montant,
            'mobile_provider' => $mobile_provider,
            'phone_number' => $phone_number,
            'reference' => $reference,
            'note' => $note,
        ]);
    }

    #[QuestSpaw(ref: 'credit.use')]
    public function useCreditWallet(string $user_id, string $fiche_id, float|int $amountToUse): bool
    {
        QuestAuth::requireAccount();

        return $this->contributions()->useCreditWallet((int) $user_id, (int) $fiche_id, (float) $amountToUse);
    }
}
