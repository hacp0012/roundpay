<?php

namespace App\Models;

use Database\Factories\PortalSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PortalSetting extends Model
{
    /** @use HasFactory<PortalSettingFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nom_collectif',
        'slogan',
        'about_us',
        'contact_email',
        'contact_phone',
        'contact_whatsapp',
        'contact_adresse',
        'contact_horaires',
        'message_bienvenue',
        'devise',
    ];
}
