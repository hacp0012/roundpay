<?php

namespace App\Http\Controllers;

use App\Models\Depense;
use App\Support\ApiPresenter;
use App\Support\QuestAuth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DepenseDocumentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $staff = QuestAuth::requireStaff();
        $data = $request->validate([
            'titre' => ['required', 'string', 'max:255'],
            'montant' => ['required', 'numeric', 'min:0.01'],
            'categorie' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'preuve' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $depense = Depense::query()->create([
            'titre' => $data['titre'],
            'montant' => $data['montant'],
            'spent_at' => now()->toDateString(),
            'categorie' => $data['categorie'],
            'description' => $data['description'] ?? $data['titre'],
            'created_by_admin_id' => $staff->id,
        ]);

        if ($request->hasFile('preuve')) {
            $file = $request->file('preuve');
            $extension = strtolower($file->extension());
            $fileName = Str::uuid().'.'.$extension;
            $path = $file->storeAs('depenses/'.$depense->id, $fileName, 'local');

            if ($path === false) {
                $depense->delete();
                abort(500, 'Impossible de stocker le justificatif.');
            }

            $depense->forceFill([
                'preuve_ref' => basename($file->getClientOriginalName()),
                'preuve_path' => $path,
            ])->save();
        }

        return response()->json(ApiPresenter::depense($depense->load('createdBy')), 201);
    }

    public function download(Depense $depense): Response
    {
        QuestAuth::requireStaff();

        abort_unless(
            $depense->preuve_path && Storage::disk('local')->exists($depense->preuve_path),
            404,
        );

        return Storage::disk('local')->download(
            $depense->preuve_path,
            basename((string) $depense->preuve_ref),
        );
    }
}
