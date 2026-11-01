<?php

namespace App\Enums;

/**
 * Les administrateurs ne sont pas des membres : voir AdminRole et la table admins.
 */
enum UserRole: string
{
    case Member = 'member';
}
