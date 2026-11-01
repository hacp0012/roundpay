<?php

namespace App\Enums;

enum ContributorStatus: string
{
    case Paye = 'paye';
    case Partiel = 'partiel';
    case Retard = 'retard';
    case PayeAvance = 'paye_avance';
}
