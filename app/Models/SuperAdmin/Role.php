<?php 
namespace App\Models\SuperAdmin;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['salary_year_id', 'name', 'is_starred'];

    public function salaryYear() {
        return $this->belongsTo(SalaryYear::class);
    }

    public function grades() {
        return $this->hasMany(Grade::class);
    }

    public function scopeStarred($query) {
        return $query->where('is_starred', true);
    }

    public function getIsStarredAttribute($value) {
        return (bool) $value;
    }
}