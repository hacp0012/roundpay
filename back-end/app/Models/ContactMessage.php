<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'contact',
        'objet',
        'message',
        'reply_message',
        'replied_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'replied_at' => 'datetime',
        ];
    }

    /**
     * Adresse e-mail de l'expéditeur, si le champ contact en contient une valide.
     */
    public function replyEmail(): ?string
    {
        $candidate = strtolower(trim((string) $this->contact));

        return filter_var($candidate, FILTER_VALIDATE_EMAIL) ? $candidate : null;
    }
}
