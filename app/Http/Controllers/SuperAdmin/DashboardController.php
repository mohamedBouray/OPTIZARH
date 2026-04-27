<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\Employee;
use App\Models\SuperAdmin\ParametrageRCAR;
use App\Models\SuperAdmin\Gestion_IR;
use App\Models\SuperAdmin\Credit;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function getStats()
    {
        try {
            $anneeActuelle = date('Y');
            $employees = Employee::where('statut', 'ACTIF')->get();
            $totalMasseSalariale = $employees->sum('salaire_base') ?: 0;
            $totalCreditsAmount = Credit::sum('max_amount') ?: 0; 
            $countCredits = Credit::count();
            $rcarConfig = ParametrageRCAR::where('annee', $anneeActuelle)->first();
            $totalRCAR = 0;
            $tauxRCAR_Display = 0;

            if ($rcarConfig) {
                $tauxRCAR_Display = $rcarConfig->salariale_rg_taux;
                foreach ($employees as $emp) {
                    $salaire = $emp->salaire_base;
                    $cotisationEmp = 0;

                    if ($rcarConfig->salariale_active) {
                        $baseRG = $rcarConfig->salariale_rg_plafond ? min($salaire, $rcarConfig->salariale_rg_plafond) : $salaire;
                        $cotisationEmp += $baseRG * ($rcarConfig->salariale_rg_taux / 100);
                        $baseRC = $rcarConfig->salariale_rc_plafond ? min($salaire, $rcarConfig->salariale_rc_plafond) : $salaire;
                        $cotisationEmp += $baseRC * ($rcarConfig->salariale_rc_taux / 100);
                    }
                    $totalRCAR += $cotisationEmp;
                }
            }

            // 4. Calcul IR DYNAMIQUE
            $irConfig = Gestion_IR::where('annee', $anneeActuelle)->first();
            $totalIR = 0;

            if ($irConfig && !empty($irConfig->data_rows)) {
                foreach ($employees as $emp) {
                    $salaireNetImposable = $emp->salaire_base; 
                    foreach ($irConfig->data_rows as $row) {
                        if ($salaireNetImposable >= $row['min'] && ($row['max'] == 0 || $salaireNetImposable <= $row['max'])) {
                            $totalIR += ($salaireNetImposable * ($row['taux'] / 100));
                            break;
                        }
                    }
                }
            }
            $cotisationStats = [
                ['name' => 'RCAR', 'taux' => (float)$tauxRCAR_Display],
                ['name' => 'IR', 'taux' => 15.0], 
            ];

            return response()->json([
                'cards' => [
                    [
                        'label' => 'Total Employés', 
                        'value' => (string) Employee::count()
                    ],
                    [
                        'label' => 'Employés actifs', 
                        'value' => (string) $employees->count()
                    ],
                    [
                        'label' => 'Masse Crédits', 
                        'value' => number_format($totalCreditsAmount, 0, '.', ' ') . ' DH'
                    ],
                    [
                        'label' => 'Demandes Crédit', 
                        'value' => (string) $countCredits
                    ],
                ],
                'charges' => [
                    'ir' => round($totalIR, 2),
                    'rcar' => round($totalRCAR, 2),
                    'masse_salariale' => round($totalMasseSalariale, 2)
                ],
                'cotisationStats' => $cotisationStats,
                'evolution' => [
                    ['name' => 'Jan', 'total' => $totalMasseSalariale * 0.9],
                    ['name' => 'Fév', 'total' => $totalMasseSalariale * 0.95],
                    ['name' => 'Mar', 'total' => $totalMasseSalariale],
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Dashboard Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}