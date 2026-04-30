<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Organisme;
use Illuminate\Http\Request;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Support\Facades\DB;
use App\Models\SuperAdmin\Cotisation;

class CotisationController extends Controller
{
    public function store(Request $request){
        $request->validate([
            'year' => 'required',
            'organismes' => 'required|array',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                Organisme::where('annee', $request->year)->delete();
                
                foreach ($request->organismes as $orgData) {
                    $organisme = Organisme::create([
                        'nom'   => $orgData['name'] ?? 'Sans Nom', 
                        'is_favorite' => $orgData['is_favorite'] ?? false,
                        'annee' => $request->year,
                    ]);

                    if (isset($orgData['rubriques']) && is_array($orgData['rubriques'])) {
                        foreach ($orgData['rubriques'] as $cot) {
                            $organisme->cotisations()->create([
                                'type'    => $cot['type'] ?? 'Social',
                                'name'    => $cot['label'] ?? $cot['name'] ?? 'Sans Désignation', 
                                'taux'    => (isset($cot['taux']) && $cot['taux'] !== '') ? $cot['taux'] : 0,
                                'plafond' => (isset($cot['plafond']) && $cot['plafond'] !== '') ? $cot['plafond'] : null,
                            ]);
                        }
                    }
                }

                $this->logActivity(
                    'Gestion Cotisations',
                    'UPDATE',
                    "Mise à jour globale des organismes et rubriques pour l'année {$request->year}"
                );

                return response()->json(['message' => 'Success'], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request){
        $year = $request->query('year');
        $organismes = Organisme::with('cotisations')->where('annee', $year)->get();

        $formatted = $organismes->map(function ($org) {
            return [
                'id' => $org->id,
                'name' => $org->nom,
                'is_favorite' => (bool)$org->is_favorite,
                'rubriques' => $org->cotisations->map(function ($cot) {
                    return [
                        'id' => $cot->id,
                        'label' => $cot->name,
                        'type' => $cot->type,
                        'taux' => $cot['taux'],
                        'plafond' => $cot['plafond'],
                    ];
                })
            ];
        });

        return response()->json($formatted);
    }

    public function destroyOrganisme($id) {
        $org = Organisme::findOrFail($id);
        $name = $org->nom;
        $year = $org->annee;
        $org->delete();

        $this->logActivity(
            'Suppression Organisme',
            'DELETE',
            "Suppression de l'organisme '{$name}' (Année: {$year})"
        );

        return response()->json(['message' => 'Organisme supprimé']);
    }

    public function destroyRubrique($id) {
        $cot = Cotisation::findOrFail($id);
        $name = $cot->name;
        $cot->delete();

        $this->logActivity(
            'Suppression Rubrique',
            'DELETE',
            "Suppression de la rubrique '{$name}'"
        );

        return response()->json(['message' => 'Rubrique supprimée']);
    }

    public function toggleFavorite(Request $request, $id){
        return DB::transaction(function () use ($request, $id) {
            $sourceOrg = Organisme::with('cotisations')->find($id);

            if (!$sourceOrg) {
                $sourceOrg = Organisme::with('cotisations')
                    ->where('nom', $request->input('name'))
                    ->where('annee', $request->input('year'))
                    ->first();
            }
            if (!$sourceOrg) {
                return response()->json(['error' => 'Organisme introuvable.'], 404);
            }

            $isFavorite = (bool) $request->input('is_favorite');
            $statusText = $isFavorite ? 'Activé' : 'Désactivé';
            $sourceOrg->update(['is_favorite' => $isFavorite]);

            if ($isFavorite) {
                $allYears = SalaryYear::pluck('year')->toArray();

                foreach ($allYears as $yearValue) {
                    if ($yearValue == $sourceOrg->annee) continue;
                    Organisme::where('annee', $yearValue)
                        ->where('nom', $sourceOrg->nom)
                        ->delete();

                    $newOrg = Organisme::create([
                        'annee'       => $yearValue,
                        'nom'         => $sourceOrg->nom,
                        'is_favorite' => true
                    ]);
                    foreach ($sourceOrg->cotisations as $cot) {
                        $newOrg->cotisations()->create([
                            'name'    => $cot->name,
                            'type'    => $cot->type,
                            'taux'    => $cot->taux,
                            'plafond' => $cot->plafond,
                        ]);
                    }
                }
            } else {
                Organisme::where('nom', $sourceOrg->nom)
                    ->update(['is_favorite' => false]);
            }

            $this->logActivity(
                'Favoris Organisme',
                'UPDATE',
                "Statut favori {$statusText} pour l'organisme '{$sourceOrg->nom}' et propagation"
            );

            return response()->json([
                'status' => 'success', 
                'message' => $isFavorite ? 'Propagé avec succès' : 'Statut favori retiré'
            ]);
        });
    }
}