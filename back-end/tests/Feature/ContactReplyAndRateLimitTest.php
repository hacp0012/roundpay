<?php

use App\Mail\ContactReplyMail;
use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function contactPayload(array $overrides = []): array
{
    return array_merge([
        'nom' => 'Jean Dupont',
        'contact' => 'jean@example.org',
        'objet' => 'Renseignement collecte',
        'message' => 'Comment verser ma cotisation ?',
    ], $overrides);
}

function staffBearer(): array
{
    $token = test()->postJson('/api/quest/auth.login.admin', [
        'username' => 'admin',
        'password' => 'admin123',
    ])->json('token');

    return ['Authorization' => 'Bearer '.$token];
}

it('limits how many contact messages one visitor can send in a short window', function () {
    for ($i = 0; $i < 3; $i++) {
        $this->postJson('/api/quest/portal.contact.send', contactPayload())->assertOk();
    }

    $this->postJson('/api/quest/portal.contact.send', contactPayload())
        ->assertStatus(400)
        ->assertJsonPath('message', fn ($message) => str_starts_with($message, 'Vous avez envoyé plusieurs messages'));

    expect(ContactMessage::query()->count())->toBe(3);
});

it('emails the visitor when staff replies to a message with a valid address', function () {
    Mail::fake();

    $message = ContactMessage::query()->create([
        'nom' => 'Jean Dupont',
        'contact' => 'Jean@Example.org',
        'objet' => 'Renseignement collecte',
        'message' => 'Comment verser ma cotisation ?',
    ]);

    $this->postJson('/api/quest/portal.contacts.reply', [
        'messageId' => (string) $message->id,
        'body' => 'Bonjour, utilisez le bouton Contribuer sur la collecte.',
    ], staffBearer())
        ->assertOk()
        ->assertJsonPath('email', 'jean@example.org');

    Mail::assertSent(ContactReplyMail::class, fn ($mail) => $mail->hasTo('jean@example.org'));

    $message->refresh();
    expect($message->reply_message)->toBe('Bonjour, utilisez le bouton Contribuer sur la collecte.')
        ->and($message->replied_at)->not->toBeNull();
});

it('refuses a reply when the sender gave no valid email address', function () {
    Mail::fake();

    $message = ContactMessage::query()->create([
        'nom' => 'Awa',
        'contact' => '+221 77 000 00 00',
        'objet' => 'Autre',
        'message' => 'Question',
    ]);

    $this->postJson('/api/quest/portal.contacts.reply', [
        'messageId' => (string) $message->id,
        'body' => 'Réponse',
    ], staffBearer())
        ->assertStatus(400)
        ->assertJsonPath('message', "Ce message ne contient pas d'adresse e-mail valide : impossible de répondre par mail.");

    Mail::assertNothingSent();
});

it('refuses replies from anyone who is not staff', function () {
    Mail::fake();

    $message = ContactMessage::query()->create([
        'nom' => 'Jean',
        'contact' => 'jean@example.org',
        'objet' => 'Autre',
        'message' => 'Question',
    ]);

    $this->postJson('/api/quest/portal.contacts.reply', [
        'messageId' => (string) $message->id,
        'body' => 'Réponse',
    ])->assertUnauthorized();

    Mail::assertNothingSent();
});
