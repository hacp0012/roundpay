<?php

use App\Enums\FicheStatus;
use App\Models\Admin;
use App\Models\Fiche;
use App\Models\MemberFicheRecord;
use App\Models\Payment;
use App\Models\PortalSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

it('logs in a member via quest', function () {
    $response = $this->postJson('/api/quest/auth.login.client', [
        'phone' => '+243 82 54 11 092',
        'pin' => '1234',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.name', 'Amadou Diallo')
        ->assertJsonStructure(['token', 'user' => ['id', 'phone', 'role']]);

    expect($response->json('token'))->toBeString()->not->toBeEmpty();
});

it('returns public portal settings without auth', function () {
    $response = $this->getJson('/api/quest/portal.settings.get');

    $response->assertOk()->assertJsonStructure([
        'nom_collectif',
        'slogan',
        'contact_phone',
        'message_bienvenue',
    ]);
});

it('lists public fiches without auth', function () {
    $response = $this->getJson('/api/quest/portal.fiches.list');

    $response->assertOk();
    expect($response->json())->toBeArray()->not->toBeEmpty();
    expect($response->json('0.titre'))->toBeString();
});

it('hides closed public fiches from the list and direct access', function () {
    $closedFiche = Fiche::factory()->libre()->published()->create([
        'statut' => FicheStatus::Fermee,
    ]);

    $list = $this->getJson('/api/quest/portal.fiches.list')->assertOk();
    $list->assertJsonMissing(['id' => (string) $closedFiche->id]);

    $detail = $this->getJson('/api/quest/fiches.get?id='.$closedFiche->id)->assertOk();
    $detail->assertJsonMissing(['id' => (string) $closedFiche->id]);
});

it('rejects payment with a 422 response for a closed fiche', function () {
    $closedFiche = Fiche::factory()->libre()->create([
        'statut' => FicheStatus::Fermee,
    ]);

    $response = $this->postJson('/api/quest/payments.record', [
        'fiche_id' => (string) $closedFiche->id,
        'montant' => 25,
        'mobile_provider' => 'mpesa',
        'is_anonymous' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['fiche_id']);
    $this->assertDatabaseMissing('payments', ['fiche_id' => $closedFiche->id]);
});

it('persists fiche changes submitted by staff', function () {
    $fiche = Fiche::factory()->libre()->create();
    $token = $this->postJson('/api/quest/auth.login.admin', [
        'username' => 'admin',
        'password' => 'admin123',
    ])->assertOk()->json('token');

    $this->postJson('/api/quest/fiches.update', [
        'ficheId' => (string) $fiche->id,
        'updates' => [
            'titre' => 'Collecte modifiée',
            'motif' => 'Motif actualisé',
            'statut' => 'fermee',
        ],
    ], ['Authorization' => 'Bearer '.$token])
        ->assertOk()
        ->assertJsonPath('titre', 'Collecte modifiée')
        ->assertJsonPath('statut', 'fermee');

    $this->assertDatabaseHas('fiches', [
        'id' => $fiche->id,
        'titre' => 'Collecte modifiée',
        'motif' => 'Motif actualisé',
        'statut' => 'fermee',
    ]);
});

it('rejects treasury overview without a token', function () {
    $response = $this->getJson('/api/quest/treasury.overview');

    $response->assertUnauthorized();
});

it('returns the authenticated user with a bearer token', function () {
    $login = $this->postJson('/api/quest/auth.login.admin', [
        'username' => 'admin',
        'password' => 'admin123',
    ])->assertOk();

    $token = $login->json('token');

    $this->getJson('/api/quest/auth.me', [
        'Authorization' => 'Bearer '.$token,
    ])->assertOk()->assertJsonPath('user.username', 'admin');

    expect(Admin::query()->where('username', 'admin')->value('api_token'))->not->toBeNull();
});

it('keeps the local payment driver available without calling an external provider', function () {
    Http::preventStrayRequests();
    config(['services.payment_gateway.driver' => 'local']);
    $fiche = Fiche::factory()->libre()->create();

    $this->postJson('/api/quest/payments.record', [
        'fiche_id' => (string) $fiche->id,
        'montant' => 25,
        'mobile_provider' => 'mpesa',
        'is_anonymous' => true,
    ])->assertOk()
        ->assertJsonPath('pending', false)
        ->assertJsonPath('payment.statut', 'valide')
        ->assertJsonPath('payment.payment_gateway', 'local');

    Http::assertNothingSent();
});

it('starts a pending MaishaPay collection and settles it once from its callback', function () {
    Http::fake([
        'https://marchand.maishapay.online/api/collect/v2/store/mobileMoney' => Http::response([
            'status_code' => 202,
            'transactionStatus' => 'PENDING',
            'transactionId' => 12345,
            'originatingTransactionId' => 'MP-ORIGIN-1',
        ], 202),
    ]);
    config([
        'services.payment_gateway.driver' => 'maishapay',
        'services.maishapay.public_api_key' => 'public-test-key',
        'services.maishapay.secret_api_key' => 'secret-test-key',
        'services.maishapay.webhook_token' => 'maisha-hook-token',
        'services.maishapay.callback_url' => 'https://roundpay.test/api/webhooks/payments/maishapay?token=maisha-hook-token',
    ]);
    $fiche = Fiche::factory()->obligatoire()->create();
    $user = User::factory()->create(['solde_credit' => 0]);
    $user->groups()->attach($fiche->group_id);

    $initiation = $this->postJson('/api/quest/payments.record', [
        'fiche_id' => (string) $fiche->id,
        'user_id' => (string) $user->id,
        'montant' => 100,
        'mobile_provider' => 'orange_money',
        'phone_number' => '+243991234567',
        'reference' => 'RP-MAISHA-001',
    ])->assertOk()
        ->assertJsonPath('pending', true)
        ->assertJsonPath('payment.statut', 'en_attente')
        ->assertJsonPath('payment.gateway_order_number', '12345');

    Http::assertSent(function (Request $request): bool {
        return $request->url() === 'https://marchand.maishapay.online/api/collect/v2/store/mobileMoney'
            && $request['transactionReference'] === 'RP-MAISHA-001'
            && $request['paymentChannel']['provider'] === 'ORANGE'
            && $request['paymentChannel']['walletID'] === '+243991234567'
            && $request['paymentChannel']['callbackUrl'] === 'https://roundpay.test/api/webhooks/payments/maishapay?token=maisha-hook-token';
    });

    $callback = [
        'transactionReference' => $initiation->json('payment.reference'),
        'transactionStatus' => 'SUCCESS',
        'status_code' => 200,
        'transactionId' => 12345,
        'originatingTransactionId' => 'MP-ORIGIN-1',
        'order' => ['cost' => ['amount' => 100, 'currency' => 'CDF']],
    ];

    PortalSetting::query()->firstOrFail()->update(['devise' => 'USD']);

    $this->postJson('/api/webhooks/payments/maishapay?token=invalid-token', $callback)
        ->assertForbidden();

    $mismatchedCallback = $callback;
    $mismatchedCallback['order']['cost']['amount'] = 101;
    $this->postJson('/api/webhooks/payments/maishapay?token=maisha-hook-token', $mismatchedCallback)
        ->assertConflict();

    $this->postJson('/api/webhooks/payments/maishapay?token=maisha-hook-token', $callback)
        ->assertOk()
        ->assertJsonPath('status', 'valide');
    $this->postJson('/api/webhooks/payments/maishapay?token=maisha-hook-token', $callback)
        ->assertOk()
        ->assertJsonPath('status', 'valide');

    $this->assertDatabaseHas('payments', [
        'reference' => 'RP-MAISHA-001',
        'payment_gateway' => 'maishapay',
        'gateway_order_number' => '12345',
        'provider_reference' => 'MP-ORIGIN-1',
        'currency' => 'CDF',
        'regle_fiche' => 25,
        'credite_solde' => 75,
        'statut' => 'valide',
    ]);
    expect(Payment::query()->where('reference', 'RP-MAISHA-001')->count())->toBe(1);
    expect((float) User::query()->findOrFail($user->id)->solde_credit)->toBe(75.0);
    expect((float) MemberFicheRecord::query()->where('user_id', $user->id)->where('fiche_id', $fiche->id)->value('montant_paye'))->toBe(25.0);
});

it('verifies FlexPay callbacks against the check transaction endpoint', function () {
    Http::fake(function (Request $request) {
        if (str_ends_with($request->url(), '/api/rest/v1/paymentService')) {
            return Http::response(['code' => '0', 'orderNumber' => 'FP-ORDER-1'], 200);
        }

        if (str_ends_with($request->url(), '/api/rest/v1/check/FP-ORDER-1')) {
            return Http::response([
                'code' => '0',
                'transaction' => [
                    'orderNumber' => 'FP-ORDER-1',
                    'reference' => 'RP-FLEX-001',
                    'amount' => '50.0',
                    'currency' => 'CDF',
                    'status' => '0',
                ],
            ], 200);
        }

        return Http::response([], 404);
    });
    config([
        'services.payment_gateway.driver' => 'flexpay',
        'services.flexpay.base_url' => 'https://flexpay.test',
        'services.flexpay.api_token' => 'flexpay-test-token',
        'services.flexpay.merchant_code' => 'ROUND-PAY',
        'services.flexpay.webhook_token' => 'flexpay-hook-token',
        'services.flexpay.callback_url' => 'https://roundpay.test/api/webhooks/payments/flexpay?token=flexpay-hook-token',
    ]);
    $fiche = Fiche::factory()->libre()->create();

    $initiation = $this->postJson('/api/quest/payments.record', [
        'fiche_id' => (string) $fiche->id,
        'montant' => 50,
        'mobile_provider' => 'mpesa',
        'phone_number' => '+243991234567',
        'is_anonymous' => true,
        'reference' => 'RP-FLEX-001',
    ])->assertOk()
        ->assertJsonPath('pending', true)
        ->assertJsonPath('payment.statut', 'en_attente')
        ->assertJsonPath('payment.gateway_order_number', 'FP-ORDER-1');

    Http::assertSent(function (Request $request): bool {
        return str_ends_with($request->url(), '/api/rest/v1/paymentService')
            && $request->hasHeader('Authorization', 'Bearer flexpay-test-token')
            && $request['merchant'] === 'ROUND-PAY'
            && $request['reference'] === 'RP-FLEX-001'
            && $request['callbackUrl'] === 'https://roundpay.test/api/webhooks/payments/flexpay?token=flexpay-hook-token';
    });

    $callback = [
        'Code' => '0',
        'Reference' => $initiation->json('payment.reference'),
        'Provider_reference' => 'MPESA-123',
        'orderNumber' => 'FP-ORDER-1',
    ];
    $this->postJson('/api/webhooks/payments/flexpay?token=wrong-token', $callback)->assertForbidden();
    $this->postJson('/api/webhooks/payments/flexpay?token=flexpay-hook-token', $callback)
        ->assertOk()->assertJsonPath('status', 'valide');

    $this->assertDatabaseHas('payments', [
        'reference' => 'RP-FLEX-001',
        'payment_gateway' => 'flexpay',
        'provider_reference' => 'MPESA-123',
        'statut' => 'valide',
    ]);
    Http::assertSent(function (Request $request): bool {
        return str_ends_with($request->url(), '/api/rest/v1/check/FP-ORDER-1');
    });
});
