<?php

use App\Enums\FicheType;
use App\Mail\FicheReminderMail;
use App\Models\ContactMessage;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function staffToken(): string
{
    return test()->postJson('/api/quest/auth.login.admin', [
        'username' => 'admin',
        'password' => 'admin123',
    ])->json('token');
}

it('stores a contact message sent from the public portal', function () {
    $this->postJson('/api/quest/portal.contact.send', [
        'nom' => 'Jean Dupont',
        'contact' => 'jean@example.org',
        'objet' => 'Renseignement collecte',
        'message' => 'Bonjour, comment verser ma cotisation ?',
    ])->assertOk()->assertJsonPath('received', true);

    $this->assertDatabaseHas('contact_messages', [
        'nom' => 'Jean Dupont',
        'contact' => 'jean@example.org',
        'objet' => 'Renseignement collecte',
    ]);
});

it('rejects a contact message without name or message', function () {
    $this->postJson('/api/quest/portal.contact.send', [
        'nom' => '',
        'objet' => 'Renseignement collecte',
        'message' => 'Bonjour',
    ])->assertStatus(400)->assertJsonPath('message', 'Veuillez indiquer votre nom.');

    $this->postJson('/api/quest/portal.contact.send', [
        'nom' => 'Jean',
        'objet' => 'Renseignement collecte',
        'message' => '',
    ])->assertStatus(400)->assertJsonPath('message', 'Veuillez écrire votre message.');

    expect(ContactMessage::query()->count())->toBe(0);
});

it('lets staff read received contact messages but not the public', function () {
    ContactMessage::query()->create([
        'nom' => 'Awa',
        'contact' => null,
        'objet' => 'Autre',
        'message' => 'Question sur les dons',
    ]);

    $this->getJson('/api/quest/portal.contacts.list')->assertUnauthorized();

    $this->getJson('/api/quest/portal.contacts.list', ['Authorization' => 'Bearer '.staffToken()])
        ->assertOk()
        ->assertJsonPath('0.nom', 'Awa')
        ->assertJsonPath('0.message', 'Question sur les dons');
});

it('emails each late member and reports those without an address', function () {
    Mail::fake();

    $fiche = Fiche::factory()->create(['type' => FicheType::Obligatoire, 'titre' => 'Chaises']);
    $withEmail = User::factory()->create(['email' => 'retard@example.org']);
    $withoutEmail = User::factory()->create(['email' => null]);
    $upToDate = User::factory()->create(['email' => 'ok@example.org']);

    MemberFicheRecord::factory()->create(['fiche_id' => $fiche->id, 'user_id' => $withEmail->id, 'reste' => 25]);
    MemberFicheRecord::factory()->create(['fiche_id' => $fiche->id, 'user_id' => $withoutEmail->id, 'reste' => 25]);
    MemberFicheRecord::factory()->create(['fiche_id' => $fiche->id, 'user_id' => $upToDate->id, 'reste' => 0]);

    $this->postJson('/api/quest/fiches.remind', ['ficheId' => (string) $fiche->id], [
        'Authorization' => 'Bearer '.staffToken(),
    ])->assertOk()
        ->assertJsonPath('late', 2)
        ->assertJsonPath('sent', 1)
        ->assertJsonPath('without_email', 1);

    Mail::assertSent(FicheReminderMail::class, 1);
    Mail::assertSent(FicheReminderMail::class, fn ($mail) => $mail->hasTo('retard@example.org'));
    Mail::assertNotSent(FicheReminderMail::class, fn ($mail) => $mail->hasTo('ok@example.org'));
});

it('refuses reminders from a member', function () {
    $member = User::factory()->create(['email' => 'm@example.org', 'pin' => '1234', 'phone' => '+243000000001']);
    $fiche = Fiche::factory()->create(['type' => FicheType::Obligatoire]);
    Mail::fake();

    $token = $this->postJson('/api/quest/auth.login.client', [
        'phone' => '+243000000001',
        'pin' => '1234',
    ])->json('token');

    $this->postJson('/api/quest/fiches.remind', ['ficheId' => (string) $fiche->id], [
        'Authorization' => 'Bearer '.$token,
    ])->assertUnauthorized();

    Mail::assertNothingSent();
    expect($member->id)->not->toBeNull();
});
