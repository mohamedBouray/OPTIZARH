<?php
namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Auth\User;
use App\Models\SuperAdmin\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    /**
     * Get global platform settings and users
     */
    public function index()
    {
        // 1. Njibo wach registration khdama
        $registration = Setting::where('key', 'registration_enabled')->first();
        
        // 2. Njibo ga3 l-users (machi superadmin)
        $users = User::where('role', '!=', 'superadmin')
                     ->orderBy('created_at', 'desc')
                     ->get();

        return response()->json([
            'settings' => [
                'registration_enabled' => $registration ? (bool)$registration->value : true,
            ],
            'users' => $users
        ]);
    }

    /**
     * Update Registration Toggle
     */
    public function updateRegistration(Request $request)
    {
        $request->validate(['registration_enabled' => 'required|boolean']);

        Setting::updateOrCreate(
            ['key' => 'registration_enabled'],
            ['value' => $request->registration_enabled ? '1' : '0']
        );

        return response()->json(['message' => 'Registration setting updated successfully']);
    }

    /**
     * Toggle User Block Status
     */
    public function toggleBlock($id)
    {
        $user = User::findOrFail($id);

        // Protection: Ma tkhllich SuperAdmin y-blocki rasso (wakha derna filter f index)
        if ($user->role === 'superadmin') {
            return response()->json(['message' => 'Cannot block superadmin'], 403);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        return response()->json([
            'message' => $user->is_blocked ? 'User blocked' : 'User unblocked',
            'is_blocked' => $user->is_blocked
        ]);
    }
}