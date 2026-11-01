<?php

namespace App\Support;

use App\Models\Admin;
use App\Models\Depense;
use App\Models\Fiche;
use App\Models\Group;
use App\Models\MemberFicheRecord;
use App\Models\Payment;
use App\Models\PortalSetting;
use App\Models\User;
use Illuminate\Support\Collection;

class ApiPresenter
{
    public static function user(User $user, bool $withGroups = true): array
    {
        if ($withGroups && ! $user->relationLoaded('groups')) {
            $user->load('groups');
        }

        return [
            'id' => (string) $user->id,
            'member_number' => $user->member_number,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'username' => $user->username,
            'avatar' => self::avatarUrl($user->avatar),
            'is_member' => (bool) $user->is_member,
            'role' => $user->role->value,
            'solde_credit' => (float) $user->solde_credit,
            'group_ids' => $user->groups->pluck('id')->map(fn ($id) => (string) $id)->values()->all(),
            'created_at' => $user->created_at?->toDateString(),
        ];
    }

    public static function admin(Admin $admin): array
    {
        return [
            'id' => (string) $admin->id,
            'member_number' => '',
            'name' => $admin->name,
            'phone' => '',
            'email' => $admin->email,
            'username' => $admin->username,
            'avatar' => '',
            'is_member' => false,
            'role' => 'admin',
            'admin_role' => $admin->role->value,
            'is_principal' => $admin->isPrincipal(),
            'is_active' => (bool) $admin->is_active,
            'solde_credit' => 0.0,
            'group_ids' => [],
            'created_at' => $admin->created_at?->toDateString(),
            'last_login_at' => $admin->last_login_at?->toDateTimeString(),
        ];
    }

    public static function group(Group $group): array
    {
        return [
            'id' => (string) $group->id,
            'name' => $group->name,
            'description' => $group->description ?? '',
            'color' => $group->color,
            'icon' => $group->icon,
            'periodicite' => $group->periodicite,
            'member_count' => $group->users()->count(),
        ];
    }

    public static function fiche(Fiche $fiche): array
    {
        return [
            'id' => (string) $fiche->id,
            'code' => $fiche->code,
            'titre' => $fiche->titre,
            'motif' => $fiche->motif,
            'description' => $fiche->description,
            'type' => $fiche->type->value,
            'group_id' => $fiche->group_id ? (string) $fiche->group_id : null,
            'montant_impose' => $fiche->montant_impose !== null ? (float) $fiche->montant_impose : null,
            'cagnotte_cible' => $fiche->cagnotte_cible !== null ? (float) $fiche->cagnotte_cible : null,
            'date_debut' => $fiche->date_debut?->toDateString(),
            'date_fin' => $fiche->date_fin?->toDateString(),
            'statut' => $fiche->statut->value,
            'created_at' => $fiche->created_at?->toDateString(),
            'is_public' => (bool) $fiche->is_public,
            'beneficiaire' => $fiche->beneficiaire,
            'categorie' => $fiche->categorie,
        ];
    }

    public static function record(MemberFicheRecord $record): array
    {
        return [
            'user_id' => (string) $record->user_id,
            'fiche_id' => (string) $record->fiche_id,
            'montant_impose' => (float) $record->montant_impose,
            'montant_paye' => (float) $record->montant_paye,
            'reste' => (float) $record->reste,
            'statut' => $record->statut->value,
            'last_payment_date' => $record->last_payment_date?->format('Y-m-d H:i'),
        ];
    }

    public static function payment(Payment $payment): array
    {
        $allocation = null;
        if ($payment->regle_fiche !== null || (float) $payment->credite_solde > 0) {
            $allocation = [
                'regle_fiche' => (float) ($payment->regle_fiche ?? $payment->montant),
                'credite_solde' => (float) $payment->credite_solde,
            ];
        }

        return [
            'id' => (string) $payment->id,
            'fiche_id' => (string) $payment->fiche_id,
            'fiche_titre' => $payment->fiche?->titre,
            'user_id' => $payment->user_id ? (string) $payment->user_id : null,
            'nom_donateur_libre' => $payment->nom_donateur_libre,
            'is_anonymous' => (bool) $payment->is_anonymous,
            'montant' => (float) $payment->montant,
            'date' => $payment->paid_at?->timezone(config('app.timezone'))->format('Y-m-d H:i'),
            'mobile_provider' => $payment->mobile_provider->value,
            'phone_number' => $payment->phone_number,
            'payment_gateway' => $payment->payment_gateway,
            'currency' => $payment->currency,
            'gateway_order_number' => $payment->gateway_order_number,
            'provider_reference' => $payment->provider_reference,
            'reference' => $payment->reference,
            'statut' => $payment->statut->value,
            'allocation' => $allocation,
            'note' => $payment->note,
        ];
    }

    public static function depense(Depense $depense): array
    {
        return [
            'id' => (string) $depense->id,
            'titre' => $depense->titre,
            'montant' => (float) $depense->montant,
            'date' => $depense->spent_at?->toDateString(),
            'categorie' => $depense->categorie,
            'description' => $depense->description ?? '',
            'cree_par' => $depense->createdBy?->name ?? '',
            'preuve_ref' => $depense->preuve_ref,
            'preuve_disponible' => (bool) ($depense->preuve_path && $depense->preuve_ref),
        ];
    }

    public static function settings(PortalSetting $settings): array
    {
        return [
            'nom_collectif' => $settings->nom_collectif,
            'slogan' => $settings->slogan,
            'about_us' => $settings->about_us,
            'contact_email' => $settings->contact_email,
            'contact_phone' => $settings->contact_phone,
            'contact_whatsapp' => $settings->contact_whatsapp,
            'contact_adresse' => $settings->contact_adresse,
            'contact_horaires' => $settings->contact_horaires,
            'message_bienvenue' => $settings->message_bienvenue,
            'devise' => $settings->devise ?: 'CDF',
            'updated_at' => $settings->updated_at?->toIso8601String(),
        ];
    }

    public static function users(Collection $users): array
    {
        return $users->map(fn (User $user) => self::user($user))->values()->all();
    }

    public static function avatarUrl(?string $avatar): string
    {
        if (! $avatar) {
            return '';
        }

        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }

        if (str_starts_with($avatar, '/storage/')) {
            return rtrim((string) config('app.url'), '/').$avatar;
        }

        return $avatar;
    }
}
