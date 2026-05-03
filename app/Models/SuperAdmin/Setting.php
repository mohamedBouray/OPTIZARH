<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Helper bach njibo setting b-sor3a
     * Usage: Setting::get('registration_enabled')
     */
    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}