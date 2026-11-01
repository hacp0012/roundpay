<?php

namespace App\Models;

use App\Enums\FicheStatus;
use App\Enums\FicheType;
use Database\Factories\FicheFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fiche extends Model
{
    /** @use HasFactory<FicheFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'titre',
        'motif',
        'description',
        'type',
        'group_id',
        'montant_impose',
        'cagnotte_cible',
        'date_debut',
        'date_fin',
        'statut',
        'is_public',
        'beneficiaire',
        'categorie',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => FicheType::class,
            'statut' => FicheStatus::class,
            'is_public' => 'boolean',
            'montant_impose' => 'decimal:2',
            'cagnotte_cible' => 'decimal:2',
            'date_debut' => 'date',
            'date_fin' => 'date',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(MemberFicheRecord::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
