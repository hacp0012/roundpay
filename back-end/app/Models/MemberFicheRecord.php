<?php

namespace App\Models;

use App\Enums\ContributorStatus;
use Database\Factories\MemberFicheRecordFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberFicheRecord extends Model
{
    /** @use HasFactory<MemberFicheRecordFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'fiche_id',
        'montant_impose',
        'montant_paye',
        'reste',
        'statut',
        'last_payment_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'montant_impose' => 'decimal:2',
            'montant_paye' => 'decimal:2',
            'reste' => 'decimal:2',
            'statut' => ContributorStatus::class,
            'last_payment_date' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fiche(): BelongsTo
    {
        return $this->belongsTo(Fiche::class);
    }
}
