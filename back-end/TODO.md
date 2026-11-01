# TODO

Points à connaître :

- J'ai choisi la limite par IP : elle bloque un spammeur seul, mais des visiteurs derrière la même connexion (un même Wi-Fi d'entreprise, par exemple) partagent le quota. Si cela pose problème, la limite se règle dans PortalQuest.php (constantes CONTACT_MAX_MESSAGES et CONTACT_WINDOW_SECONDS).
- Ce n'est pas une protection complète contre un bot qui change d'IP. Un captcha serait l'étape suivante si le problème persiste.
