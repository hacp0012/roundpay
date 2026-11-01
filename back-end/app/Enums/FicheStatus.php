<?php

namespace App\Enums;

enum FicheStatus: string
{
    case Ouverte = 'ouverte';
    case Fermee = 'fermee';
    case Terminee = 'terminee';
}
