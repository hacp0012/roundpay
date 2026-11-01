<?php

namespace App\Models;

use App\Enums\MobileMoneyProvider;
use App\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'fiche_id',
        'user_id',
        'nom_donateur_libre',
        'is_anonymous',
        'montant',
        'paid_at',
        'mobile_provider',
        'phone_number',
        'payment_gateway',
        'currency',
        'gateway_order_number',
        'provider_reference',
        'reference',
        'statut',
        'regle_fiche',
        'credite_solde',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'montant' => 'decimal:2',
            'paid_at' => 'datetime',
            'mobile_provider' => MobileMoneyProvider::class,
            'statut' => PaymentStatus::class,
            'regle_fiche' => 'decimal:2',
            'credite_solde' => 'decimal:2',
        ];
    }

    public function fiche(): BelongsTo
    {
        return $this->belongsTo(Fiche::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
