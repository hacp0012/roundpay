<?php

namespace App\Enums;

enum MobileMoneyProvider: string
{
    case OrangeMoney = 'orange_money';
    case Mpesa = 'mpesa';
    case AirtelMoney = 'airtel_money';
    case MtnMomo = 'mtn_momo';
    case Wave = 'wave';
    case CashGuichet = 'cash_guichet';
}
