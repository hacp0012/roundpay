<?php

namespace App\Mail;

use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FicheReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Fiche $fiche,
        public MemberFicheRecord $record,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rappel de cotisation : '.$this->fiche->titre,
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'mail.fiche-reminder',
            with: [
                'memberName' => $this->record->user?->name,
                'ficheTitle' => $this->fiche->titre,
                'reste' => number_format((float) $this->record->reste, 2, ',', ' '),
                'dateFin' => $this->fiche->date_fin?->format('d/m/Y'),
            ],
        );
    }
}
