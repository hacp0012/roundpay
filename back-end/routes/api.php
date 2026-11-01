<?php

use App\Http\Controllers\PaymentGatewayCallbackController;
use App\Http\Controllers\DepenseDocumentController;
use Hacp0012\Quest\Quest;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['name' => config('app.name'), 'ok' => true];
});

Route::prefix('webhooks/payments')->controller(PaymentGatewayCallbackController::class)->group(function () {
    Route::post('/flexpay', 'flexPay');
    Route::post('/maishapay', 'maishaPay');
});

Route::post('/depenses', [DepenseDocumentController::class, 'store']);
Route::get('/depenses/{depense}/preuve', [DepenseDocumentController::class, 'download'])
    ->whereNumber('depense')
    ->name('depenses.preuve.download');

Quest::spawn(uri: 'quest', routes: ['app/Quest'])->name('quest');
