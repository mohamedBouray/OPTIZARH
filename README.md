# 🏢 OPTIZARH – Plateforme RH Intelligente pour le Secteur Public Marocain

![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=flat&logo=laravel)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=flat&logo=sqlite)
![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat&logo=php)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## 📖 Présentation

**OPTIZARH** est une plateforme web intelligente développée par **OPTIZAWORKS**, conçue pour automatiser, fiabiliser et moderniser la gestion des ressources humaines dans les institutions publiques marocaines.

> *"Digitaliser l'intégralité du cycle RH, du recrutement à la retraite, en garantissant une conformité stricte avec la législation marocaine (RCAR, IR, CNOPS, MGPAP, OMFAM)."*

---

## 🎯 Problématique et Objectifs

| Problème | Impact |
|----------|--------|
| 📋 Lourdeurs administratives | Processus manuels et chronophages |
| 📊 Hétérogénéité des outils | Fichiers Excel dispersés, absence de centralisation |
| 🧮 Complexité réglementaire | Calculs manuels (salaires, IR, RCAR, indemnités) |
| 🔍 Absence de traçabilité | Manque de transparence et de piste d'audit |
| 👥 Multiplicité des intervenants | Droits d'accès non maîtrisés |

| Objectif | Description |
|----------|-------------|
| 🎯 Digitalisation | Automatiser l'intégralité du cycle RH |
| 🧮 Calculs automatiques | Salaires, IR, RCAR, cotisations, indemnités |
| 📜 Conformité réglementaire | Respect des textes marocains en vigueur |
| 🔒 Sécurisation | Accès par rôles (RBAC), HTTPS, logs |
| 📊 Pilotage décisionnel | Tableaux de bord dynamiques, indicateurs temps réel |

---

## ⚙️ Fonctionnalités

### 16 Modules Fonctionnels

| # | Module | Description |
|---|--------|-------------|
| 1 | Gestion des Employés | Création, modification, consultation, recherche multicritère |
| 2 | Gestion des Salaires | Calcul automatique du brut, net, IR, RCAR, bulletins de paie |
| 3 | Gestion des Indemnités | Paramétrage et attribution (résidence, fonction, hiérarchie) |
| 4 | États Réglementaires | Déclarations MGPAP, CNOPS, OMFAM automatisées |
| 5 | Tableaux IR | Calcul des retenues IR, export PDF/Excel |
| 6 | Allocations Familiales | Suivi des enfants à charge et versements mensuels |
| 7 | Gestion du RCAR | Cotisations de retraite, parts salariale et patronale |
| 8 | Gestion des Prélèvements | Crédits (conso, immobilier, microcrédit, AOS) |
| 9 | Gestion des Congés | Demandes en ligne, validation, suivi des soldes |
| 10 | Gestion des Primes | Attribution, suivi, reporting |
| 11 | Gestion des Avancements | Changements d'échelle/échelon, rappels |
| 12 | Prolongation de Service (Tamdid) | Gestion des prolongations retraite |
| 13 | Gestion des Documents RH | Attestations, états, archivage PDF |
| 14 | Gestion des Demandes RH | Saisie et suivi des requêtes |
| 15 | Gestion des Utilisateurs | RBAC, création de comptes, journalisation |
| 16 | Notifications Intelligentes | Alertes, rappels, tableau de bord personnalisé |

---

## 👥 Acteurs et Droits d'Accès

| Acteur | Prérogatives |
|--------|--------------|
| 👑 **Super Administrateur** | Paramétrage global, gestion des utilisateurs, attribution des rôles, supervision et audit |
| 👨‍💼 **Gestionnaire RH** | Gestion des employés, traitement des demandes, consultation des salaires, suivi des carrières |
| 👤 **Employé** | Formulation des demandes, consultation de son salaire, suivi en temps réel, notifications |

---

## 🏗️ Architecture Technique
┌─────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURE TECHNIQUE │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🌐 CLIENT (FRONTEND) │ │
│ │ ───────────────────────────────────────────────────────── │ │
│ │ • React JS (SPA) │ │
│ │ • Tailwind CSS │ │
│ │ • Axios (HTTP Client) │ │
│ │ • React Router │ │
│ └───────────────────────────┬─────────────────────────────────┘ │
│ │ │
│ 🔄 API REST (JSON) │
│ │ │
│ ┌───────────────────────────▼─────────────────────────────────┐ │
│ │ 🖥️ SERVEUR (BACKEND) │ │
│ │ ───────────────────────────────────────────────────────── │ │
│ │ • Laravel (PHP) │ │
│ │ • API RESTful │ │
│ │ • Eloquent ORM │ │
│ │ • Laravel Sanctum (Auth) │ │
│ │ • Middleware (RBAC) │ │
│ └───────────────────────────┬─────────────────────────────────┘ │
│ │ │
│ 🔗 SQLite │
│ │ │
│ ┌───────────────────────────▼─────────────────────────────────┐ │
│ │ 💾 BASE DE DONNÉES │ │
│ │ ───────────────────────────────────────────────────────── │ │
│ │ • SQLite (Serverless) │ │
│ │ • Transactions ACID │ │
│ │ • Intégrité référentielle │ │
│ │ • Sauvegarde automatique │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────┘

text

---

## 🛠️ Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Backend | Laravel (PHP) | 11.x |
| Frontend | React (JavaScript) | 18.x |
| Styling | Tailwind CSS | 3.x |
| Base de données | SQLite | 3.x |
| Authentification | Laravel Sanctum | 11.x |
| HTTP Client | Axios | 1.x |
| Versioning | Git & GitHub | - |
| Gestion de projet | JIRA (Agile/Scrum) | - |
| UI/UX Design | Figma | - |

---

## 📦 Installation

### Prérequis

```bash
PHP >= 8.1
Composer
Node.js >= 18.x
NPM / Yarn
SQLite (ou MySQL)
Git
Étapes d'Installation
bash
# 1. Cloner le projet
git clone https://github.com/mohamedBouray/OPTIZARH.git
cd OPTIZARH

# 2. Installer les dépendances Backend
composer install

# 3. Installer les dépendances Frontend
npm install

# 4. Configurer l'environnement
cp .env.example .env

# 5. Créer la base de données SQLite
touch database/database.sqlite

# 6. Générer la clé d'application
php artisan key:generate

# 7. Exécuter les migrations et les seeders
php artisan migrate:fresh --seed

# 8. Compiler le Frontend (Production)
npm run build

# 9. Lancer le serveur de développement
php artisan serve
👨‍💻 Comptes de Test
Rôle	Email	Mot de passe
👑 Super Admin	admin@optizarh.com	password123
👨‍💼 RH	rh@optizarh.com	password123
👤 Employé 1	mohamed@optizarh.com	password123
👤 Employé 2	sybous@optizarh.com	password123
🔗 API Endpoints
Méthode	Endpoint	Description
POST	/api/login	Connexion
POST	/api/logout	Déconnexion
GET	/api/user	Informations utilisateur
GET	/api/employees	Liste des employés
GET	/api/employees/{id}	Détails d'un employé
POST	/api/employees	Création d'un employé
PUT	/api/employees/{id}	Modification d'un employé
DELETE	/api/employees/{id}	Suppression d'un employé
GET	/api/salaries/{id}	Bulletin de paie
POST	/api/leaves	Demande de congé
PUT	/api/leaves/{id}/status	Validation/refus
GET	/api/leaves/balance/{id}	Solde de congés
GET	/api/indemnites	Liste des indemnités
GET	/api/ir	Barème IR
GET	/api/logs	Journal d'activités
🔒 Sécurité
Mesure	Description
🔒 HTTPS	Chiffrement SSL/TLS
🛡️ RBAC	Role-Based Access Control
🔑 Sanctum	Authentification par tokens
📝 Logs	Journalisation inaltérable
💾 Sauvegarde	Quotidienne de la base
🔐 Hachage	Mots de passe (bcrypt)
⏰ Inactivité	Déconnexion automatique
🛡️ Protection CSRF	Laravel native
🛡️ Protection XSS	Laravel native
🛡️ Protection SQL Injection	Eloquent ORM
🤝 Contributeurs
Nom	Rôle
Mohamed Bouray	Développeur Full Stack
Sybous Mohamed	Développeur Full Stack
M. Tarek AIT BAHA	Maître de Conférences, EST Guelmim, Université Ibn Zohr
M. A. BOUAOUDA	Maître de Conférences, EST Guelmim, Université Ibn Zohr
M. Yassine AZNAG	Encadrant de Stage (OPTIZAWORKS)
📄 Licence
Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, de le modifier et de le distribuer.

🙏 Remerciements
Un grand merci à :

M. Tarek AIT BAHA – Maître de Conférences, EST Guelmim, Université Ibn Zohr

M. A. BOUAOUDA – Maître de Conférences, EST Guelmim, Université Ibn Zohr

M. Yassine AZNAG – Encadrant de stage chez OPTIZAWORKS

Toute l'équipe d'OPTIZAWORKS pour leur accueil et leur accompagnement

EST Guelmim pour la formation et le suivi
