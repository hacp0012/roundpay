<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $filename }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1a1c20;
            background: #fff;
        }

        /* Header */
        .header {
            background: #111418;
            color: #fff;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .header-brand {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .header-title {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.3px;
        }

        .header-subtitle {
            font-size: 10px;
            color: #a0aab8;
        }

        .header-meta {
            text-align: right;
            font-size: 9px;
            color: #a0aab8;
        }

        /* Summary bar */
        .summary-bar {
            display: flex;
            gap: 12px;
            padding: 0 24px;
            margin-bottom: 18px;
        }

        .summary-card {
            flex: 1;
            background: #f3f4f8;
            border-radius: 10px;
            padding: 12px 16px;
            border-left: 3px solid #111418;
        }

        .summary-card.accent {
            border-left-color: #4f7ef2;
        }

        .summary-card.green {
            border-left-color: #16a34a;
        }

        .summary-label {
            font-size: 8.5px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .summary-value {
            font-size: 16px;
            font-weight: 700;
            color: #111418;
        }

        /* Table */
        .table-container {
            padding: 0 24px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead tr {
            background: #111418;
            color: #fff;
        }

        thead th {
            padding: 8px 10px;
            text-align: left;
            font-size: 8.5px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }

        tbody tr {
            border-bottom: 1px solid #eaedf2;
        }

        tbody tr:nth-child(even) {
            background: #f9fafc;
        }

        tbody tr:hover {
            background: #f0f2f8;
        }

        tbody td {
            padding: 7px 10px;
            font-size: 9px;
            color: #374151;
            vertical-align: middle;
        }

        td.donor {
            font-weight: 600;
            color: #111418;
        }

        td.amount {
            font-weight: 700;
            color: #16a34a;
        }

        td.reference {
            font-family: 'DejaVu Sans Mono', 'Courier New', monospace;
            font-size: 8px;
            color: #6b7280;
        }

        /* Status badge */
        .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 20px;
            font-size: 8px;
            font-weight: 700;
        }

        .badge-valide {
            background: #dcfce7;
            color: #16a34a;
        }

        .badge-en_attente {
            background: #fef9c3;
            color: #a16207;
        }

        .badge-echoue {
            background: #fee2e2;
            color: #dc2626;
        }

        /* Total row */
        .total-row td {
            background: #111418 !important;
            color: #fff !important;
            font-weight: 700;
            font-size: 10px;
            padding: 9px 10px;
        }

        .total-row td.amount {
            color: #4ade80 !important;
        }

        /* Footer */
        .footer {
            margin-top: 20px;
            padding: 12px 24px;
            border-top: 1px solid #eaedf2;
            font-size: 8px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
        }

        /* Empty state */
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
            font-size: 11px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <div class="header-brand">
            <div class="header-title">RoundPay</div>
            <div class="header-subtitle">Rapport — Collectes libres &amp; Dons</div>
        </div>
        <div class="header-meta">
            <div>Généré le {{ $generated_at }}</div>
            <div style="margin-top:3px;">{{ $payments->count() }} versement(s) au total</div>
        </div>
    </div>

    <!-- Summary Bar -->
    <div class="summary-bar">
        <div class="summary-card green">
            <div class="summary-label">Montant total collecté</div>
            <div class="summary-value">{{ number_format($total, 2, ',', ' ') }}</div>
        </div>
        <div class="summary-card accent">
            <div class="summary-label">Nombre de dons</div>
            <div class="summary-value">{{ $payments->count() }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Don moyen</div>
            <div class="summary-value">
                {{ $payments->count() > 0 ? number_format($total / $payments->count(), 2, ',', ' ') : '0,00' }}
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Donateurs uniques</div>
            <div class="summary-value">
                {{ $payments->pluck('user_id')->filter()->merge($payments->pluck('nom_donateur_libre')->filter())->unique()->count() }}
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="table-container">
        @if($payments->isEmpty())
            <div class="empty-state">Aucun versement trouvé pour cette sélection.</div>
        @else
            <table>
                <thead>
                    <tr>
                        <th style="width:90px">Date</th>
                        <th style="width:140px">Donateur / Membre</th>
                        <th style="width:180px">Campagne / Fiche</th>
                        <th style="width:80px">Montant</th>
                        <th style="width:100px">Moyen</th>
                        <th>Référence</th>
                        <th style="width:65px">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($payments as $payment)
                        @php
                            $donor = match(true) {
                                (bool) $payment->is_anonymous => 'Anonyme',
                                (bool) $payment->nom_donateur_libre => $payment->nom_donateur_libre,
                                $payment->user !== null => $payment->user->name,
                                default => "Membre #{$payment->user_id}",
                            };
                            $providerLabels = [
                                'orange_money' => 'Orange Money',
                                'mpesa' => 'M-Pesa',
                                'airtel_money' => 'Airtel Money',
                                'mtn_momo' => 'MTN MoMo',
                                'wave' => 'Wave',
                                'cash_guichet' => 'Cash guichet',
                            ];
                            $provider = $providerLabels[$payment->mobile_provider?->value ?? ''] ?? $payment->mobile_provider?->value ?? '';
                        @endphp
                        <tr>
                            <td>{{ $payment->paid_at?->format('d/m/Y H:i') ?? '—' }}</td>
                            <td class="donor">{{ $donor }}</td>
                            <td>{{ $payment->fiche?->titre ?? '—' }}</td>
                            <td class="amount">{{ number_format((float) $payment->montant, 2, ',', ' ') }}</td>
                            <td>{{ $provider }}</td>
                            <td class="reference">{{ $payment->reference ?? '—' }}</td>
                            <td>
                                <span class="badge badge-{{ $payment->statut?->value ?? 'valide' }}">
                                    {{ match($payment->statut?->value) {
                                        'valide' => 'Validé',
                                        'en_attente' => 'En attente',
                                        'echoue' => 'Échoué',
                                        default => $payment->statut?->value ?? '—'
                                    } }}
                                </span>
                            </td>
                        </tr>
                    @endforeach

                    <!-- Total row -->
                    <tr class="total-row">
                        <td colspan="3" style="font-weight:700;">TOTAL</td>
                        <td class="amount">{{ number_format($total, 2, ',', ' ') }}</td>
                        <td colspan="3"></td>
                    </tr>
                </tbody>
            </table>
        @endif
    </div>

    <!-- Footer -->
    <div class="footer">
        <span>RoundPay — Rapport automatique généré par le système</span>
        <span>Confidentiel — Usage interne uniquement</span>
    </div>

</body>
</html>
