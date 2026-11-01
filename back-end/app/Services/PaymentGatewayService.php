<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PortalSetting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PaymentGatewayService
{
    /**
     * @return array{state: 'pending'|'success', gateway_order_number: ?string, provider_reference: ?string}
     */
    public function initiate(
        Payment $payment,
        string $phoneNumber,
        string $customerFullName,
        ?string $customerEmail,
        string $currency,
    ): array {
        return match ($payment->payment_gateway) {
            'maishapay' => $this->initiateMaishaPay($payment, $phoneNumber, $customerFullName, $customerEmail, $currency),
            'flexpay' => $this->initiateFlexPay($payment, $phoneNumber, $currency),
            default => throw new RuntimeException('Passerelle de paiement non configurée.'),
        };
    }

    public function verifyFlexPayCallback(Payment $payment, string $orderNumber): string
    {
        $expectedOrderNumber = (string) $payment->gateway_order_number;
        if ($expectedOrderNumber !== '' && ! hash_equals($expectedOrderNumber, $orderNumber)) {
            return 'pending';
        }

        $baseUrl = rtrim((string) config('services.flexpay.base_url'), '/');
        $apiToken = (string) config('services.flexpay.api_token');
        if ($baseUrl === '' || $apiToken === '') {
            throw new RuntimeException('La vérification FlexPay n’est pas configurée.');
        }

        try {
            $response = Http::acceptJson()
                ->withToken($apiToken)
                ->timeout((int) config('services.payment_gateway.timeout', 30))
                ->get($baseUrl . rtrim((string) config('services.flexpay.check_path'), '/') . '/' . rawurlencode($orderNumber));
        } catch (ConnectionException) {
            return 'pending';
        }

        if (! $response->successful()) {
            throw new RuntimeException('FlexPay n’a pas pu vérifier cette transaction.');
        }

        $body = $response->json();
        if (! is_array($body) || (string) ($body['code'] ?? '') !== '0') {
            return 'pending';
        }

        $transaction = $body['transaction'] ?? null;
        if (! is_array($transaction) || (string) ($transaction['orderNumber'] ?? '') !== $orderNumber) {
            return 'pending';
        }

        $currency = (string) ($payment->currency ?: PortalSetting::query()->value('devise') ?: 'CDF');
        if (
            (string) ($transaction['reference'] ?? '') !== $payment->reference
            || ! is_numeric($transaction['amount'] ?? null)
            || abs((float) $transaction['amount'] - (float) $payment->montant) > 0.01
            || (string) ($transaction['currency'] ?? '') !== $currency
        ) {
            return 'pending';
        }

        return match ((string) ($transaction['status'] ?? '')) {
            '0' => 'success',
            '1' => 'failed',
            default => 'pending',
        };
    }

    /**
     * @return array{state: 'pending'|'success', gateway_order_number: ?string, provider_reference: ?string}
     */
    private function initiateMaishaPay(
        Payment $payment,
        string $phoneNumber,
        string $customerFullName,
        ?string $customerEmail,
        string $currency,
    ): array {
        $baseUrl = rtrim((string) config('services.maishapay.base_url'), '/');
        $publicApiKey = (string) config('services.maishapay.public_api_key');
        $secretApiKey = (string) config('services.maishapay.secret_api_key');
        $webhookToken = (string) config('services.maishapay.webhook_token');
        if ($baseUrl === '' || $publicApiKey === '' || $secretApiKey === '' || $webhookToken === '') {
            throw new RuntimeException('Les identifiants MaishaPay et le jeton callback doivent être configurés.');
        }

        if (($currency === 'USD' && (float) $payment->montant < 0.5)
            || ($currency !== 'USD' && (float) $payment->montant < 100)
        ) {
            throw new RuntimeException('Le montant est inférieur au minimum accepté par MaishaPay pour cette devise.');
        }

        $provider = match ($payment->mobile_provider->value) {
            'airtel_money' => 'AIRTEL',
            'orange_money' => 'ORANGE',
            'mpesa' => 'MPESA',
            'mtn_momo' => 'MTN',
            'wave' => 'WAVE',
            default => throw new RuntimeException('Cet opérateur ne peut pas être utilisé avec MaishaPay.'),
        };

        $callbackUrl = (string) config('services.maishapay.callback_url');
        if (! $this->callbackUrlContainsToken($callbackUrl, $webhookToken)) {
            throw new RuntimeException('L’URL callback MaishaPay doit contenir son jeton de validation.');
        }

        $order = [
            'amount' => (float) $payment->montant,
            'currency' => $currency,
            'customerFullName' => $customerFullName,
        ];
        if ($customerEmail) {
            $order['customerEmailAdress'] = $customerEmail;
        }

        $payload = [
            'transactionReference' => $payment->reference,
            'gatewayMode' => (string) config('services.maishapay.gateway_mode', 0),
            'publicApiKey' => $publicApiKey,
            'secretApiKey' => $secretApiKey,
            'order' => $order,
            'paymentChannel' => [
                'channel' => 'MOBILEMONEY',
                'provider' => $provider,
                'walletID' => $phoneNumber,
                'callbackUrl' => $callbackUrl,
            ],
        ];

        try {
            $response = Http::acceptJson()
                ->timeout((int) config('services.payment_gateway.timeout', 30))
                ->post($baseUrl . (string) config('services.maishapay.collection_path'), $payload);
        } catch (ConnectionException) {
            return [
                'state' => 'pending',
                'gateway_order_number' => null,
                'provider_reference' => null,
            ];
        }

        $body = $response->json();
        if (! $response->successful() || ! is_array($body)) {
            throw new RuntimeException('MaishaPay n’a pas accepté la demande de paiement.');
        }

        $state = strtoupper((string) ($body['transactionStatus'] ?? ''));
        if ($state === 'FAILED' || (int) ($body['status_code'] ?? 0) >= 400) {
            throw new RuntimeException('MaishaPay a refusé la demande de paiement.');
        }

        if (! in_array($state, ['PENDING', 'SUCCESS'], true)) {
            throw new RuntimeException('Réponse MaishaPay inattendue.');
        }

        return [
            'state' => $state === 'SUCCESS' ? 'success' : 'pending',
            'gateway_order_number' => isset($body['transactionId']) ? (string) $body['transactionId'] : null,
            'provider_reference' => isset($body['originatingTransactionId']) ? (string) $body['originatingTransactionId'] : null,
        ];
    }

    /**
     * @return array{state: 'pending'|'success', gateway_order_number: ?string, provider_reference: ?string}
     */
    private function initiateFlexPay(Payment $payment, string $phoneNumber, string $currency): array
    {
        $baseUrl = rtrim((string) config('services.flexpay.base_url'), '/');
        $apiToken = (string) config('services.flexpay.api_token');
        $merchantCode = (string) config('services.flexpay.merchant_code');
        $webhookToken = (string) config('services.flexpay.webhook_token');
        if ($baseUrl === '' || $apiToken === '' || $merchantCode === '' || $webhookToken === '') {
            throw new RuntimeException('La configuration FlexPay est incomplète.');
        }

        $callbackUrl = (string) config('services.flexpay.callback_url');
        if (! $this->callbackUrlContainsToken($callbackUrl, $webhookToken)) {
            throw new RuntimeException('L’URL callback FlexPay doit contenir son jeton de validation.');
        }

        try {
            $response = Http::acceptJson()
                ->withToken($apiToken)
                ->timeout((int) config('services.payment_gateway.timeout', 30))
                ->post($baseUrl . (string) config('services.flexpay.payment_path'), [
                    'merchant' => $merchantCode,
                    'type' => '1',
                    'reference' => $payment->reference,
                    'phone' => $phoneNumber,
                    'amount' => (string) $payment->montant,
                    'currency' => $currency,
                    'callbackUrl' => $callbackUrl,
                ]);
        } catch (ConnectionException) {
            return [
                'state' => 'pending',
                'gateway_order_number' => null,
                'provider_reference' => null,
            ];
        }

        $body = $response->json();
        if (! $response->successful() || ! is_array($body) || (string) ($body['code'] ?? '') !== '0') {
            throw new RuntimeException('FlexPay n’a pas accepté la demande de paiement.');
        }

        $orderNumber = $body['orderNumber'] ?? null;
        if (! is_string($orderNumber) || $orderNumber === '') {
            throw new RuntimeException('FlexPay n’a pas retourné de numéro de commande.');
        }

        return [
            'state' => 'pending',
            'gateway_order_number' => $orderNumber,
            'provider_reference' => null,
        ];
    }

    private function callbackUrlContainsToken(string $callbackUrl, string $token): bool
    {
        parse_str((string) parse_url($callbackUrl, PHP_URL_QUERY), $query);

        return hash_equals($token, (string) ($query['token'] ?? ''));
    }
}
