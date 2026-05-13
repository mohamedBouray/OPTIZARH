<?php

namespace App\Http\Controllers\Employe;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employe\LeaveRequest;
use App\Models\SuperAdmin\LeaveSetting;
use App\Models\SuperAdmin\LeaveType;
use App\Models\SuperAdmin\LeaveBalance;
use App\Models\SuperAdmin\SalaryYear;

class LeaveRequestController extends Controller
{
    // ==========================================
    // PARTIE 1: EMPLOYEE (Submit & History)
    // ==========================================

    public function myRequests(Request $request){
        $user = auth()->user();

        if (!$user->employee) {
            return response()->json([
                'error' => 'Had l-compte ma-m-rtabetch b-ay employee. Khass t-creer profil employee l had l-user f l-lowel.'
            ], 404);
        }

        $employeeId = $user->employee->id; 
        
        $requests = LeaveRequest::with('leaveType')
                        ->where('employee_id', $employeeId)
                        ->orderBy('created_at', 'desc')
                        ->get();

        return response()->json($requests);
    }

    public function store(Request $request){
        $leaveType = LeaveType::findOrFail($request->leave_type_id);
        $isCertificate = ($leaveType->max_days_per_request == 0);
        $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'salary_year_id' => 'required|exists:salary_years,id',
            'start_date' => $isCertificate ? 'nullable|date' : 'required|date',
            'end_date' => $isCertificate ? 'nullable|date' : 'required|date|after_or_equal:start_date',
            // duration t-9der t-kon 0 f l-certificate
            'duration' => $isCertificate ? 'required|integer|min:0' : 'required|integer|min:1',
            'comments' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $employeeId = auth()->user()->employee->id;
        $setting = LeaveSetting::where('salary_year_id', $request->salary_year_id)->first();

        if (!$setting) {
            return response()->json(['error' => 'Super Admin mazal ma-configurach had l-3am.'], 400);
        }

        // 3. Check l-quota ghir ila kan congé (duration > 0)
        if (!$isCertificate) {
            if ($request->duration > $leaveType->max_days_per_request) {
                return response()->json([
                    'error' => "Had l-nou3 dyal l-congé ma-i9derch ifout {$leaveType->max_days_per_request} jours."
                ], 422);
            }

            $balance = LeaveBalance::firstOrCreate(
                ['employee_id' => $employeeId, 'salary_year_id' => $request->salary_year_id]
            );

            if (($balance->days_used + $request->duration) > $setting->annual_global_max) {
                $left = $setting->annual_global_max - $balance->days_used;
                return response()->json([
                    'error' => "Quota dépassé! Bqaw lik ghir {$left} jours."
                ], 422);
            }
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave_attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employeeId,
            'leave_type_id' => $request->leave_type_id,
            'salary_year_id' => $request->salary_year_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'duration' => $request->duration,
            'comments' => $request->comments,
            'status' => 'PENDING',
            'attachment_path' => $attachmentPath,
        ]);

        return response()->json(['message' => 'Demande envoyée avec succès!', 'data' => $leaveRequest], 201);
    }

    // ==========================================
    // PARTIE 2: RH (Approve & Reject)
    // ==========================================

    public function allRequests()
    {
        $requests = LeaveRequest::with(['employee', 'leaveType'])->orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

    public function updateStatus(Request $request, $id){
        $request->validate([
            'status' => 'required|in:APPROVED,REJECTED',
            'hr_note' => 'nullable|string',
        ]);

        $leaveRequest = LeaveRequest::with('leaveType')->findOrFail($id); // Zedt l-with bach n-jibo l-Type

        if ($leaveRequest->status !== 'PENDING') {
            return response()->json(['error' => 'Had l-demande deja traitée!'], 400);
        }

        $leaveRequest->update([
            'status' => $request->status,
            'hr_note' => $request->hr_note,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        if ($request->status === 'APPROVED') {
            // ISLAH 2: Jib salary_year_id mn leaveType hit makaynach f leave_requests
            $salaryYearId = $leaveRequest->leaveType->salary_year_id;

            $balance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                                    ->where('salary_year_id', $salaryYearId)
                                    ->first();
            
            if ($balance) {
                $balance->increment('days_used', $leaveRequest->duration);
            } else {
                LeaveBalance::create([
                    'employee_id' => $leaveRequest->employee_id,
                    'salary_year_id' => $salaryYearId, // Islah hna ta howa
                    'days_used' => $leaveRequest->duration
                ]);
            }
        }

        return response()->json(['message' => "Demande {$request->status} avec succès!"]);
    }

    public function getLeaveStats() {
        $user = auth()->user();
        $employee = $user->employee;

        // 1. Njebdo l-annee active
        $nowYear = now()->year; 

        $currentYear = SalaryYear::where('year', $nowYear)->first() 
                ?? SalaryYear::where('status', 'ACTIVE')->first() 
                ?? SalaryYear::latest()->first();

        // 2. Data dyal l-Year (ANNUEL) - Card 1
        $globalSettings = LeaveSetting::where('salary_year_id', $currentYear->id)
                            ->where('category_name', 'ANNUEL')->first();
        
        $balance = LeaveBalance::where('employee_id', $employee->id)
                    ->where('salary_year_id', $currentYear->id)->first();

        $totalGlobal = $globalSettings ? $globalSettings->annual_global_max : 0;
        $usedGlobal = $balance ? $balance->days_used : 0;

        // 3. Data dyal l-conge l-akhiri li t-accepta (Card 2)
        $lastApproved = LeaveRequest::where('employee_id', $employee->id)
                        ->where('status', 'APPROVED')
                        ->with('leaveType.leaveCategory') // t-akked mn relationship
                        ->latest()->first();

        return response()->json([
            'global' => [
                'label' => 'Total Annuel ' . $currentYear->year,
                'total' => $totalGlobal,
                'used' => $usedGlobal,
                'remaining' => max(0, $totalGlobal - $usedGlobal),
                'percentage' => $totalGlobal > 0 ? ($usedGlobal / $totalGlobal) * 100 : 0
            ],
            'last_request' => $lastApproved ? [
                'type' => $lastApproved->leaveType->name,
                'duration' => $lastApproved->duration,
                'date' => $lastApproved->start_date
            ] : null
        ]);
    }
}