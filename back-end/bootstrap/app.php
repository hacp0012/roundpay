<?php

use Hacp0012\Quest\core\Obstacle;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (RuntimeException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = str_contains(strtolower($e->getMessage()), 'authentification')
                    || str_contains(strtolower($e->getMessage()), 'accès')
                    ? 401
                    : 400;

                return response()->json(['message' => $e->getMessage()], $status);
            }
        });

        $exceptions->render(function (Obstacle $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 400);
            }
        });
    })->create();
