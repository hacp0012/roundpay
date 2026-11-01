<?php

use App\Enums\AdminRole;
use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function loginAdminToken(string $username, string $password): ?string
{
    return test()->postJson('/api/quest/auth.login.admin', [
        'username' => $username,
        'password' => $password,
    ])->json('token');
}

function authHeaders(string $token): array
{
    return ['Authorization' => 'Bearer '.$token];
}

beforeEach(function () {
    $this->seed();
    $this->principal = Admin::query()->where('role', AdminRole::Principal)->firstOrFail();
    $this->principalToken = loginAdminToken('admin', 'admin123');
});

it('creates the principal administrator by default', function () {
    expect($this->principal->username)->toBe('admin')
        ->and($this->principal->is_active)->toBeTrue();

    $this->getJson('/api/quest/auth.me', authHeaders($this->principalToken))
        ->assertOk()
        ->assertJsonPath('user.is_principal', true)
        ->assertJsonPath('user.is_member', false);
});

it('keeps administrators out of the member login', function () {
    Admin::factory()->create(['name' => 'Awa Admin', 'username' => 'awa.admin', 'password' => 'secret123']);

    expect(loginAdminToken('Amadou Diallo', '1234'))->toBeNull();
    expect(loginAdminToken('Awa Admin', 'secret123'))->toBeNull();
});

it('lets the principal list and create administrators', function () {
    $this->getJson('/api/quest/admins.list', authHeaders($this->principalToken))
        ->assertOk()
        ->assertJsonCount(1);

    $this->postJson('/api/quest/admins.create', [
        'name' => 'Awa Traoré',
        'username' => '  Awa.Tresor ',
        'password' => 'motdepasse1',
        'email' => 'AWA@example.org',
        'role' => 'admin',
    ], authHeaders($this->principalToken))
        ->assertOk()
        ->assertJsonPath('username', 'awa.tresor')
        ->assertJsonPath('email', 'awa@example.org')
        ->assertJsonPath('is_principal', false);

    expect(loginAdminToken('awa.tresor', 'motdepasse1'))->toBeString()->not->toBeEmpty();
});

it('rejects duplicate usernames when creating an administrator', function () {
    $this->postJson('/api/quest/admins.create', [
        'name' => 'Doublon',
        'username' => 'admin',
        'password' => 'motdepasse1',
    ], authHeaders($this->principalToken))
        ->assertStatus(400)
        ->assertJsonPath('message', 'Cet identifiant est déjà utilisé par un autre administrateur.');
});

it('lets the principal change username and password of another administrator', function () {
    $admin = Admin::factory()->create(['username' => 'ancien.nom', 'password' => 'ancienmdp']);

    $this->postJson('/api/quest/admins.update', [
        'adminId' => (string) $admin->id,
        'data' => ['username' => 'nouveau.nom', 'password' => 'nouveaumdp'],
    ], authHeaders($this->principalToken))
        ->assertOk()
        ->assertJsonPath('username', 'nouveau.nom');

    expect(loginAdminToken('ancien.nom', 'ancienmdp'))->toBeNull();
    expect(loginAdminToken('nouveau.nom', 'nouveaumdp'))->toBeString()->not->toBeEmpty();
});

it('deactivates an administrator, revokes the session and blocks login', function () {
    $admin = Admin::factory()->create(['username' => 'temporaire', 'password' => 'motdepasse1']);
    $adminToken = loginAdminToken('temporaire', 'motdepasse1');

    $this->postJson('/api/quest/admins.setActive', [
        'adminId' => (string) $admin->id,
        'isActive' => false,
    ], authHeaders($this->principalToken))
        ->assertOk()
        ->assertJsonPath('is_active', false);

    $me = $this->getJson('/api/quest/auth.me', authHeaders($adminToken))->assertOk();
    expect($me->json('user'))->toBeNull();

    expect(loginAdminToken('temporaire', 'motdepasse1'))->toBeNull();
});

it('refuses administration by a non-principal administrator', function () {
    Admin::factory()->create(['username' => 'simple.admin', 'password' => 'motdepasse1']);
    $simpleToken = loginAdminToken('simple.admin', 'motdepasse1');

    $this->getJson('/api/quest/admins.list', authHeaders($simpleToken))
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Accès réservé à l’administrateur principal.');

    $this->postJson('/api/quest/admins.create', [
        'name' => 'Intrus',
        'username' => 'intrus',
        'password' => 'motdepasse1',
    ], authHeaders($simpleToken))->assertUnauthorized();
});

it('refuses administration by a member', function () {
    $memberLogin = $this->postJson('/api/quest/auth.login.client', [
        'phone' => '+243 82 54 11 092',
        'pin' => '1234',
    ])->assertOk();

    $this->getJson('/api/quest/admins.list', authHeaders($memberLogin->json('token')))
        ->assertUnauthorized();
});

it('prevents the principal from deactivating or demoting their own account', function () {
    $this->postJson('/api/quest/admins.setActive', [
        'adminId' => (string) $this->principal->id,
        'isActive' => false,
    ], authHeaders($this->principalToken))
        ->assertStatus(400)
        ->assertJsonPath('message', 'Vous ne pouvez pas désactiver votre propre compte.');

    $this->postJson('/api/quest/admins.update', [
        'adminId' => (string) $this->principal->id,
        'data' => ['role' => 'admin'],
    ], authHeaders($this->principalToken))
        ->assertStatus(400)
        ->assertJsonPath('message', 'Vous ne pouvez pas retirer votre propre rôle principal.');
});

it('lets a principal deactivate another principal but never themselves', function () {
    $otherPrincipal = Admin::factory()->principal()->create(['username' => 'second.principal', 'password' => 'motdepasse1']);
    $otherToken = loginAdminToken('second.principal', 'motdepasse1');

    $this->postJson('/api/quest/admins.setActive', [
        'adminId' => (string) $this->principal->id,
        'isActive' => false,
    ], authHeaders($otherToken))
        ->assertOk()
        ->assertJsonPath('is_active', false);

    $this->postJson('/api/quest/admins.setActive', [
        'adminId' => (string) $otherPrincipal->id,
        'isActive' => false,
    ], authHeaders($otherToken))
        ->assertStatus(400)
        ->assertJsonPath('message', 'Vous ne pouvez pas désactiver votre propre compte.');
});

it('rejects an invalid username or a short password', function () {
    $this->postJson('/api/quest/admins.create', [
        'name' => 'Trop court',
        'username' => 'ab',
        'password' => 'motdepasse1',
    ], authHeaders($this->principalToken))->assertStatus(400);

    $this->postJson('/api/quest/admins.create', [
        'name' => 'Mot de passe faible',
        'username' => 'valide.nom',
        'password' => 'court',
    ], authHeaders($this->principalToken))->assertStatus(400);
});
