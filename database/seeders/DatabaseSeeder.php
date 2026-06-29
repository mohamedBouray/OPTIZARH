<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\Auth\User;
use App\Models\SuperAdmin\SalaryYear;
use App\Models\SuperAdmin\Post;
use App\Models\SuperAdmin\Grade;
use App\Models\SuperAdmin\Echelle;
use App\Models\SuperAdmin\Echelon;
use App\Models\SuperAdmin\GestionIndemnite;
use App\Models\SuperAdmin\Organisme;
use App\Models\SuperAdmin\Cotisation;
use App\Models\SuperAdmin\RcarType;
use App\Models\SuperAdmin\RcarDetail;
use App\Models\SuperAdmin\CreditType;
use App\Models\SuperAdmin\LeaveSetting;
use App\Models\SuperAdmin\LeaveType;
use App\Models\SuperAdmin\GestionIR;
use App\Models\SuperAdmin\Employee;
use App\Models\Employe\EmployeeSalary;
use App\Models\SuperAdmin\LeaveBalance;
use App\Models\Employe\LeaveRequest;
use App\Models\SuperAdmin\ActivityLog;
use App\Models\SuperAdmin\Setting;
use App\Models\SuperAdmin\Assurance;
use App\Models\SuperAdmin\EmployeeCredit;
use App\Models\SuperAdmin\SntlSetting;
use App\Models\SuperAdmin\RetraiteSetting;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Début du seeding...');

        // ============================================
        // 1. SALARY YEARS (via le seeder existant)
        // ============================================
        $this->command->info('📅 Création des années...');
        $this->call(SalaryYearsSeeder::class);

        // Récupérer l'année active
        $currentYear = SalaryYear::where('year', date('Y'))->first();
        if (!$currentYear) {
            $currentYear = SalaryYear::first();
        }
        $yearId = $currentYear->id;

        // ============================================
        // 2. POSTES, GRADES, ECHELLES, ECHELONS
        // ============================================
        $this->command->info('🏢 Création des postes, grades, échelles et échelons...');

        $postes = [
            ['name' => 'Directeur', 'is_starred' => true],
            ['name' => 'Chef de Service', 'is_starred' => true],
            ['name' => 'Responsable RH', 'is_starred' => true],
            ['name' => 'Responsable Finance', 'is_starred' => true],
            ['name' => 'Ingénieur', 'is_starred' => false],
            ['name' => 'Technicien', 'is_starred' => false],
            ['name' => 'Agent Administratif', 'is_starred' => false],
            ['name' => 'Agent de Service', 'is_starred' => false],
        ];

        foreach ($postes as $postData) {
            $post = Post::create([
                'salary_year_id' => $yearId,
                'name' => $postData['name'],
                'is_starred' => $postData['is_starred'],
            ]);

            // Grades par poste
            $gradesList = [
                'Directeur' => ['Grade A1', 'Grade A2'],
                'Chef de Service' => ['Grade B1', 'Grade B2'],
                'Responsable RH' => ['Grade B1', 'Grade B2'],
                'Responsable Finance' => ['Grade B1', 'Grade B2'],
                'Ingénieur' => ['Grade C1', 'Grade C2'],
                'Technicien' => ['Grade D1', 'Grade D2'],
                'Agent Administratif' => ['Grade E1', 'Grade E2'],
                'Agent de Service' => ['Grade F1', 'Grade F2'],
            ];

            foreach ($gradesList[$postData['name']] ?? ['Grade 1', 'Grade 2'] as $gradeName) {
                $grade = Grade::create([
                    'Post_id' => $post->id,
                    'name' => $gradeName,
                ]);

                // Échelles par grade
                for ($i = 1; $i <= 3; $i++) {
                    $echelle = Echelle::create([
                        'grade_id' => $grade->id,
                        'level' => 'Échelle ' . $i,
                    ]);

                    // Échelons par échelle
                    for ($j = 1; $j <= 4; $j++) {
                        Echelon::create([
                            'echelle_id' => $echelle->id,
                            'order' => $j,
                            'index_val' => 100 + ($j * 10) + ($i * 5),
                            'salary' => 3000 + ($j * 500) + ($i * 300),
                        ]);
                    }
                }
            }
        }

        // ============================================
        // 3. ORGANISMES ET COTISATIONS
        // ============================================
        $this->command->info('🏛️ Création des organismes et cotisations...');

        $organismes = [
            ['nom' => 'CNOPS', 'annee' => date('Y'), 'is_favorite' => true],
            ['nom' => 'CNSS', 'annee' => date('Y'), 'is_favorite' => true],
            ['nom' => 'MGPAP', 'annee' => date('Y'), 'is_favorite' => false],
            ['nom' => 'OMFAM', 'annee' => date('Y'), 'is_favorite' => false],
        ];

        foreach ($organismes as $orgData) {
            $organisme = Organisme::create($orgData);

            $cotisationsList = [
                'CNOPS' => [
                    ['name' => 'Cotisation CNOPS', 'taux' => 4.50, 'plafond' => 6000],
                    ['name' => 'Assurance Maladie', 'taux' => 2.50, 'plafond' => 5000],
                ],
                'CNSS' => [
                    ['name' => 'Cotisation CNSS', 'taux' => 3.00, 'plafond' => 4000],
                ],
                'MGPAP' => [
                    ['name' => 'Cotisation MGPAP', 'taux' => 5.00, 'plafond' => 7000],
                ],
                'OMFAM' => [
                    ['name' => 'Cotisation OMFAM', 'taux' => 2.00, 'plafond' => 3000],
                ],
            ];

            foreach ($cotisationsList[$orgData['nom']] ?? [] as $cotisData) {
                Cotisation::create([
                    'organisme_id' => $organisme->id,
                    'name' => $cotisData['name'],
                    'taux' => $cotisData['taux'],
                    'plafond' => $cotisData['plafond'],
                ]);
            }
        }

        // ============================================
        // 4. RCAR TYPES ET DETAILS
        // ============================================
        $this->command->info('🏦 Création des RCAR...');

        $rcarTypes = [
            ['label' => 'RCAR Salariale', 'is_favorite' => true],
            ['label' => 'RCAR Patronale', 'is_favorite' => false],
        ];

        foreach ($rcarTypes as $rtData) {
            $rcarType = RcarType::create([
                'salary_year_id' => $yearId,
                'label' => $rtData['label'],
                'is_favorite' => $rtData['is_favorite'],
            ]);

            RcarDetail::create([
                'rcar_type_id' => $rcarType->id,
                'designation' => $rtData['label'],
                'type' => str_contains($rtData['label'], 'Salariale') ? 'salariale' : 'patronale',
                'plafond' => 5000,
                'percentage' => 3.00,
            ]);
        }

        // ============================================
        // 5. CREDIT TYPES
        // ============================================
        $this->command->info('💰 Création des types de crédits...');

        $creditTypes = [
            ['name' => 'Crédit Immobilier', 'code' => 'IMMO', 'is_active' => true],
            ['name' => 'Crédit Consommation', 'code' => 'CONSO', 'is_active' => true],
            ['name' => 'Microcrédit', 'code' => 'MICRO', 'is_active' => true],
            ['name' => 'AOS (Avance sur Salaire)', 'code' => 'AOS', 'is_active' => true],
        ];

        foreach ($creditTypes as $ctData) {
            CreditType::create($ctData);
        }

        // ============================================
        // 6. INDEMNITES
        // ============================================
        $this->command->info('💶 Création des indemnités...');

        $indemnites = [
            ['libelle' => 'Indemnité de Résidence', 'type' => 'Fixe', 'valeur' => 500, 'is_for_all' => true],
            ['libelle' => 'Indemnité de Fonction', 'type' => 'Fixe', 'valeur' => 300, 'is_for_all' => true],
            ['libelle' => 'Indemnité de Transport', 'type' => 'Fixe', 'valeur' => 200, 'is_for_all' => true],
            ['libelle' => 'Indemnité de Logement', 'type' => 'Fixe', 'valeur' => 400, 'is_for_all' => false],
            ['libelle' => 'Prime de Rendement', 'type' => 'Pourcentage', 'valeur' => 10, 'is_for_all' => true],
        ];

        foreach ($indemnites as $indData) {
            $post = $indData['is_for_all'] ? null : Post::first();

            GestionIndemnite::create([
                'salary_year_id' => $yearId,
                'libelle' => $indData['libelle'],
                'type' => $indData['type'],
                'valeur' => $indData['valeur'],
                'Post_id' => $post?->id,
                'grade_id' => null,
                'echelle_id' => null,
                'echelon_id' => null,
                'is_for_all' => $indData['is_for_all'],
            ]);
        }

        // ============================================
        // 7. LEAVE SETTINGS ET TYPES
        // ============================================
        $this->command->info('🌴 Création des congés...');

        $leaveSettings = [
            ['category_name' => 'Congé Annuel', 'annual_global_max' => 30],
            ['category_name' => 'Congé Maladie', 'annual_global_max' => 15],
            ['category_name' => 'Congé Exceptionnel', 'annual_global_max' => 10],
        ];

        foreach ($leaveSettings as $lsData) {
            $setting = LeaveSetting::create([
                'salary_year_id' => $yearId,
                'category_name' => $lsData['category_name'],
                'annual_global_max' => $lsData['annual_global_max'],
            ]);

            $types = [
                'Congé Annuel' => ['Congé Annuel Payé', 'Congé Annuel Non Payé'],
                'Congé Maladie' => ['Congé Maladie Courte Durée', 'Congé Maladie Longue Durée'],
                'Congé Exceptionnel' => ['Congé Mariage', 'Congé Décès', 'Congé Naissance'],
            ];

            foreach ($types[$lsData['category_name']] ?? ['Type 1', 'Type 2'] as $typeName) {
                LeaveType::create([
                    'leave_category_id' => $setting->id,
                    'salary_year_id' => $yearId,
                    'name' => $typeName,
                    'max_days_per_request' => rand(5, 20),
                ]);
            }
        }

        // ============================================
        // 8. GESTION IR
        // ============================================
        $this->command->info('📊 Création du barème IR...');

        $irData = [
            ['tranche_min' => 0, 'tranche_max' => 3000, 'taux' => 0, 'montant_fixe' => 0],
            ['tranche_min' => 3000, 'tranche_max' => 5000, 'taux' => 10, 'montant_fixe' => 0],
            ['tranche_min' => 5000, 'tranche_max' => 10000, 'taux' => 20, 'montant_fixe' => 200],
            ['tranche_min' => 10000, 'tranche_max' => 15000, 'taux' => 30, 'montant_fixe' => 700],
            ['tranche_min' => 15000, 'tranche_max' => 20000, 'taux' => 34, 'montant_fixe' => 1200],
            ['tranche_min' => 20000, 'tranche_max' => 999999, 'taux' => 38, 'montant_fixe' => 2000],
        ];

        GestionIR::create([
            'annee' => date('Y'),
            'data_rows' => json_encode($irData),
        ]);

        // ============================================
        // 9. ASSURANCES
        // ============================================
        $this->command->info('🛡️ Création des assurances...');

        $assurances = [
            ['name' => 'Assurance Santé', 'code' => 'SANTE', 'taux_salarie' => 2.5, 'plafond_mensuel' => 3000],
            ['name' => 'Assurance Vie', 'code' => 'VIE', 'taux_salarie' => 1.5, 'plafond_mensuel' => 2000],
        ];

        foreach ($assurances as $assData) {
            Assurance::create([
                'annee_id' => $yearId,
                'name' => $assData['name'],
                'is_active' => true,
                'taux_salarie' => $assData['taux_salarie'],
                'plafond_mensuel' => $assData['plafond_mensuel'],
            ]);
        }

        // ============================================
        // 10. RETRAITE SETTINGS
        // ============================================
        $this->command->info('👴 Création des paramètres retraite...');

        RetraiteSetting::create([
            'year' => date('Y'),
            'age_legal' => 60,
            'duree_max' => 5,
            'nb_fois' => 2,
        ]);

        // ============================================
        // 11. SNTL SETTINGS
        // ============================================
        $this->command->info('📋 Création des paramètres SNTL...');

        SntlSetting::create([
            'label' => 'SNTL',
            'valeur' => 100,
            'type_montant' => 'fixe',
            'categorie_cible' => 'tous',
            'salary_year_id' => $yearId,
            'Post_id' => null,
            'grade_id' => null,
            'echelle_id' => null,
            'echelon_id' => null,
            'is_active' => true,
        ]);

        // ============================================
        // 12. USERS (AVEC EMAIL VERIFIED)
        // ============================================
        $this->command->info('👤 Création des utilisateurs (vérifiés)...');

        $superAdmin = User::create([
            'full_name' => 'Super Administrateur',
            'email' => 'admin@optizarh.com',
            'password' => Hash::make('password123'),
            'company_name' => 'OPTIZAWORKS',
            'role' => 'superadmin',
            'theme' => 'dark',
            'language' => 'fr',
            'is_blocked' => false,
            'must_change_password' => false,
            'email_verified_at' => now(), // ✅ Vérifié
        ]);

        $rh = User::create([
            'full_name' => 'Responsable RH',
            'email' => 'rh@optizarh.com',
            'password' => Hash::make('password123'),
            'company_name' => 'OPTIZAWORKS',
            'role' => 'rh',
            'theme' => 'light',
            'language' => 'fr',
            'is_blocked' => false,
            'must_change_password' => false,
            'email_verified_at' => now(), // ✅ Vérifié
        ]);

        $emp1 = User::create([
            'full_name' => 'Mohamed Bouray',
            'email' => 'mohamed@optizarh.com',
            'password' => Hash::make('password123'),
            'company_name' => 'OPTIZAWORKS',
            'role' => 'employee',
            'theme' => 'light',
            'language' => 'fr',
            'is_blocked' => false,
            'must_change_password' => false,
            'email_verified_at' => now(), // ✅ Vérifié
        ]);

        $emp2 = User::create([
            'full_name' => 'Sybous Mohamed',
            'email' => 'sybous@optizarh.com',
            'password' => Hash::make('password123'),
            'company_name' => 'OPTIZAWORKS',
            'role' => 'employee',
            'theme' => 'light',
            'language' => 'fr',
            'is_blocked' => false,
            'must_change_password' => false,
            'email_verified_at' => now(), // ✅ Vérifié
        ]);

        // ============================================
        // 13. EMPLOYEES
        // ============================================
        $this->command->info('👨‍💼 Création des employés...');

        $post = Post::where('name', 'Responsable RH')->first();
        $grade = Grade::where('name', 'Grade B1')->first();
        $echelle = Echelle::first();
        $echelon = Echelon::first();
        $organisme = Organisme::where('nom', 'CNOPS')->first();
        $rcarType = RcarType::first();
        $creditType = CreditType::where('code', 'CONSO')->first();

        $employeesData = [
            [
                'user' => $rh,
                'prenom' => 'Responsable',
                'nom' => 'RH',
                'email' => 'rh@optizarh.com',
                'telephone' => '0612345678',
                'situation_familiale' => 'Marié',
                'nombre_enfants' => 2,
                'date_embauche' => '2020-01-01',
                'role' => 'rh',
                'statut' => 'ACTIF',
                'salaire' => 12000,
            ],
            [
                'user' => $emp1,
                'prenom' => 'Mohamed',
                'nom' => 'Bouray',
                'email' => 'mohamed@optizarh.com',
                'telephone' => '0612345679',
                'situation_familiale' => 'Célibataire',
                'nombre_enfants' => 0,
                'date_embauche' => '2022-06-01',
                'role' => 'employee',
                'statut' => 'ACTIF',
                'salaire' => 8000,
            ],
            [
                'user' => $emp2,
                'prenom' => 'Sybous',
                'nom' => 'Mohamed',
                'email' => 'sybous@optizarh.com',
                'telephone' => '0612345680',
                'situation_familiale' => 'Marié',
                'nombre_enfants' => 1,
                'date_embauche' => '2023-09-01',
                'role' => 'employee',
                'statut' => 'ACTIF',
                'salaire' => 7000,
            ],
        ];

        foreach ($employeesData as $empData) {
            $employee = Employee::create([
                'user_id' => $empData['user']->id,
                'prenom' => $empData['prenom'],
                'nom' => $empData['nom'],
                'email' => $empData['email'],
                'telephone' => $empData['telephone'],
                'date_naissance' => '1990-01-01',
                'situation_familiale' => $empData['situation_familiale'],
                'nombre_enfants' => $empData['nombre_enfants'],
                'date_embauche' => $empData['date_embauche'],
                'role' => $empData['role'],
                'annee_id' => $yearId,
                'Post_id' => $post?->id,
                'grade_id' => $grade?->id,
                'echelle_id' => $echelle?->id,
                'echelon_id' => $echelon?->id,
                'grade' => $grade?->name,
                'echelle' => $echelle?->level,
                'echelon' => 'Échelon 1',
                'salaire' => $empData['salaire'],
                'statut' => $empData['statut'],
                'cotisation_id' => $organisme?->id,
                'rcar_type_id' => $rcarType?->id,
                'credit_type_id' => $creditType?->id,
                'montant_credit' => 50000,
                'taux_credit' => 5.5,
                'credit_duree' => 24,
                'credit_date_debut' => '2024-01-01',
                'credit_date_fin' => '2026-01-01',
                'credit_mensualite' => 2200,
                'credit_reste_a_payer' => 40000,
            ]);

            // Leave Balance
            LeaveBalance::create([
                'employee_id' => $employee->id,
                'salary_year_id' => $yearId,
                'days_used' => rand(0, 10),
            ]);

            // Leave Request
            $leaveType = LeaveType::first();
            if ($leaveType) {
                LeaveRequest::create([
                    'employee_id' => $employee->id,
                    'leave_type_id' => $leaveType->id,
                    'salary_year_id' => $yearId,
                    'start_date' => '2026-07-01',
                    'end_date' => '2026-07-05',
                    'duration' => 5,
                    'comments' => 'Congé annuel',
                    'status' => 'PENDING',
                    'processed_by' => null,
                ]);
            }

            // Employee Salaries (6 mois)
            for ($month = 1; $month <= 6; $month++) {
                $baseSalary = $empData['salaire'];
                $indemnites = 500 + rand(100, 300);
                $brut = $baseSalary + $indemnites;
                $ir = $brut * 0.10;
                $cotisations = $brut * 0.08;
                $rcar = $brut * 0.03;
                $assurances = $brut * 0.025;
                $credits = 2200;
                $totalDeductions = $ir + $cotisations + $rcar + $assurances + $credits;
                $net = $brut - $totalDeductions;

                EmployeeSalary::create([
                    'employee_id' => $employee->id,
                    'annee_id' => $yearId,
                    'year' => date('Y'),
                    'month' => $month,
                    'base_salary' => $baseSalary,
                    'indemnites_total' => $indemnites,
                    'brut_salary' => $brut,
                    'net_salary' => $net,
                    'cotisations_total' => $cotisations,
                    'rcar_total' => $rcar,
                    'ir_total' => $ir,
                    'sntl_total' => 0,
                    'assurances_salarie' => $assurances,
                    'credits_total' => $credits,
                    'total_deductions' => $totalDeductions,
                    'ir_taux' => 10,
                ]);
            }
        }

        // ============================================
        // 14. ACTIVITY LOGS
        // ============================================
        $this->command->info('📝 Création des logs...');

        $actions = ['Création', 'Modification', 'Suppression', 'Consultation'];
        $descriptions = [
            'Création d\'un employé',
            'Modification du salaire',
            'Validation d\'une demande de congé',
            'Consultation du bulletin de paie',
        ];

        for ($i = 0; $i < 10; $i++) {
            ActivityLog::create([
                'user_id' => $superAdmin->id,
                'titre' => $actions[array_rand($actions)],
                'action_type' => 'Système',
                'description' => $descriptions[array_rand($descriptions)],
                'annee' => date('Y'),
            ]);
        }

        // ============================================
        // 15. SETTINGS
        // ============================================
        $this->command->info('⚙️ Création des paramètres...');

        $settings = [
            ['key' => 'app_name', 'value' => 'OPTIZARH'],
            ['key' => 'app_version', 'value' => '1.0.0'],
            ['key' => 'company_name', 'value' => 'OPTIZAWORKS'],
            ['key' => 'default_language', 'value' => 'fr'],
            ['key' => 'default_theme', 'value' => 'light'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }

        $this->command->info('✅ Seeding terminé avec succès !');
        $this->command->info('📧 Comptes de test (tous vérifiés) :');
        $this->command->info('   Super Admin : admin@optizarh.com / password123');
        $this->command->info('   RH : rh@optizarh.com / password123');
        $this->command->info('   Employé 1 : mohamed@optizarh.com / password123');
        $this->command->info('   Employé 2 : sybous@optizarh.com / password123');
    }
}