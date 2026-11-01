<?php

namespace App\Quest;

use App\Enums\FicheStatus;
use App\Mail\ContactReplyMail;
use App\Models\ContactMessage;
use App\Models\Fiche;
use App\Models\PortalSetting;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class PortalQuest
{
    /** Nombre maximum de messages de contact par adresse IP sur la fenêtre. */
    private const CONTACT_MAX_MESSAGES = 3;

    /** Fenêtre de limitation : 15 minutes. */
    private const CONTACT_WINDOW_SECONDS = 900;

    private const CONTACT_RATE_KEY = 'contact-message:';

    #[QuestSpaw(ref: 'portal.settings.get', method: SpawMethod::GET)]
    public function getPublicSettings(): array
    {
        $settings = PortalSetting::query()->first();
        if (! $settings) {
            throw new RuntimeException('Paramètres du portail introuvables.');
        }

        return ApiPresenter::settings($settings);
    }

    #[QuestSpaw(ref: 'portal.settings.update')]
    public function updatePublicSettings(array $settings): array
    {
        QuestAuth::requireStaff();
        $row = PortalSetting::query()->firstOrFail();
        $row->fill($settings);
        $row->save();

        return ApiPresenter::settings($row);
    }

    #[QuestSpaw(ref: 'portal.fiches.list', method: SpawMethod::GET)]
    public function getPublicFiches(): array
    {
        return Fiche::query()
            ->where(function ($query) {
                $query->where('is_public', true)->orWhere('type', 'libre');
            })
            ->where('statut', FicheStatus::Ouverte)
            ->orderByDesc('id')
            ->get()
            ->map(fn (Fiche $fiche) => ApiPresenter::fiche($fiche))
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'portal.contact.send')]
    public function sendContactMessage(?string $nom = null, ?string $objet = null, ?string $message = null, ?string $contact = null): array
    {
        $rateKey = self::CONTACT_RATE_KEY.request()->ip();
        if (RateLimiter::tooManyAttempts($rateKey, self::CONTACT_MAX_MESSAGES)) {
            $minutes = (int) ceil(RateLimiter::availableIn($rateKey) / 60);

            throw new RuntimeException("Vous avez envoyé plusieurs messages récemment. Réessayez dans {$minutes} minute(s).");
        }
        RateLimiter::hit($rateKey, self::CONTACT_WINDOW_SECONDS);

        $validator = Validator::make(
            ['nom' => $nom, 'objet' => $objet, 'message' => $message, 'contact' => $contact],
            [
                'nom' => ['required', 'string', 'max:120'],
                'objet' => ['required', 'string', 'max:160'],
                'message' => ['required', 'string', 'max:2000'],
                'contact' => ['nullable', 'string', 'max:120'],
            ],
            [
                'nom.required' => 'Veuillez indiquer votre nom.',
                'message.required' => 'Veuillez écrire votre message.',
                'message.max' => 'Le message ne doit pas dépasser 2000 caractères.',
            ],
        );
        if ($validator->fails()) {
            throw new RuntimeException($validator->errors()->first());
        }
        $validated = $validator->validated();

        $contactMessage = ContactMessage::query()->create([
            'nom' => trim($validated['nom']),
            'objet' => trim($validated['objet']),
            'message' => trim($validated['message']),
            'contact' => trim((string) $validated['contact']) ?: null,
        ]);

        return ['id' => (string) $contactMessage->id, 'received' => true];
    }

    #[QuestSpaw(ref: 'portal.contacts.list', method: SpawMethod::GET)]
    public function getContactMessages(): array
    {
        QuestAuth::requireStaff();

        return ContactMessage::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (ContactMessage $item) => [
                'id' => (string) $item->id,
                'nom' => $item->nom,
                'contact' => $item->contact ?? '',
                'email' => $item->replyEmail(),
                'objet' => $item->objet,
                'message' => $item->message,
                'reply_message' => $item->reply_message,
                'replied_at' => $item->replied_at?->format('d/m/Y H:i'),
                'created_at' => $item->created_at?->format('d/m/Y H:i'),
            ])
            ->values()
            ->all();
    }

    #[QuestSpaw(ref: 'portal.contacts.reply')]
    public function replyToContactMessage(string $messageId, ?string $body = null): array
    {
        QuestAuth::requireStaff();

        $contactMessage = ContactMessage::query()->find($messageId);
        if (! $contactMessage) {
            throw new RuntimeException('Message introuvable.');
        }

        $validator = Validator::make(
            ['body' => $body],
            ['body' => ['required', 'string', 'max:5000']],
            ['body.required' => 'Veuillez écrire votre réponse.', 'body.max' => 'La réponse ne doit pas dépasser 5000 caractères.'],
        );
        if ($validator->fails()) {
            throw new RuntimeException($validator->errors()->first());
        }

        $email = $contactMessage->replyEmail();
        if (! $email) {
            throw new RuntimeException("Ce message ne contient pas d'adresse e-mail valide : impossible de répondre par mail.");
        }

        $replyBody = trim((string) $validator->validated()['body']);
        Mail::to($email)->send(new ContactReplyMail($contactMessage, $replyBody));

        $contactMessage->forceFill([
            'reply_message' => $replyBody,
            'replied_at' => now(),
        ])->save();

        return [
            'id' => (string) $contactMessage->id,
            'email' => $email,
            'reply_message' => $replyBody,
            'replied_at' => $contactMessage->replied_at?->format('d/m/Y H:i'),
        ];
    }
}
