<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Valide = 'valide';
    case EnAttente = 'en_attente';
    case Echoue = 'echoue';
}
