<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\SalaryYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SntlSettingController extends Controller
{
    public function index(Request $request){
        $yearId = $request->query('year_id');
        if (!$yearId) {
            return response()->json(['error' => 'Le paramètre year_id est requis'], 400);
        }
        $configs = SntlSetting::where('salary_year_id', $yearId)->get();
        return response()->json($configs);
    }

    public function store(Request $request){
        $data = $request->validate([
            'salary_year_id' => 'required|exists:salary_years,id',
            'configs' => 'required|array',
            'configs.*.label' => 'required|string',
            'configs.*.valeur' => 'required|numeric',
            'configs.*.type_montant' => 'required|in:fixe,pourcentage',
            'configs.*.categorie_cible' => 'required|string',
            'configs.*.grade_id' => 'nullable|integer',
            'configs.*.echelle_id' => 'nullable|integer',
            'configs.*.echelon_id' => 'nullable|integer',
            'configs.*.is_active' => 'boolean',
        ]);
        
        try {
            DB::beginTransaction();
            $salaryYear = SalaryYear::find($data['salary_year_id']);
            $yearLabel = $salaryYear ? $salaryYear->year : 'N/A';
            SntlSetting::where('salary_year_id', $data['salary_year_id'])->delete();

            foreach ($data['configs'] as $conf) {
                SntlSetting::create([
                    'salary_year_id'  => $data['salary_year_id'],
                    'label'           => $conf['label'],
                    'valeur'          => $conf['valeur'],
                    'type_montant'    => $conf['type_montant'],
                    'categorie_cible' => $conf['categorie_cible'],
                    'grade_id'        => $conf['grade_id'] ?? null,
                    'echelle_id'      => $conf['echelle_id'] ?? null,
                    'echelon_id'      => $conf['echelon_id'] ?? null,
                    'is_active'       => $conf['is_active'] ?? true,
                ]);
            }

            $this->logActivity(
                'Paramètres SNTL',
                'UPDATE',
                "Mise à jour du paramétrage SNTL pour l'année {$yearLabel} avec " . count($data['configs']) . " configuration(s)"
            );

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Paramétrage SNTL enregistré avec succès pour l’année sélectionnée'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Une erreur est survenue lors de l’enregistrement',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id){
        $config = SntlSetting::find($id);
        if ($config) {
            $label = $config->label;
            $config->delete();

            $this->logActivity(
                'Paramètres SNTL',
                'DELETE',
                "Suppression de la configuration SNTL: '{$label}'"
            );
            return response()->json(['message' => 'Configuration supprimée avec succès']);
        }

        return response()->json(['message' => 'Configuration non trouvée'], 404);
    }

    public function getAvailableYears(){
        $years = SalaryYear::orderBy('year', 'desc')->get();
        return response()->json($years);
    }
}