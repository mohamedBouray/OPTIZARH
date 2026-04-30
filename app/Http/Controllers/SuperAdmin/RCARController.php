<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\RcarType;
use App\Models\SuperAdmin\RcarDetail;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RcarController extends Controller
{
    public function getConfiguration($year) {
        $config = SalaryYear::where('year', $year)
            ->with(['rcarTypes' => function($query) {
                $query->select('id', 'salary_year_id', 'label', 'is_favorite');
            }, 'rcarTypes.details'])
            ->first();
        if (!$config) {
            return response()->json(['message' => 'Aucune configuration trouvée', 'rcar_types' => []], 200);
        }
        return response()->json($config);
    }

    public function saveConfiguration(Request $request) {
        $validated = $request->validate([
            'salary_year_id' => 'required|exists:salary_years,id',
            'types' => 'required|array',
            'types.*.label' => 'required|string',
            'types.*.details' => 'array',
        ]);

        return DB::transaction(function () use ($validated) {
            $salaryYear = SalaryYear::find($validated['salary_year_id']);
            $yearLabel = $salaryYear ? $salaryYear->year : 'N/A';
            
            RcarType::where('salary_year_id', $validated['salary_year_id'])->delete();

            foreach ($validated['types'] as $typeData) {
                $isFav = RcarType::whereRaw('LOWER(label) = ?', [strtolower($typeData['label'])])
                                ->where('is_favorite', true)
                                ->exists();

                $type = RcarType::create([
                    'salary_year_id' => $validated['salary_year_id'],
                    'label' => $typeData['label'],
                    'is_favorite' => $isFav
                ]);

                if (!empty($typeData['details'])) {
                    foreach ($typeData['details'] as $detail) {
                        RcarDetail::create([
                            'rcar_type_id' => $type->id,
                            'designation' => $detail['designation'] ?? $detail['name'] ?? '',
                            'plafond' => $detail['plafond'] ?? null,
                            'percentage' => $detail['percentage'] ?? 0,
                        ]);
                    }
                }
            }

            // LOG: Update Configuration
            $this->logActivity(
                'Configuration RCAR',
                'UPDATE',
                "Mise à jour de la configuration RCAR pour l'année {$yearLabel} avec " . count($validated['types']) . " type(s) enregistré(s)"
            );

            return response()->json(['message' => 'Paramétrage RCAR enregistré']);
        });
    }

    public function toggleFavorite(Request $request, $id) {
        return DB::transaction(function () use ($request, $id) {
            $sourceType = RcarType::with('details')->findOrFail($id);
            $isFavorite = $request->input('is_favorite');
            $sourceType->update(['is_favorite' => $isFavorite]);
            
            $status = $isFavorite ? "Ajout aux favoris" : "Retrait des favoris";

            if ($isFavorite) {
                $otherYears = SalaryYear::where('id', '!=', $sourceType->salary_year_id)->get();
                foreach ($otherYears as $year) {
                    $existing = RcarType::where('salary_year_id', $year->id)
                                        ->where('label', $sourceType->label)
                                        ->first();
                    if ($existing) {
                        $existing->delete();
                    }
                    $newType = RcarType::create([
                        'salary_year_id' => $year->id,
                        'label'          => $sourceType->label,
                        'is_favorite'    => true
                    ]);
                    foreach ($sourceType->details as $detail) {
                        RcarDetail::create([
                            'rcar_type_id' => $newType->id,
                            'designation'  => $detail->designation,
                            'plafond'      => $detail->plafond,
                            'percentage'   => $detail->percentage,
                        ]);
                    }
                }
            } else {
                RcarType::where('label', $sourceType->label)->update(['is_favorite' => false]);
            }

            $this->logActivity(
                'Favoris RCAR',
                'UPDATE',
                "{$status} pour le type '{$sourceType->label}' et propagation sur les autres années"
            );

            return response()->json(['message' => 'Configuration propagée avec succès']);
        });
    }

    public function deleteType($id) {
        $type = RcarType::find($id);
        if ($type) {
            $label = $type->label;
            $type->delete();

            $this->logActivity(
                'Configuration RCAR',
                'DELETE',
                "Suppression du type RCAR: '{$label}'"
            );
        }
        return response()->json(['message' => 'Type supprimé']);
    }

    public function deleteDetail($id) {
        $detail = RcarDetail::find($id);
        if ($detail) {
            $designation = $detail->designation;
            $detail->delete();
            $this->logActivity(
                'Configuration RCAR',
                'DELETE',
                "Suppression de la ligne RCAR: '{$designation}'"
            );
        }
        return response()->json(['message' => 'Ligne supprimée']);
    }
}