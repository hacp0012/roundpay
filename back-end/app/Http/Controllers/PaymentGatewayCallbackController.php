<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\ContributionService;
use App\Services\PaymentGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentGatewayCallbackController extends Controller
{
    public function flexPay(
        Request $request,
        PaymentGatewayService $gatewayService,
        ContributionService $contributionService,
    ): JsonResponse {
        if (! $this->hasValidToken($request, 'services.flexpay.webhook_token')) {
            return response()->json(['message' => 'Jeton callback invalide.'], 403);
        }

        $payload = $request->validate([
            'Code' => ['required', 'numeric'],
            'Reference' => ['required', 'string'],
            'Provider_reference' => ['nullable', 'string'],
            'orderNumber' => ['required', 'string'],
        ]);

        $payment = Payment::query()
            ->where('payment_gateway', 'flexpay')
            ->where('reference', $payload['Reference'])
            ->first();
        if (! $payment) {
            return response()->json(['message' => 'Référence de paiement inconnue.'], 404);
        }

        $state = $gatewayService->verifyFlexPayCallback($payment, $payload['orderNumber']);
        if ($state === 'pending') {
            return response()->json(['received' => true, 'status' => 'en_attente'], 202);
        }

        $result = $contributionService->completeGatewayPayment(
            'flexpay',
            $payment->reference,
            $state,
            $payload['orderNumber'],
            $payload['Provider_reference'] ?? null,
        );

        return $result
            ? response()->json(['received' => true, 'status' => $result['payment']['statut']])
            : response()->json(['message' => 'La transaction FlexPay ne correspond pas au paiement.'], 409);
    }

    public function maishaPay(Request $request, ContributionService $contributionService): JsonResponse
    {
        if (! $this->hasValidToken($request, 'services.maishapay.webhook_token')) {
            return response()->json(['message' => 'Jeton callback invalide.'], 403);
        }

        $payload = $request->validate([
            'transactionReference' => ['required', 'string'],
            'transactionStatus' => ['required', 'in:SUCCESS,FAILED,PENDING'],
            'status_code' => ['nullable', 'integer'],
            'transactionId' => ['nullable'],
            'originatingTransactionId' => ['nullable', 'string'],
            'order.cost.amount' => ['nullable', 'numeric'],
            'order.cost.currency' => ['nullable', 'string'],
        ]);

        $payment = Payment::query()
            ->where('payment_gateway', 'maishapay')
            ->where('reference', $payload['transactionReference'])
            ->first();
        if (! $payment) {
            return response()->json(['message' => 'Référence de paiement inconnue.'], 404);
        }

        $reportedAmount = data_get($payload, 'order.cost.amount');
        if ($reportedAmount !== null && abs((float) $reportedAmount - (float) $payment->montant) > 0.01) {
            return response()->json(['message' => 'Le montant callback ne correspond pas au paiement.'], 409);
        }
        $reportedCurrency = data_get($payload, 'order.cost.currency');
        $expectedCurrency = (string) ($payment->currency ?: 'CDF');
        if ($reportedCurrency !== null && $reportedCurrency !== $expectedCurrency) {
            return response()->json(['message' => 'La devise callback ne correspond pas au paiement.'], 409);
        }

        $state = match ($payload['transactionStatus']) {
            'SUCCESS' => 'success',
            'FAILED' => 'failed',
            default => 'pending',
        };

        $result = $contributionService->completeGatewayPayment(
            'maishapay',
            $payment->reference,
            $state,
            isset($payload['transactionId']) ? (string) $payload['transactionId'] : null,
            $payload['originatingTransactionId'] ?? null,
        );

        return $result
            ? response()->json(['received' => true, 'status' => $result['payment']['statut']])
            : response()->json(['message' => 'La transaction MaishaPay ne correspond pas au paiement.'], 409);
    }

    private function hasValidToken(Request $request, string $configKey): bool
    {
        $expectedToken = (string) config($configKey);
        $providedToken = (string) $request->query('token', '');

        return $expectedToken !== '' && hash_equals($expectedToken, $providedToken);
    }
}
