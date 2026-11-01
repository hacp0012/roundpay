# Cas d'usage — Espace administration

Acteurs :
- **Administrateur** (trésorier) : gère les membres, les groupes, les fiches, les versements et les dépenses.
- **Administrateur principal** : tout ce que fait un administrateur, plus la gestion des comptes administrateurs.

Pages : `/admin/login`, `/admin/dashboard`, `/admin/members`, `/admin/groups`, `/admin/fiches`, `/admin/fiches/archives`, `/admin/fiche-detail`, `/admin/versements`, `/admin/depenses`, `/admin/collectes`, `/admin/portal`, `/admin/settings`, `/admin/administrateurs` (principal uniquement).

Un compte administrateur se connecte avec un **identifiant** et un **mot de passe**. Il n'a pas de téléphone ni de PIN membre.

---

## UC-A01 — Se connecter à l'espace administration

- **Acteur** : Administrateur
- **Déclencheur** : ouverture de `/admin/login`
- **Scénario principal** : l'administrateur saisit son identifiant (ou son e-mail) et son mot de passe, puis valide. L'espace administration s'ouvre.
- **Alternatives et erreurs**
  - Identifiant ou mot de passe incorrect : « Identifiant administrateur ou mot de passe incorrect. »
  - Compte désactivé : même message (aucune information n'est révélée sur l'existence du compte).
  - Un nom de membre ou un téléphone ne permet pas de se connecter.
- **Postconditions** : session administrateur ouverte.
- **Statut** : Implémenté

## UC-A02 — Consulter le tableau de bord de trésorerie

- **Acteur** : Administrateur
- **Déclencheur** : connexion, ou clic sur « Tableau de bord »
- **Scénario principal**
  1. L'administrateur voit le solde total en caisse.
  2. Il voit les cotisations obligatoires et les dons libres.
  3. Il voit les derniers paiements et les tendances sur 7 ou 28 jours.
  4. Il filtre les graphiques par groupe.
  5. Il ouvre une fiche depuis le tableau de bord.
- **Postconditions** : aucune donnée modifiée.
- **Statut** : Implémenté

## UC-A03 — Gérer les membres

- **Acteur** : Administrateur
- **Déclencheur** : page « Membres & Inscriptions »
- **Scénario principal**
  1. **Ajouter** un membre : nom, téléphone (avec indicatif), PIN de 4 chiffres (ou génération aléatoire), e-mail facultatif, solde d'avance, groupes.
  2. **Modifier** un membre : nom, téléphone, e-mail, groupes, solde.
  3. **Réinitialiser le PIN** d'un membre qui l'a oublié.
  4. **Consulter** la liste des membres et leurs groupes.
- **Alternatives et erreurs**
  - Téléphone ou PIN manquant : refus avec un message.
  - Le rôle ne peut plus être choisi : tous les membres sont des membres simples. Les administrateurs se gèrent depuis UC-A15.
- **Postconditions** : le membre est enregistré. Les fiches obligatoires ouvertes de ses groupes lui sont rattachées.
- **Statut** : Implémenté

## UC-A04 — Gérer les groupes de cotisation

- **Acteur** : Administrateur
- **Déclencheur** : page « Groupes & Tontines »
- **Scénario principal**
  1. Créer un groupe : nom, description, couleur, périodicité.
  2. Ajouter ou retirer des membres d'un groupe.
  3. Consulter les fiches rattachées à un groupe.
  4. Supprimer un groupe.
- **Alternatives** : un groupe sans fiche est affiché comme tel. Un groupe vide peut être créé.
- **Statut** : Implémenté

## UC-A05 — Créer une fiche de cotisation

- **Acteur** : Administrateur
- **Déclencheur** : formulaire « Créer une fiche » sur la page Fiches
- **Scénario principal**
  1. Choisir le type : **obligatoire** (rattachée à un groupe, avec un montant par membre) ou **collecte libre** (avec un objectif de cagnotte).
  2. Renseigner le titre, le motif, la date limite (ou aucune date).
  3. Publier. La fiche apparaît sur le tableau de bord des membres du groupe. L'écran annonce aussi une notification mobile aux membres : **à vérifier**, cette notification n'a pas été confirmée dans le code.
- **Alternatives et erreurs**
  - Obligatoire sans groupe : « Créez un groupe avant d'ajouter une fiche obligatoire. »
  - Titre manquant : refus.
  - Montant « libre » : aucun montant imposé, chaque membre contribue selon sa capacité.
- **Postconditions** : la fiche est ouverte et, si elle est publique, visible sur le portail.
- **Statut** : Implémenté

## UC-A06 — Modifier, désactiver et archiver une fiche

- **Acteur** : Administrateur
- **Déclencheur** : boutons de la carte d'une fiche
- **Scénario principal**
  1. **Modifier** : titre, motif, montant par membre (obligatoire), objectif, date limite.
  2. **Désactiver** : la fiche passe au statut « fermée ». Elle n'apparaît plus dans la liste active, et plus aucun paiement ne peut y être enregistré.
  3. Une fiche désactivée est accessible depuis « Désactivées & terminées » (page archives).
  4. **Réactiver** depuis la page archives. Le paiement redevient possible.
  5. **Terminer** : bouton « Terminer » sur une fiche ouverte, après confirmation. La fiche passe au statut « terminée », n'accepte plus de paiements et rejoint les archives.
- **Alternatives** : une fiche terminée ne peut pas être réactivée depuis l'interface.
- **Statut** : Implémenté

## UC-A07 — Relancer les retardataires

- **Acteur** : Administrateur
- **Déclencheur** : bouton « Relancer » sur une fiche obligatoire, « Relancer les retardataires » sur le détail d'une fiche, ou « Rappels groupés » sur le tableau de bord (toutes les fiches obligatoires ouvertes)
- **Scénario principal**
  1. L'administrateur déclenche la relance.
  2. Le système envoie un e-mail à chaque membre qui a un reste dû sur la fiche.
  3. Un message indique le nombre de membres relancés, et combien n'ont pas pu être joints.
- **Alternatives et erreurs**
  - Aucun membre en retard : le message l'indique, aucun e-mail n'est envoyé.
  - Membre sans adresse e-mail : il est compté à part. Il n'est pas relancé (les SMS et WhatsApp ne sont pas implémentés).
- **Prérequis** : un transport mail réel doit être configuré (`MAIL_MAILER`). Avec `log`, les e-mails sont écrits dans les journaux et ne sont pas délivrés.
- **Statut** : Partiel (e-mail uniquement, selon la configuration mail)

## UC-A08 — Enregistrer un versement

- **Acteur** : Administrateur
- **Déclencheur** : « Encaissement rapide » sur le détail d'une fiche
- **Scénario principal**
  1. Choisir le membre (ou, pour une collecte libre, un donateur libre, avec son nom).
  2. Saisir le montant encaissé.
  3. Choisir l'opérateur Mobile Money.
  4. Pour une passerelle réelle, saisir le numéro du membre ou du donateur.
  5. Valider.
- **Alternatives et erreurs**
  - Fiche fermée : refus, aucun versement créé.
  - Numéro manquant pour une passerelle réelle : refus avec un message explicite.
  - Mode passerelle : le versement est « en attente » jusqu'à confirmation. L'écran n'affiche pas de succès avant.
- **Postconditions** : le versement est ajouté à la fiche, le reste dû du membre est mis à jour, et l'historique est tenu à jour.
- **Statut** : Implémenté en mode `local`. Partiel en mode passerelle.

## UC-A09 — Imputer un solde d'avance sur une fiche

- **Acteur** : Administrateur
- **Déclencheur** : page « Versements & Crédits », action « Imputer un crédit »
- **Scénario principal**
  1. Choisir la fiche à régulariser et le membre créditeur.
  2. Saisir le montant à déduire du solde d'avance.
  3. Confirmer l'imputation. Le reste dû de la fiche diminue, et le solde d'avance du membre aussi.
- **Alternatives et erreurs**
  - Montant supérieur au solde disponible : refus.
  - Option « Imputer automatiquement les dettes » : répartit le solde sur les fiches en retard.
- **Postconditions** : soldes et reste dû mis à jour.
- **Statut** : Implémenté

## UC-A10 — Suivre les collectes libres et les dons

- **Acteur** : Administrateur
- **Déclencheur** : page « Collectes libres & Dons »
- **Scénario principal**
  1. Voir le total collecté (filtrable), le nombre de donateurs uniques et les campagnes actives.
  2. Filtrer les dons par campagne ou par période.
  3. Exporter la liste en PDF ou en tableau.
- **Alternatives** : aucun don pour les filtres choisis : un message l'indique.
- **Statut** : Implémenté

## UC-A11 — Enregistrer une dépense

- **Acteur** : Administrateur
- **Déclencheur** : page « Dépenses & Caisse », formulaire « Enregistrer une dépense »
- **Scénario principal**
  1. Choisir la catégorie, saisir le libellé et le montant décaissé.
  2. Joindre le justificatif (PDF, PNG, JPG, WEBP, max 10 Mo).
  3. Valider. Le montant est déduit de la caisse commune.
- **Alternatives et erreurs**
  - Fichier trop lourd ou format non accepté : refus avec un message.
  - Montant supérieur au solde de la caisse : à vérifier.
- **Postconditions** : la dépense apparaît dans le registre, avec le nom de l'administrateur qui l'a saisie.
- **Statut** : Implémenté

## UC-A12 — Consulter le registre des dépenses et les justificatifs

- **Acteur** : Administrateur
- **Déclencheur** : page « Dépenses & Caisse »
- **Scénario principal** : l'administrateur consulte les décaissements, le reste net en caisse et le taux d'exécution budgétaire. Il télécharge le justificatif d'une dépense.
- **Statut** : Implémenté

## UC-A13 — Exporter les rapports

- **Acteur** : Administrateur
- **Déclencheur** : boutons « Exporter CSV », « Relevé PDF/CSV » (tableau de bord) ou « Exporter rapport » (détail d'une fiche)
- **Scénario principal** : l'administrateur télécharge un relevé de trésorerie, un rapport par fiche, ou la liste des paiements, au format PDF ou CSV.
- **Statut** : Implémenté

## UC-A14 — Gérer le portail public

- **Acteur** : Administrateur
- **Déclencheur** : page « Portail Public & Contact »
- **Scénario principal**
  1. Modifier les coordonnées de contact (téléphone et autres coordonnées).
  2. Modifier l'explication du collectif et le message d'accueil.
  3. Choisir quelles fiches sont visibles sur le portail public.
  4. Visualiser le portail public.
- **Alternatives** : une fiche non publique n'est pas visible, même si elle est ouverte.
- **Statut** : Implémenté

## UC-A14b — Répondre à un message de contact

- **Acteur** : Administrateur
- **Déclencheur** : onglet « Messages reçus » du portail
- **Scénario principal**
  1. L'administrateur consulte les messages reçus depuis `/contact`.
  2. Si l'expéditeur a fourni une adresse e-mail valide dans le champ « Email ou Téléphone », le bouton « Répondre par e-mail » est disponible.
  3. Il rédige sa réponse et l'envoie. Le visiteur reçoit un e-mail (objet « Re: » suivi de l'objet du message), avec le texte de la réponse et le message d'origine.
  4. Le message affiche la réponse et la date d'envoi. Une nouvelle réponse reste possible.
- **Alternatives et erreurs**
  - Pas d'adresse e-mail valide (téléphone seul, ou texte invalide) : la réponse est impossible, et le message l'indique.
  - Réponse vide : refus avec un message.
  - Envoi mail impossible : l'erreur est affichée et rien n'est marqué comme répondu.
- **Prérequis** : un transport mail réel doit être configuré (`MAIL_MAILER`). Avec `log`, l'e-mail n'est pas délivré.
- **Postconditions** : l'e-mail est remis au transport mail. La réponse et sa date sont enregistrées sur le message. Seule la dernière réponse est conservée.
- **Statut** : Implémenté (sous réserve de la configuration mail)

## UC-A15 — Gérer les paramètres

- **Acteur** : Administrateur
- **Déclencheur** : page « Paramètres »
- **Scénario principal**
  1. **Devise collective** : choisir la devise (CDF ou USD). **À vérifier** : l'étendue exacte du changement (espace administration, portail).
  2. **Profil administrateur** : modifier son nom, son identifiant, son e-mail et son mot de passe. Le changement de mot de passe ne déconnecte pas la session en cours.
  3. **Passerelles Mobile Money** : consulter les opérateurs proposés (Orange Money, M-Pesa, Airtel, Wave, MTN).
  4. **Zone technique** : réinitialiser les données de démonstration. Cette action est désactivée sur une base distante.
- **Statut** : Implémenté. Le bouton de réinitialisation est partiel (désactivé en base distante).

## UC-A16 — Gérer les comptes administrateurs *(principal uniquement)*

- **Acteur** : Administrateur principal
- **Déclencheur** : entrée « Administrateurs » du menu, visible uniquement pour le principal
- **Scénario principal**
  1. **Lister** les administrateurs avec leur rôle, leur statut et leur dernière connexion.
  2. **Créer** un administrateur : nom, identifiant (3 à 32 caractères : lettres minuscules, chiffres, point, tiret, underscore), e-mail facultatif, mot de passe (8 caractères minimum), rôle (administrateur ou principal).
  3. **Modifier** un administrateur : nom, identifiant, e-mail, mot de passe (laisser vide pour ne pas changer), rôle.
  4. **Désactiver** ou **réactiver** un administrateur. Sa session est révoquée immédiatement.
- **Alternatives et erreurs**
  - Identifiant déjà pris, e-mail déjà utilisé : refus avec un message.
  - Le principal tente de se désactiver ou de retirer son propre rôle principal : refus.
  - Il doit toujours rester au moins un principal actif.
  - Mot de passe trop court : refus.
- **Postconditions** : le compte est à jour. Un administrateur désactivé ne peut plus se connecter.
- **Statut** : Implémenté

## UC-A17 — Accès refusé à la gestion des administrateurs

- **Acteur** : Administrateur simple
- **Déclencheur** : tentative d'accès à `/admin/administrateurs` ou à l'API `admins.*`
- **Scénario principal** : la page affiche « Cette page est réservée à l'administrateur principal ». L'API renvoie une erreur, et aucune donnée n'est exposée.
- **Statut** : Implémenté

## UC-A18 — Se déconnecter de l'espace administration

- **Acteur** : Administrateur
- **Déclencheur** : bouton de déconnexion
- **Scénario principal** : la session est révoquée côté serveur. L'administrateur revient à la page de connexion administration.
- **Statut** : Implémenté
