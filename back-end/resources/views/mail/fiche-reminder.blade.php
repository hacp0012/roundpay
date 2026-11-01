Bonjour {{ $memberName }},

Il reste à régler {{ $reste }} pour la cotisation « {{ $ficheTitle }} ».
@if($dateFin)

Date limite : {{ $dateFin }}.
@endif

Merci de régulariser votre versement dès que possible.

— {{ config('app.name') }}
