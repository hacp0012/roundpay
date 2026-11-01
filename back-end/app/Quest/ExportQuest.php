<?php

namespace App\Quest;

use App\Enums\FicheType;
use App\Enums\PaymentStatus;
use App\Models\Fiche;
use App\Models\Payment;
use App\Support\QuestAuth;
use Barryvdh\DomPDF\Facade\Pdf;
use Hacp0012\Quest\Attributs\QuestSpaw;
use Hacp0012\Quest\SpawMethod;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Response;

class ExportQuest
{
    /**
     * Export les collectes libres & dons en PDF ou CSV.
     * Accessible uniquement aux staff (admin/manager).
     */
    #[QuestSpaw(ref: 'export.collectes', method: SpawMethod::GET)]
    public function exportCollectes(
        string $format = 'csv',
        ?string $fiche_id = null,
        ?string $date_from = null,
        ?string $date_to = null,
    ): Response {
        QuestAuth::requireStaff();

        // Collect only "libre" fiche IDs
        $libreIds = Fiche::query()
            ->where('type', FicheType::Libre)
            ->pluck('id');

        $query = Payment::query()
            ->with(['fiche', 'user'])
            ->whereIn('fiche_id', $libreIds)
            ->where('statut', PaymentStatus::Valide)
            ->orderByDesc('paid_at');

        if ($fiche_id) {
            $query->where('fiche_id', $fiche_id);
        }

        if ($date_from) {
            $query->whereDate('paid_at', '>=', $date_from);
        }

        if ($date_to) {
            $query->whereDate('paid_at', '<=', $date_to);
        }

        $payments = $query->get();

        $filename = 'collectes_dons_'.now()->format('Y-m-d');

        if ($format === 'pdf') {
            return $this->exportAsPdf($payments, $filename);
        }

        return $this->exportAsCsv($payments, $filename);
    }

    /**
     * Export les fiches de cotisation (obligatoires) en PDF ou CSV.
     */
    #[QuestSpaw(ref: 'export.fiches', method: SpawMethod::GET)]
    public function exportFiches(
        string $format = 'csv',
        ?string $fiche_id = null,
    ): Response {
        QuestAuth::requireStaff();

        $query = Payment::query()
            ->with(['fiche', 'user'])
            ->whereHas('fiche', fn ($q) => $q->where('type', FicheType::Obligatoire))
            ->where('statut', PaymentStatus::Valide)
            ->orderByDesc('paid_at');

        if ($fiche_id) {
            $query->where('fiche_id', $fiche_id);
        }

        $payments = $query->get();

        $filename = 'versements_cotisations_'.now()->format('Y-m-d');

        if ($format === 'pdf') {
            return $this->exportAsPdf($payments, $filename);
        }

        return $this->exportAsCsv($payments, $filename);
    }

    /** @param Collection<int, Payment> $payments */
    private function exportAsPdf(Collection $payments, string $filename): Response
    {
        $total = $payments->sum('montant');
        $generatedAt = now()->format('d/m/Y H:i');

        $html = view('exports.payments_pdf', [
            'payments' => $payments,
            'total' => $total,
            'generated_at' => $generatedAt,
            'filename' => $filename,
        ])->render();

        $pdf = Pdf::loadHtml($html)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => false,
                'dpi' => 150,
            ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.pdf"',
            'Cache-Control' => 'no-cache',
        ]);
    }

    /** @param Collection<int, Payment> $payments */
    private function exportAsCsv(Collection $payments, string $filename): Response
    {
        $rows = [];

        // BOM UTF-8 for Excel compatibility
        $rows[] = "\xEF\xBB\xBF";

        // Header
        $rows[] = implode(';', [
            'Date',
            'Donateur / Membre',
            'Campagne / Fiche',
            'Montant',
            'Moyen de paiement',
            'Référence',
            'Note',
            'Statut',
        ]);

        foreach ($payments as $payment) {
            $donor = match (true) {
                (bool) $payment->is_anonymous => 'Anonyme',
                (bool) $payment->nom_donateur_libre => $payment->nom_donateur_libre,
                $payment->user !== null => $payment->user->name,
                default => "Membre #{$payment->user_id}",
            };

            $rows[] = implode(';', [
                $payment->paid_at?->format('Y-m-d H:i') ?? '',
                $this->escapeCsv($donor),
                $this->escapeCsv($payment->fiche?->titre ?? ''),
                number_format((float) $payment->montant, 2, ',', ''),
                $this->escapeCsv($payment->mobile_provider?->value ?? ''),
                $this->escapeCsv($payment->reference ?? ''),
                $this->escapeCsv($payment->note ?? ''),
                $payment->statut?->value ?? '',
            ]);
        }

        // Totals row
        $total = $payments->sum('montant');
        $rows[] = implode(';', [
            '',
            'TOTAL',
            '',
            number_format((float) $total, 2, ',', ''),
            '',
            '',
            '',
            '',
        ]);

        $content = implode("\n", $rows);

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'.csv"',
            'Cache-Control' => 'no-cache',
        ]);
    }

    private function escapeCsv(string $value): string
    {
        // Escape values that contain semicolons, quotes, or newlines
        if (str_contains($value, ';') || str_contains($value, '"') || str_contains($value, "\n")) {
            return '"'.str_replace('"', '""', $value).'"';
        }

        return $value;
    }
}
