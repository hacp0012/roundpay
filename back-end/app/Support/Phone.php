<?php

namespace App\Support;

class Phone
{
    public static function normalize(string $raw): string
    {
        return trim(preg_replace('/[^\d+]/', '', $raw) ?? '');
    }

    public static function matches(string $first, string $second): bool
    {
        $clean1 = self::normalize($first);
        $clean2 = self::normalize($second);

        if ($clean1 === $clean2) {
            return true;
        }

        $digits1 = ltrim(ltrim($clean1, '+'), '0');
        $digits2 = ltrim(ltrim($clean2, '+'), '0');

        if ($digits1 === $digits2) {
            return true;
        }

        if (strlen($digits1) >= 8 && strlen($digits2) >= 8) {
            return substr($digits1, -8) === substr($digits2, -8);
        }

        return false;
    }
}
