<?php
namespace App\Http\Controllers\SuperAdmin;

use Illuminate\Http\Request;
use App\Models\SuperAdmin\Employee;
<<<<<<< HEAD
use App\Models\Auth\User;
=======
>>>>>>> bouray/main
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
<<<<<<< HEAD
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
=======
use App\Models\Auth\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
>>>>>>> bouray/main

class EmployeeController extends Controller
{
            private function generateSecurePassword($length = 10)
    {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return substr(str_shuffle($chars), 0, $length);
    }

    // 📧 Envoyer email avec identifiants (ajoute cette méthode)
    private function sendCredentialsEmail($employee, $plainPassword, $isUpdate = false)
    {
        try {
            $subject = $isUpdate 
                ? '🔐 Vos identifiants ont été mis à jour - Portail RH'
                : '🎉 Bienvenue - Vos identifiants de connexion';

            Mail::send('emails.employee_credentials', [
                'name'      => $employee->prenom . ' ' . $employee->nom,
                'email'     => $employee->email,
                'password'  => $plainPassword,
                'loginUrl'  => url('/auth/login'),
                'year'      => date('Y'),
                'isUpdate'  => $isUpdate
            ], function ($message) use ($employee, $subject) {
                $message->to($employee->email)
                        ->subject($subject);
            });

            $employee->update([
                'temp_password' => $plainPassword,
                'credentials_sent_at' => now()
            ]);

            Log::info("Email sent to: " . $employee->email);
            return true;

        } catch (\Exception $e) {
            Log::error("Failed to send email: " . $e->getMessage());
            return false;
        }
    }

    public function getAnnees()
    {
        try {
            $annees = SalaryYear::orderBy('year', 'desc')->get();
            
            $this->logActivity(
                'Consultation années',
                'READ',
                'Récupération de la liste des années'
            );
            
            return response()->json($annees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getClassification(Request $request)
    {
        $anneeId = $request->annee_id;
        $year = $request->year;
        
        try {
            if ($anneeId) {
                $data = SalaryYear::with(['Post.grades.echelles.echelons'])->find($anneeId);
            } elseif ($year) {
                $data = SalaryYear::with(['Post.grades.echelles.echelons'])
                    ->where('year', $year)
                    ->first();
            } else {
                return response()->json(['error' => 'annee_id or year required'], 400);
            }
            
            $this->logActivity(
                'Consultation classification',
                'READ',
                'Récupération de la classification pour ' . ($year ?? $anneeId)
            );
            
            return response()->json($data ?? ['Post' => []]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
<<<<<<< HEAD

=======
>>>>>>> bouray/main
    public function index(Request $request)
    {
        try {
            $query = Employee::query();

            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('prenom', 'like', "%$search%")
                        ->orWhere('nom', 'like', "%$search%")
                        ->orWhere('email', 'like', "%$search%");
                });
            }

            if ($request->filled('statut') && $request->statut !== 'Tous') {
                $query->where('statut', $request->statut);
            }

<<<<<<< HEAD
            $employees = $query->select([
                'employees.*',
                'credit_type_id',
                'montant_credit',
                'taux_credit',
                'credit_duree',
                'credit_date_debut',
                'credit_date_fin',
                'credit_mensualite',
                'credit_reste_a_payer'
            ])->orderBy('created_at', 'desc')->paginate(10);
            
            $this->logActivity(
                'Consultation employés',
                'READ',
                'Affichage de la liste des employés (Page ' . ($request->page ?? 1) . ')'
            );
=======
            $employees = $query->with(['post', 'gradeRel', 'echelleRel', 'echelonRel'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);
            
            $employees->getCollection()->transform(function ($employee) {
                $employee->date_naissance = $employee->date_naissance ? date('Y-m-d', strtotime($employee->date_naissance)) : null;
                $employee->date_embauche = $employee->date_embauche ? date('Y-m-d', strtotime($employee->date_embauche)) : null;
                return $employee;
            });
>>>>>>> bouray/main
            
            return response()->json($employees);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

        public function store(Request $request)
    {
        try {
            // 1. Validation (Zdna email unique f table users w l-champs jdad)
            $validated = $request->validate([
                'prenom' => 'required|string|max:255',
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6',
                'role' => 'required|string|in:employee,rh,admin,superadmin', 
                'telephone' => 'nullable|string|max:20',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string',
                'situation_familiale' => 'nullable|string',
                'nombre_enfants' => 'nullable|integer|min:0|max:20',
                'departement' => 'nullable|string',
                'date_embauche' => 'nullable|date',
                'type_contrat' => 'nullable|string',
                'annee_id' => 'required|exists:salary_years,id',
                'Post_id' => 'nullable|exists:Post,id',
                'grade_id' => 'nullable|exists:grades,id',
                'echelle_id' => 'nullable|exists:echelles,id',
                'echelon_id' => 'nullable|exists:echelons,id',
                'grade' => 'nullable|string',
                'echelle' => 'nullable|string',
                'echelon' => 'nullable|string',  
                'salaire' => 'nullable|numeric|min:0',
                'indice' => 'nullable|numeric|min:0',
                'statut' => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_id' => 'nullable|integer',
                'credits' => 'nullable|array',
            ]);

            if (empty($request->cotisation_id)) {
                $defaultOrganisme = DB::table('organisme')->where('is_default', 1)->first();
                if ($defaultOrganisme) {
                    $request->merge(['cotisation_id' => $defaultOrganisme->id]);
                }
            }

            // 🔥 Générer mot de passe si non fourni ou utiliser celui du formulaire
            $plainPassword = $request->filled('password') ? $request->password : $this->generateSecurePassword();

            $employee = DB::transaction(function () use ($validated, $plainPassword, $request) {
                $user = User::create([
                    'full_name' => $validated['prenom'] . ' ' . $validated['nom'],
                    'email' => $validated['email'],
                    'password' => Hash::make($plainPassword),
                    'role' => $request->role,
                    'company_name' => null,
                    'sector' => null,
                    'must_change_password' => true
                ]);

                // 3. Traitement des calculs (Kima derti)
                if (isset($validated['echelon'])) {
                    $validated['echelon'] = (string) $validated['echelon'];
                }

                $validated['user_id'] = $user->id;
                $validated['temp_password'] = $plainPassword;
                $employee = Employee::create($validated);
                
                // Ajouter les crédits si présents
                if ($request->has('credits') && is_array($request->credits)) {
                    foreach ($request->credits as $creditData) {
                        $cleanCreditData = [
                            'credit_type_id' => $creditData['credit_type_id'] ?? null,
                            'montant_credit' => $creditData['montant_credit'] ?? 0,
                            'taux_credit' => $creditData['taux_credit'] ?? 0,
                            'credit_duree' => $creditData['credit_duree'] ?? 0,
                            'credit_date_debut' => $creditData['credit_date_debut'] ?? null,
                            'credit_date_fin' => $creditData['credit_date_fin'] ?? null,
                            'credit_mensualite' => $creditData['credit_mensualite'] ?? 0,
                            'credit_reste_a_payer' => $creditData['credit_reste_a_payer'] ?? ($creditData['montant_credit'] ?? 0),
                            'statut' => 'ACTIF',
                            'employee_id' => $employee->id
                        ];
                        
                        if ($cleanCreditData['credit_mensualite'] <= 0 && 
                            $cleanCreditData['montant_credit'] > 0 && 
                            $cleanCreditData['credit_duree'] > 0) {
                            $cleanCreditData['credit_mensualite'] = $this->calculerMensualiteCredit(
                                $cleanCreditData['montant_credit'],
                                $cleanCreditData['taux_credit'],
                                $cleanCreditData['credit_duree']
                            );
                        }
                        
                        if (!$cleanCreditData['credit_date_fin'] && $cleanCreditData['credit_date_debut'] && $cleanCreditData['credit_duree']) {
                            $dateDebut = new \DateTime($cleanCreditData['credit_date_debut']);
                            $dateFin = clone $dateDebut;
                            $dateFin->modify('+' . $cleanCreditData['credit_duree'] . ' months');
                            $cleanCreditData['credit_date_fin'] = $dateFin->format('Y-m-d');
                        }
                        
                        EmployeeCredit::create($cleanCreditData);
                    }
                }

                if (isset($validated['credit_date_debut'], $validated['credit_duree']) && !isset($validated['credit_date_fin'])) {
                    $dateFin = (new \DateTime($validated['credit_date_debut']))->modify('+' . $validated['credit_duree'] . ' months');
                    $validated['credit_date_fin'] = $dateFin->format('Y-m-d');
                }

                // 4. Création de l'employé lié au User ID
                $validated['user_id'] = $user->id; // Hna katrebet-hom
                return Employee::create($validated);
            });

            // 🔥 ENVOYER L'EMAIL SI L'UTILISATEUR LE DEMANDE ou par défaut pour les employés
            $sendEmail = $request->boolean('send_credentials_email', true);
            if ($sendEmail && ($employee->role === 'employee' || $employee->role === 'rh')) {
                $this->sendCredentialsEmail($employee, $plainPassword, false);
            }

            $this->logActivity('Ajout employé', 'CREATE', "Ajout de l'employé : {$employee->prenom} {$employee->nom}");
            
            $message = $sendEmail ? 'Employé ajouté avec succès. Identifiants envoyés par email.' : 'Employé ajouté avec succès.';
            return response()->json(['message' => $message, 'employee' => $employee], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity('Ajout employé', 'ERROR', "Erreur: " . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

>>>>>>> bouray/main
    public function show($id)
    {
        try {
            $employee = Employee::find($id);
            if (!$employee) {
                return response()->json(['message' => 'Employé non trouvé'], 404);
            }
            
            $this->logActivity(
                'Consultation employé',
                'READ',
                "Consultation de l'employé : {$employee->prenom} {$employee->nom}"
            );
            
            return response()->json($employee);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $employee = Employee::find($id);
            if (!$employee) {
                return response()->json(['message' => 'Employé non trouvé'], 404);
            }

            $oldData = "{$employee->prenom} {$employee->nom}";

            $rules = [
                'prenom' => 'sometimes|string|max:255',
                'nom' => 'sometimes|string|max:255',
                'telephone' => 'nullable|string|max:20',
                'date_naissance' => 'nullable|date',
                'adresse' => 'nullable|string|max:500',
                'situation_familiale' => 'nullable|string|max:50',
                'nombre_enfants' => 'nullable|integer|min:0|max:20',
<<<<<<< HEAD
                'departement' => 'nullable|string|max:100',
                'date_embauche' => 'nullable|date',
                
                'type_contrat' => 'nullable|string|max:50',
=======
                // 'departement' => 'nullable|string|max:100',
                'date_embauche' => 'nullable|date',
                // 'type_contrat' => 'nullable|string|max:50',
>>>>>>> bouray/main
                'annee_id' => 'sometimes|exists:salary_years,id',
                'Post_id' => 'nullable|exists:Post,id',
                'grade_id' => 'nullable|exists:grades,id',
                'echelle_id' => 'nullable|exists:echelles,id',
                'echelon_id' => 'nullable|exists:echelons,id',
                'grade' => 'nullable|string|max:255',
                'echelle' => 'nullable|string|max:50',
                'echelon' => 'nullable|string|max:50',
                'salaire' => 'nullable|numeric|min:0',
                'indice' => 'nullable|numeric|min:0',
                'statut' => 'nullable|string|in:ACTIF,CONGÉ,DÉPART',
                'cotisation_type' => 'nullable|string',
                'cotisation_id' => 'nullable|integer',
                'role' => 'required|string|in:employee,rh,admin,superadmin', 
            ];
            
            if (empty($request->cotisation_id)) {
                $defaultOrganisme = DB::table('organisme')->where('is_default', 1)->first();
                if ($defaultOrganisme) {
                    $request->merge(['cotisation_id' => $defaultOrganisme->id]);
                }
            }
            
            if ($request->has('email') && $request->email !== $employee->email) {
                $rules['email'] = 'required|email|unique:employees,email';
            }
            
            $request->validate($rules);
            
            $data = $request->all();
<<<<<<< HEAD
            
            $employee->update($data);
            
            // 🔥 Vérifier si on doit régénérer le mot de passe
            $passwordRegenerated = false;
            $newPassword = null;
            
            if ($request->boolean('regenerate_password')) {
                $newPassword = $this->generateSecurePassword();
                $user = User::find($employee->user_id);
                if ($user) {
                    $user->password = Hash::make($newPassword);
                    $user->must_change_password = true;
                    $user->save();
                }
                $employee->update(['temp_password' => $newPassword]);
                $passwordRegenerated = true;
            } elseif ($request->filled('password')) {
                // Mettre à jour le mot de passe si fourni manuellement
                $user = User::find($employee->user_id);
                if ($user) {
                    $user->password = Hash::make($request->password);
                    $user->save();
                }
                $employee->update(['temp_password' => $request->password]);
            }
            
            // Recalculer la date de fin si nécessaire
            if ((isset($data['credit_date_debut']) || isset($data['credit_duree'])) && !isset($data['credit_date_fin'])) {
                $dateDebut = $data['credit_date_debut'] ?? $employee->credit_date_debut;
                $duree = $data['credit_duree'] ?? $employee->credit_duree;
                
                if ($dateDebut && $duree) {
                    $dateDebutObj = new \DateTime($dateDebut);
                    $dateFin = clone $dateDebutObj;
                    $dateFin->modify('+' . $duree . ' months');
                    $data['credit_date_fin'] = $dateFin->format('Y-m-d');
                }
            }
            
            $employee->update($data);
            
            // 🔥 Si mot de passe régénéré, envoyer email
            if ($passwordRegenerated && $request->boolean('send_email', true)) {
                $this->sendCredentialsEmail($employee, $newPassword, true);
            }
            
            $this->logActivity('Modification employé', 'UPDATE', "Modification de l'employé : {$oldData} → {$employee->prenom} {$employee->nom}");
            
            // Retourner l'employé avec ses crédits et salaire
            $employee->load('credits');
            $salary = EmployeeSalary::where('employee_id', $employee->id)
                ->orderBy('year', 'desc')
                ->first();
            
            $responseMessage = $passwordRegenerated 
                ? 'Employé modifié avec succès. Nouveaux identifiants envoyés par email.'
                : 'Employé modifié avec succès.';
            
            return response()->json([
                'message' => $responseMessage,
                'employee' => $employee,
                'salary_details' => $salary ? [
                    'base_salary' => $salary->base_salary,
                    'indemnites' => [
                        'total' => $salary->indemnites_total,
                        'details' => $salary->indemnites_details ?? []
                    ],
                    'brut_salary' => $salary->brut_salary,
                    'cotisations' => [
                        'total' => $salary->cotisations_total,
                        'details' => $salary->cotisations_details ?? []
                    ],
                    'rcar' => [
                        'total' => $salary->rcar_total,
                        'details' => $salary->rcar_details ?? []
                    ],
                    'ir' => [
                        'total' => $salary->ir_total,
                        'taux' => $salary->ir_taux ?? 0
                    ],
                    'sntl' => [
                        'total' => $salary->sntl_total,
                        'details' => $salary->sntl_details ?? []
                    ],
                    'assurances' => [
                        'salarie' => $salary->assurances_salarie,
                        'details' => $salary->assurances_details ?? []
                    ],
                    'credits' => [
                        'total' => $salary->credits_total,
                        'details' => $salary->credits_details ?? []
                    ],
                    'total_deductions' => $salary->total_deductions,
                    'net_salary' => $salary->net_salary
                ] : null,
                'year' => $salary->year ?? date('Y')
            ]);
            
            return response()->json($employee);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->logActivity(
                'Modification employé',
                'ERROR',
                "Erreur lors de la modification: " . $e->getMessage()
            );
            return response()->json(['message' => 'Erreur lors de la modification: ' . $e->getMessage()], 500);
        }
    }

<<<<<<< HEAD
 public function destroy($id)
=======
   public function destroy($id)
>>>>>>> bouray/main
{
    try {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json(['message' => 'Employé non trouvé'], 404);
        }

        $employeeName = "{$employee->prenom} {$employee->nom}";
        $userId = $employee->user_id; // N-khbiw l-ID dyal user qbel mad-delete employee

        DB::transaction(function () use ($employee, $userId) {
            // 1. N-ms-hou l-employé (hadi lowla)
            $employee->delete();

            // 2. N-ms-hou l-user dyalou (ila kan m-lié)
            if ($userId) {
                User::where('id', $userId)->delete();
            }
        });

        $this->logActivity('Suppression employé', 'DELETE', "Suppression de: {$employeeName}");

        return response()->json(['message' => 'Supprimé avec succès']);

    } catch (\Exception $e) {
        // Had l-ligne ghadi t-goul lik f-logs chno wqe3 b-debt
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
    public function stats(Request $request)
    {
        try {
            $query = Employee::query();
            
            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }
            
            $total = $query->count();
            $actifs = $query->clone()->where('statut', 'ACTIF')->count();
            $conge = $query->clone()->where('statut', 'CONGÉ')->count();
            $departs = $query->clone()->where('statut', 'DÉPART')->count();
            
            $this->logActivity(
                'Statistiques employés',
                'READ',
                'Consultation des statistiques employés'
            );
            
            return response()->json([
                'total' => $total,
                'actifs' => $actifs,
                'conge' => $conge,
                'departs' => $departs
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function exportPDF(Request $request)
    {
        try {
            $query = Employee::query();
            
            if ($request->filled('annee_id')) {
                $query->where('annee_id', $request->annee_id);
            }
            
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('prenom', 'like', "%$search%")
                    ->orWhere('nom', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
                });
            }
            
            if ($request->filled('statut') && $request->statut !== 'Tous') {
                $query->where('statut', $request->statut);
            }
            
            $employees = $query->orderBy('nom', 'asc')->get();
            $anneeName = $request->annee_id ? SalaryYear::find($request->annee_id)?->year : 'Toutes';
            
            $actifs = $employees->where('statut', 'ACTIF')->count();
            $conges = $employees->where('statut', 'CONGÉ')->count();
            $departs = $employees->where('statut', 'DÉPART')->count();
            $totalSalaires = $employees->sum('salaire');
            
            $gradesSummary = $employees->groupBy('grade')->map(function($group, $grade) {
                return [
                    'name' => $grade ?: 'Non spécifié',
                    'count' => $group->count(),
                    'total' => $group->sum('salaire')
                ];
            })->values()->toArray();
            
            $pdf = Pdf::loadView('pdf.employees', [
                'employees' => $employees,
                'date' => now()->format('d/m/Y H:i'),
                'annee' => $anneeName,
                'total' => $employees->count(),
                'actifs' => $actifs,
                'conges' => $conges,
                'departs' => $departs,
                'totalSalaires' => $totalSalaires,
                'gradesSummary' => $gradesSummary,
                'gradesCount' => count($gradesSummary)
            ]);
            
            $pdf->setPaper('a4', 'landscape');
            
            $this->logActivity(
                'Export PDF employés',
                'EXPORT',
                "Export PDF de la liste des employés - " . ($anneeName !== 'Toutes' ? "Année {$anneeName}" : "Toutes années")
            );
            
            return $pdf->download('employes_' . now()->format('Ymd_His') . '.pdf');
            
        } catch (\Exception $e) {
            $this->logActivity(
                'Export PDF employés',
                'ERROR',
                "Erreur lors de l'export PDF: " . $e->getMessage()
            );
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function checkEmail(Request $request)
    {
        try {
            $email = $request->email;
            $id = $request->id;
            
            $exists = Employee::where('email', $email)
                ->when($id, function($q) use ($id) {
                    $q->where('id', '!=', $id);
                })
                ->exists();
            
            return response()->json(['exists' => $exists]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }


public function getCredits($employeeId)
{
    try {
        $employee = Employee::findOrFail($employeeId);
        $credits = $employee->credits()->with('creditType')->get();
        
        return response()->json($credits);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

/**
 * Ajouter un crédit à un employé
 */
public function addCredit(Request $request, $employeeId)
{
    try {
        $validated = $request->validate([
            'credit_type_id' => 'nullable|exists:credit_types,id',
            'montant_credit' => 'required|numeric|min:1',
            'taux_credit' => 'required|numeric|min:0|max:100',
            'credit_duree' => 'required|integer|min:1|max:360',
            'credit_date_debut' => 'nullable|date',
            'credit_date_fin' => 'nullable|date',
            'credit_mensualite' => 'nullable|numeric',
            'credit_reste_a_payer' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);
        
<<<<<<< HEAD
        // Calculer la mensualité si non fournie
=======
>>>>>>> bouray/main
        if (!isset($validated['credit_mensualite']) || $validated['credit_mensualite'] == 0) {
            $validated['credit_mensualite'] = $this->calculerMensualiteCredit(
                $validated['montant_credit'],
                $validated['taux_credit'],
                $validated['credit_duree']
            );
        }
        
<<<<<<< HEAD
        // Calculer la date de fin si non fournie
=======
>>>>>>> bouray/main
        if (!isset($validated['credit_date_fin']) && isset($validated['credit_date_debut'])) {
            $dateDebut = new \DateTime($validated['credit_date_debut']);
            $dateFin = clone $dateDebut;
            $dateFin->modify('+' . $validated['credit_duree'] . ' months');
            $validated['credit_date_fin'] = $dateFin->format('Y-m-d');
        }
        
<<<<<<< HEAD
        // Initialiser le reste à payer
=======

>>>>>>> bouray/main
        if (!isset($validated['credit_reste_a_payer'])) {
            $validated['credit_reste_a_payer'] = $validated['montant_credit'];
        }
        
        $validated['employee_id'] = $employeeId;
        $validated['statut'] = 'ACTIF';
        
        $credit = EmployeeCredit::create($validated);
        
        $this->logActivity(
            'Ajout crédit employé',
            'CREATE',
            "Ajout d'un crédit à l'employé ID: {$employeeId} (Montant: {$validated['montant_credit']} MAD)"
        );
        
        return response()->json($credit->load('creditType'), 201);
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Mettre à jour un crédit
 */
public function updateCredit(Request $request, $creditId)
{
    try {
        $credit = EmployeeCredit::findOrFail($creditId);
        
        $validated = $request->validate([
            'montant_credit' => 'sometimes|numeric|min:1',
            'taux_credit' => 'sometimes|numeric|min:0|max:100',
            'credit_duree' => 'sometimes|integer|min:1|max:360',
            'credit_date_debut' => 'nullable|date',
            'credit_date_fin' => 'nullable|date',
            'credit_mensualite' => 'nullable|numeric',
            'credit_reste_a_payer' => 'nullable|numeric',
            'statut' => 'sometimes|in:ACTIF,REMBOURSE,ANNULE',
            'description' => 'nullable|string'
        ]);
        
        $credit->update($validated);
        
        $this->logActivity(
            'Modification crédit employé',
            'UPDATE',
            "Modification du crédit ID: {$creditId}"
        );
        
        return response()->json($credit->load('creditType'));
        
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Supprimer un crédit
 */
public function deleteCredit($creditId)
{
    try {
        $credit = EmployeeCredit::findOrFail($creditId);
        $credit->delete();
        
        $this->logActivity(
            'Suppression crédit employé',
            'DELETE',
            "Suppression du crédit ID: {$creditId}"
        );
        
        return response()->json(['message' => 'Crédit supprimé avec succès']);
        
    } catch (\Exception $e) {
        return response()->json(['message' => $e->getMessage()], 500);
    }
}

/**
 * Calculer la mensualité d'un crédit
 */
private function calculerMensualiteCredit($montant, $tauxAnnuel, $dureeMois)
{
    $montant = (float) $montant;
    $tauxAnnuel = (float) $tauxAnnuel;
    $dureeMois = (int) $dureeMois;
    
    if ($montant <= 0 || $dureeMois <= 0) {
        return 0;
    }
    
    $tauxMensuel = ($tauxAnnuel / 100) / 12;
    
    if ($tauxMensuel == 0) {
        return round($montant / $dureeMois, 2);
    }

    private function fetchSntlConfig($year)
    {
        $salaryYear = \App\Models\SuperAdmin\SalaryYear::where('year', $year)->first();
        if (!$salaryYear) {
            return collect([]);
        }
        return \App\Models\SuperAdmin\SntlSetting::where('salary_year_id', $salaryYear->id)->get();
    }

    private function fetchAssurancesConfig($year)
    {
        $salaryYear = \App\Models\SuperAdmin\SalaryYear::where('year', $year)->first();
        if (!$salaryYear) {
            return collect([]);
        }
        return \App\Models\SuperAdmin\Assurance::where('annee_id', $salaryYear->id)->get();
    }

    private function fetchIrSettings($year)
    {
        $irData = \App\Models\SuperAdmin\GestionIR::where('annee', $year)->first();
        
        if (!$irData) {
            return null;
        }
        
        $dataRows = $irData->data_rows;
        if (is_string($dataRows)) {
            $dataRows = json_decode($dataRows, true);
        }
        
        if (is_object($dataRows)) {
            $dataRows = (array) $dataRows;
        }
        
        return (object) [
            'id' => $irData->id,
            'annee' => $irData->annee,
            'data_rows' => $dataRows,
            'created_at' => $irData->created_at,
            'updated_at' => $irData->updated_at,
        ];
    }

    private function fetchRetraiteSettings($year)
    {
        return \App\Models\SuperAdmin\RetraiteSetting::where('year', $year)->first();
    }
}