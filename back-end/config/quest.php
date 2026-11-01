<?php

use Hacp0012\Quest\QuestSpawMethod;

return [
  /** The default Request Method. */
  'method' => QuestSpawMethod::POST,

  /** Quest track base routes. */
  'base_routes' => [
    base_path('/routes/api.php'),
    base_path('/routes/web.php'),
  ],
];
