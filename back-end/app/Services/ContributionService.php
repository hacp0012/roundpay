<?php

namespace App\Services;

use App\Enums\ContributorStatus;
use App\Enums\FicheStatus;
use App\Enums\FicheType;
use App\Enums\MobileMoneyProvider;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Fiche;
use App\Models\Group;
use App\Models\MemberFicheRecord;
use App\Models\Payment;
use App\Models\PortalSetting;
use App\Models\User;
use App\Support\ApiPresenter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ContributionService
{
    public function ensureRecordsForFiche(Fiche $fiche): void
    {
        if ($fiche->type !== FicheType::Obligatoire || ! $fiche->group_id) {
            return;
        }

        if ($fiche->records()->exists()) {
            return;
        }

        $imposed = (float) ($fiche->montant_impose ?? 10);
        $users = User::query()
            ->whereHas('groups', fn ($query) => $query->where('groups.id', $fiche->group_id))
            ->get();

        foreach ($users as $user) {
            MemberFicheRecord::query()->create([
                'user_id' => $user->id,
                'fiche_id' => $fiche->id,
                'montant_impose' => $imposed,
                'montant_paye' => 0,
                'reste' => $imposed,
                'statut' => ContributorStatus::Retard,
            ]);
        }
    }

    public function createFiche(array $data): Fiche
    {
        return DB::transaction(function () use ($data) {
            $type = FicheType::from($data['type']);
            $year = now()->year;
            $seq = Fiche::query()->count() + 8;
            $code = sprintf('FC-%d-%02d', $year, $seq);

            $fiche = Fiche::query()->create([
                'code' => $code,
                'titre' => $data['titre'],
                'motif' => $data['motif'],
                'description' => $data['description'] ?? $data['motif'],
                'type' => $type,
                'group_id' => $type === FicheType::Libre ? null : ($data['group_id'] ?: null),
                'montant_impose' => $type === FicheType::Libre ? null : $data['montant_impose'],
                'cagnotte_cible' => $data['cagnotte_cible'] ?? (($data['montant_impose'] ?? 0) * 20 ?: 500),
                'date_debut' => $data['date_debut'] ?? now()->toDateString(),
                'date_fin' => $data['date_fin'] ?? null,
                'statut' => FicheStatus::Ouverte,
                'is_public' => $data['is_public'] ?? ($type === FicheType::Libre),
                'beneficiaire' => $data['beneficiaire'] ?? null,
                'categorie' => $data['categorie'] ?? null,
            ]);

            if ($fiche->type === FicheType::Obligatoire && $fiche->group_id) {
                $imposed = (float) ($fiche->montant_impose ?? 10);
                $users = User::query()
                    ->whereHas('groups', fn ($query) => $query->where('groups.id', $fiche->group_id))
                    ->get();

                foreach ($users as $user) {
                    $paid = 0.0;
                    $reste = $imposed;
                    $status = ContributorStatus::Retard;
                    $credit = (float) $user->solde_credit;

                    if ($credit >= $imposed) {
                        $user->solde_credit = $credit - $imposed;
                        $user->save();
                        $paid = $imposed;
                        $reste = 0;
                        $status = ContributorStatus::PayeAvance;
                    } elseif ($credit > 0) {
                        $paid = $credit;
                        $reste = $imposed - $credit;
                        $user->solde_credit = 0;
                        $user->save();
                        $status = ContributorStatus::Partiel;
                    }

                    MemberFicheRecord::query()->create([
                        'user_id' => $user->id,
                        'fiche_id' => $fiche->id,
                        'montant_impose' => $imposed,
                        'montant_paye' => $paid,
                        'reste' => $reste,
                        'statut' => $status,
                    ]);
                }
            }

            return $fiche;
        });
    }

    public function recordPayment(array $payload): array
    {
        $driver = (string) config('services.payment_gateway.driver', 'local');
        if ($driver === 'local') {
            return $this->recordPaymentLocally($payload);
        }

        if (! in_array($driver, ['maishapay', 'flexpay'], true)) {
            throw new RuntimeException('La passerelle de paiement sélectionnée est invalide.');
        }

        return $this->initiateGatewayPayment($payload, $driver);
    }

    private function recordPaymentLocally(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $fiche = Fiche::query()->find($payload['fiche_id']);
            if (! $fiche) {
                throw new RuntimeException('Fiche introuvable');
            }

            if ($fiche->statut !== FicheStatus::Ouverte) {
                throw ValidationException::withMessages([
                    'fiche_id' => 'Cette fiche est fermée et ne peut plus recevoir de paiement.',
                ]);
            }

            $montant = (float) $payload['montant'];
            $allocationResult = $this->allocatePayment(
                $fiche,
                isset($payload['user_id']) ? (int) $payload['user_id'] : null,
                $montant,
            );
            $allocation = $allocationResult['allocation'];
            $user = $allocationResult['user'];

            $prefixes = [
                'orange_money' => 'OM',
                'mpesa' => 'MP',
                'airtel_money' => 'AIR',
                'mtn_momo' => 'MTN',
                'wave' => 'WV',
                'cash_guichet' => 'GC',
            ];

            $provider = $payload['mobile_provider'];
            $reference = $payload['reference'] ?? sprintf(
                '%s-%d-%d',
                $prefixes[$provider] ?? 'PAY',
                random_int(10000, 99999),
                (int) $montant,
            );

            $payment = Payment::query()->create([
                'fiche_id' => $fiche->id,
                'user_id' => $payload['user_id'] ?: null,
                'nom_donateur_libre' => $payload['nom_donateur_libre'] ?? null,
                'is_anonymous' => (bool) ($payload['is_anonymous'] ?? false),
                'montant' => $montant,
                'paid_at' => now(),
                'mobile_provider' => MobileMoneyProvider::from($provider),
                'phone_number' => $payload['phone_number'] ?? null,
                'payment_gateway' => 'local',
                'currency' => (string) (PortalSetting::query()->value('devise') ?: 'CDF'),
                'reference' => $reference,
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => $allocation['regle_fiche'],
                'credite_solde' => $allocation['credite_solde'],
                'note' => $payload['note'] ?? null,
            ]);

            $payment->load('fiche');

            return [
                'payment' => ApiPresenter::payment($payment),
                'userUpdated' => $user ? ApiPresenter::user($user->fresh('groups')) : null,
                'allocation' => $allocation,
                'pending' => false,
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{payment: array<string, mixed>, userUpdated: ?array, allocation: ?array, pending: bool}
     */
    private function initiateGatewayPayment(array $payload, string $driver): array
    {
        $fiche = Fiche::query()->find($payload['fiche_id']);
        if (! $fiche) {
            throw new RuntimeException('Fiche introuvable.');
        }
        if ($fiche->statut !== FicheStatus::Ouverte) {
            throw ValidationException::withMessages([
                'fiche_id' => 'Cette fiche est fermée et ne peut plus recevoir de paiement.',
            ]);
        }

        $montant = (float) ($payload['montant'] ?? 0);
        if ($montant <= 0) {
            throw ValidationException::withMessages(['montant' => 'Le montant doit être supérieur à zéro.']);
        }

        $userId = isset($payload['user_id']) ? (int) $payload['user_id'] : null;
        $user = $userId ? User::query()->find($userId) : null;
        $phoneNumber = trim((string) ($payload['phone_number'] ?? $user?->phone ?? ''));
        if ($phoneNumber === '') {
            throw ValidationException::withMessages([
                'phone_number' => 'Un numéro Mobile Money est requis pour cette passerelle.',
            ]);
        }

        $reference = (string) ($payload['reference'] ?? 'RP-'.Str::upper(Str::random(24)));
        $currency = (string) (PortalSetting::query()->value('devise') ?: 'CDF');
        $payment = Payment::query()->create([
            'fiche_id' => $fiche->id,
            'user_id' => $user?->id,
            'nom_donateur_libre' => $payload['nom_donateur_libre'] ?? null,
            'is_anonymous' => (bool) ($payload['is_anonymous'] ?? false),
            'montant' => $montant,
            'paid_at' => now(),
            'mobile_provider' => MobileMoneyProvider::from((string) $payload['mobile_provider']),
            'phone_number' => $phoneNumber,
            'payment_gateway' => $driver,
            'currency' => $currency,
            'reference' => $reference,
            'statut' => PaymentStatus::EnAttente,
            'regle_fiche' => null,
            'credite_solde' => 0,
            'note' => $payload['note'] ?? null,
        ]);

        try {
            $initiation = app(PaymentGatewayService::class)->initiate(
                $payment,
                $phoneNumber,
                $user?->name ?? (string) ($payload['nom_donateur_libre'] ?? 'Donateur'),
                $user?->email,
                $currency,
            );
        } catch (RuntimeException $exception) {
            $payment->forceFill([
                'statut' => PaymentStatus::Echoue,
                'note' => 'Initiation refusée par la passerelle.',
            ])->save();

            throw $exception;
        }

        $payment->refresh();
        if (! $payment->gateway_order_number && $initiation['gateway_order_number']) {
            $payment->gateway_order_number = $initiation['gateway_order_number'];
        }
        if (! $payment->provider_reference && $initiation['provider_reference']) {
            $payment->provider_reference = $initiation['provider_reference'];
        }
        $payment->save();

        if ($initiation['state'] === 'success') {
            return $this->completeGatewayPayment(
                $driver,
                $reference,
                'success',
                $initiation['gateway_order_number'],
                $initiation['provider_reference'],
            ) ?? throw new RuntimeException('Le paiement initié est introuvable.');
        }

        $payment->load('fiche');

        return [
            'payment' => ApiPresenter::payment($payment),
            'userUpdated' => null,
            'allocation' => null,
            'pending' => $payment->statut === PaymentStatus::EnAttente,
        ];
    }

    /**
     * @return array{payment: array<string, mixed>, userUpdated: ?array, allocation: ?array, pending: bool}|null
     */
    public function completeGatewayPayment(
        string $gateway,
        string $reference,
        string $state,
        ?string $gatewayOrderNumber = null,
        ?string $providerReference = null,
    ): ?array {
        if (! in_array($state, ['pending', 'success', 'failed'], true)) {
            throw new RuntimeException('Statut de callback inconnu.');
        }

        return DB::transaction(function () use ($gateway, $reference, $state, $gatewayOrderNumber, $providerReference) {
            $payment = Payment::query()
                ->where('payment_gateway', $gateway)
                ->where('reference', $reference)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                return null;
            }

            if (
                $payment->gateway_order_number && $gatewayOrderNumber
                && ! hash_equals((string) $payment->gateway_order_number, $gatewayOrderNumber)
            ) {
                return null;
            }

            if ($payment->statut !== PaymentStatus::EnAttente) {
                $payment->load('fiche');

                return [
                    'payment' => ApiPresenter::payment($payment),
                    'userUpdated' => null,
                    'allocation' => null,
                    'pending' => false,
                ];
            }

            if ($gatewayOrderNumber) {
                $payment->gateway_order_number = $gatewayOrderNumber;
            }
            if ($providerReference) {
                $payment->provider_reference = $providerReference;
            }

            $user = null;
            $allocation = null;
            if ($state === 'success') {
                $result = $this->allocatePayment(
                    $payment->fiche,
                    $payment->user_id ? (int) $payment->user_id : null,
                    (float) $payment->montant,
                );
                $allocation = $result['allocation'];
                $user = $result['user'];
                $payment->statut = PaymentStatus::Valide;
                $payment->paid_at = now();
                $payment->regle_fiche = $allocation['regle_fiche'];
                $payment->credite_solde = $allocation['credite_solde'];
            } elseif ($state === 'failed') {
                $payment->statut = PaymentStatus::Echoue;
            }

            $payment->save();
            $payment->load('fiche');

            return [
                'payment' => ApiPresenter::payment($payment),
                'userUpdated' => $user ? ApiPresenter::user($user->fresh('groups')) : null,
                'allocation' => $allocation,
                'pending' => $payment->statut === PaymentStatus::EnAttente,
            ];
        });
    }

    /**
     * @return array{allocation: array{regle_fiche: float, credite_solde: float}, user: ?User}
     */
    private function allocatePayment(Fiche $fiche, ?int $userId, float $montant): array
    {
        $allocation = ['regle_fiche' => $montant, 'credite_solde' => 0.0];
        $user = $userId ? User::query()->find($userId) : null;

        if ($fiche->type !== FicheType::Obligatoire || ! $userId) {
            return ['allocation' => $allocation, 'user' => $user];
        }

        $this->ensureRecordsForFiche($fiche);
        $imposed = (float) ($fiche->montant_impose ?? 25);
        $record = MemberFicheRecord::query()->firstOrCreate(
            ['user_id' => $userId, 'fiche_id' => $fiche->id],
            [
                'montant_impose' => $imposed,
                'montant_paye' => 0,
                'reste' => $imposed,
                'statut' => ContributorStatus::Retard,
            ],
        );

        $resteActuel = (float) $record->reste;
        $montantRegle = min($montant, $resteActuel);
        $surplus = max(0, $montant - $resteActuel);
        $reste = max(0, $resteActuel - $montantRegle);
        $record->montant_paye = (float) $record->montant_paye + $montantRegle;
        $record->reste = $reste;
        $record->statut = $reste <= 0.0
            ? ($surplus > 0 ? ContributorStatus::PayeAvance : ContributorStatus::Paye)
            : ContributorStatus::Partiel;
        $record->last_payment_date = now();
        $record->save();

        if ($surplus > 0 && $user) {
            $user->solde_credit = (float) $user->solde_credit + $surplus;
            $user->save();
        }

        return [
            'allocation' => ['regle_fiche' => $montantRegle, 'credite_solde' => $surplus],
            'user' => $user,
        ];
    }

    public function useCreditWallet(int $userId, int $ficheId, float $amountToUse): bool
    {
        return DB::transaction(function () use ($userId, $ficheId, $amountToUse) {
            $user = User::query()->find($userId);
            if (! $user || (float) $user->solde_credit < $amountToUse) {
                throw new RuntimeException('Solde insuffisant dans le portefeuille de crédit');
            }

            $record = MemberFicheRecord::query()
                ->where('user_id', $userId)
                ->where('fiche_id', $ficheId)
                ->first();

            if (! $record) {
                throw new RuntimeException('Enregistrement de fiche introuvable pour ce membre');
            }

            $deduit = min($amountToUse, (float) $record->reste, (float) $user->solde_credit);
            $user->solde_credit = (float) $user->solde_credit - $deduit;
            $user->save();

            $record->montant_paye = (float) $record->montant_paye + $deduit;
            $record->reste = (float) $record->reste - $deduit;
            $record->statut = (float) $record->reste === 0.0 ? ContributorStatus::Paye : ContributorStatus::Partiel;
            $record->last_payment_date = now();
            $record->save();

            Payment::query()->create([
                'fiche_id' => $ficheId,
                'user_id' => $userId,
                'is_anonymous' => false,
                'montant' => $deduit,
                'paid_at' => now(),
                'mobile_provider' => MobileMoneyProvider::CashGuichet,
                'reference' => 'CREDIT-'.random_int(1000, 9999).'-'.Str::upper(Str::random(4)),
                'statut' => PaymentStatus::Valide,
                'regle_fiche' => $deduit,
                'credite_solde' => 0,
                'note' => "Règlement imputé depuis le portefeuille d'avance",
            ]);

            return true;
        });
    }

    public function addMember(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $next = 8900 + User::query()->count() + 1;
            $groupIds = $data['group_ids'] ?? [];
            if ($groupIds === []) {
                $fallback = Group::query()->orderBy('id')->value('id');
                $groupIds = $fallback ? [$fallback] : [];
            }

            $user = User::query()->create([
                'member_number' => '#M-'.$next,
                'name' => trim($data['name']),
                'phone' => trim($data['phone']),
                'pin' => trim($data['pin'] ?? '') ?: '1234',
                'email' => $data['email'] ?? null,
                'avatar' => $data['avatar'] ?? null,
                'is_member' => true,
                'role' => UserRole::Member,
                'solde_credit' => $data['solde_credit'] ?? 0,
            ]);

            $user->groups()->sync(array_map('intval', $groupIds));

            $openFiches = Fiche::query()
                ->where('type', FicheType::Obligatoire)
                ->where('statut', FicheStatus::Ouverte)
                ->whereIn('group_id', $groupIds)
                ->get();

            foreach ($openFiches as $fiche) {
                $montant = (float) ($fiche->montant_impose ?? 10);
                MemberFicheRecord::query()->firstOrCreate(
                    ['user_id' => $user->id, 'fiche_id' => $fiche->id],
                    [
                        'montant_impose' => $montant,
                        'montant_paye' => 0,
                        'reste' => $montant,
                        'statut' => ContributorStatus::Retard,
                    ],
                );
            }

            return $user->load('groups');
        });
    }
}
