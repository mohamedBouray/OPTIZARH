<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SuperAdmin\RetraiteSetting;
use Illuminate\Http\Request;

class RetraiteController extends Controller
{
    public function getSettings($year) {
        $settings = RetraiteSetting::where('year', $year)->first();
        if (!$settings) {
            return response()->json([
                'year' => $year,
                'age_legal' => 60,
                'duree_max' => 0,
                'nb_fois' => 0
            ]);
        }
        return response()->json($settings);
    }

    public function storeOrUpdate(Request $request) {
        $validated = $request->validate([
            'year' => 'required|integer',
            'age_legal' => 'required|integer',
            'duree_max' => 'required|integer',
            'nb_fois' => 'required|integer',
        ]);

        $exists = RetraiteSetting::where('year', $validated['year'])->exists();
        $actionType = $exists ? 'UPDATE' : 'CREATE';
        $actionText = $exists ? 'Mise à jour' : 'Configuration';

        $settings = RetraiteSetting::updateOrCreate(
            ['year' => $validated['year']], 
            $validated                      
        );

        $this->logActivity(
            'Paramètres Retraite',
            $actionType,
            "{$actionText} des paramètres de retraite pour l'année {$validated['year']} (Âge: {$validated['age_legal']}, Durée max: {$validated['duree_max']})"
        );

        return response()->json([
            'message' => 'Paramètres enregistrés avec succès',
            'data' => $settings
        ], 200);
    }
}