<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'payment_gateway' => [
        'driver' => env('PAYMENT_GATEWAY', 'local'),
        'timeout' => (int) env('PAYMENT_GATEWAY_TIMEOUT', 30),
    ],

    'maishapay' => [
        'base_url' => env('MAISHAPAY_BASE_URL', 'https://marchand.maishapay.online/api'),
        'collection_path' => env('MAISHAPAY_COLLECTION_PATH', '/collect/v2/store/mobileMoney'),
        'public_api_key' => env('MAISHAPAY_PUBLIC_API_KEY'),
        'secret_api_key' => env('MAISHAPAY_SECRET_API_KEY'),
        'gateway_mode' => (int) env('MAISHAPAY_GATEWAY_MODE', 0),
        'webhook_token' => env('MAISHAPAY_WEBHOOK_TOKEN'),
        'callback_url' => env('MAISHAPAY_CALLBACK_URL', rtrim((string) env('APP_URL'), '/') . '/api/webhooks/payments/maishapay?token=' . rawurlencode((string) env('MAISHAPAY_WEBHOOK_TOKEN'))),
    ],

    'flexpay' => [
        'base_url' => env('FLEXPAY_BASE_URL'),
        'payment_path' => env('FLEXPAY_PAYMENT_PATH', '/api/rest/v1/paymentService'),
        'check_path' => env('FLEXPAY_CHECK_PATH', '/api/rest/v1/check'),
        'api_token' => env('FLEXPAY_API_TOKEN'),
        'merchant_code' => env('FLEXPAY_MERCHANT_CODE'),
        'webhook_token' => env('FLEXPAY_WEBHOOK_TOKEN'),
        'callback_url' => env('FLEXPAY_CALLBACK_URL', rtrim((string) env('APP_URL'), '/') . '/api/webhooks/payments/flexpay?token=' . rawurlencode((string) env('FLEXPAY_WEBHOOK_TOKEN'))),
    ],

];
