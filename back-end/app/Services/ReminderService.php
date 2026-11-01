<?php

namespace App\Services;

use App\Mail\FicheReminderMail;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use Illuminate\Support\Facades\Mail;

class ReminderService
{
    /**
     * Envoie un rappel par e-mail à chaque membre qui a un reste dû sur la fiche.
     * Les membres sans adresse e-mail ne peuvent pas être joints et sont comptés à part.
     *
     * @return array{late: int, sent: int, without_email: int}
     */
    public function remindLateMembers(Fiche $fiche): array
    {
        $records = MemberFicheRecord::query()
            ->where('fiche_id', $fiche->id)
            ->where('reste', '>', 0)
            ->with('user')
            ->get();

        $sent = 0;
        $withoutEmail = 0;

        foreach ($records as $record) {
            $email = $record->user?->email;
            if (! $email) {
                $withoutEmail++;

                continue;
            }

            Mail::to($email)->send(new FicheReminderMail($fiche, $record));
            $sent++;
        }

        return [
            'late' => $records->count(),
            'sent' => $sent,
            'without_email' => $withoutEmail,
        ];
    }
}
