# Cas d'usage — Espace membre

Acteur principal : **Membre cotisant**, inscrit dans au moins un groupe par un administrateur.
Pages : `/login` (connexion), `/client/dashboard`, `/client/profil`, `/client/profil/compte`, `/client/profil/historique`, `/client/profil/apropos`.

Un membre se connecte avec **son téléphone** et son **code PIN à 4 chiffres**. Un compte administrateur ne peut jamais se connecter ici.

---

## UC-M01 — Se connecter

- **Acteur** : Membre
- **Déclencheur** : ouverture de `/login`
- **Préconditions** : le membre est enregistré et a un PIN
- **Scénario principal**
  1. Le membre saisit son numéro de téléphone. Le format international est accepté (`+243…`, `+221…`, etc.).
  2. Il saisit son PIN à 4 chiffres.
  3. Il valide. L'application ouvre son tableau de bord.
- **Alternatives et erreurs**
  - Téléphone ou PIN incorrect : « Numéro de téléphone ou code PIN incorrect. Veuillez vérifier ou contacter votre administrateur. »
  - Erreur réseau : « Une erreur réseau est survenue lors de l'authentification. »
  - Un administrateur tente de se connecter ici : refus, puisque les administrateurs n'ont pas de téléphone membre.
  - Un bouton « Comptes démo » remplit le formulaire (usage démonstration uniquement).
- **Postconditions** : session membre ouverte sur l'appareil, chiffrée localement.
- **Statut** : Implémenté

## UC-M02 — Se déconnecter

- **Acteur** : Membre
- **Déclencheur** : bouton « Déconnexion » dans le profil
- **Scénario principal** : une confirmation est demandée (« Confirmer la déconnexion ? »). Après validation, le jeton de session est révoqué côté serveur et supprimé de l'appareil.
- **Postconditions** : le membre revient à la page de connexion.
- **Statut** : Implémenté

## UC-M03 — Consulter son tableau de bord

- **Acteur** : Membre
- **Déclencheur** : connexion réussie, ou ouverture de `/client/dashboard`
- **Scénario principal**
  1. Le membre voit ses **fiches obligatoires** : groupe concerné, montant imposé, date d'échéance.
  2. Pour chaque fiche, il voit le montant déjà payé, le reste dû et son statut (payé, reste dû).
  3. Il voit son **solde d'avance** (portefeuille).
  4. Il voit les collectes libres ouvertes auxquelles il peut contribuer.
- **Alternatives** : aucune fiche active : le tableau de bord l'indique.
- **Postconditions** : aucune donnée modifiée.
- **Statut** : Implémenté

## UC-M04 — Régler une échéance par Mobile Money

- **Acteur** : Membre
- **Déclencheur** : bouton « Régler l'échéance exacte » sur une fiche obligatoire ouverte
- **Préconditions** : fiche obligatoire ouverte, reste dû supérieur à zéro
- **Scénario principal**
  1. Le membre choisit le montant : l'échéance exacte, ou l'échéance avec un ou deux mois d'avance.
  2. Il choisit son opérateur Mobile Money.
  3. Il valide.
  4. Le paiement est enregistré et le reste dû est mis à jour.
- **Alternatives et erreurs**
  - Mode `local` : le paiement est validé immédiatement.
  - Mode passerelle : le paiement est en attente. L'écran affiche « demande envoyée », puis le statut définitif après confirmation de l'opérateur.
  - Le montant « avance » excédentaire est crédité au portefeuille d'avance.
  - Fiche fermée entre-temps : refus avec un message d'erreur, aucun paiement créé.
- **Postconditions** : un paiement validé ou en attente apparaît dans l'historique du membre.
- **Statut** : Implémenté en mode `local`. Partiel en mode passerelle (simulé en test).

## UC-M05 — Faire un don libre par Mobile Money

- **Acteur** : Membre
- **Déclencheur** : bouton « Faire un don par Mobile Money » sur une collecte libre ouverte
- **Scénario principal** : même déroulement que [UC-P04](public.md#uc-p04--faire-un-don-sur-une-collecte-libre). Le membre peut choisir de donner anonymement.
- **Postconditions** : le don apparaît dans l'historique du membre. Si le don est anonyme, il n'apparaît pas au nom du membre sur la collecte publique.
- **Statut** : Implémenté en mode `local`. Partiel en mode passerelle.

## UC-M06 — Recharger son portefeuille d'avance

- **Acteur** : Membre
- **Déclencheur** : bouton « Recharger » sur le portefeuille d'avance
- **Scénario principal** : le membre ajoute des fonds à son solde d'avance. Ce solde servira à couvrir les prochaines échéances.
- **Alternatives** : une recharge par passerelle reste en attente jusqu'à confirmation.
- **Statut** : Implémenté en mode `local`. Partiel en mode passerelle.

## UC-M07 — Consulter son historique et télécharger un reçu

- **Acteur** : Membre
- **Déclencheur** : ouverture de `/client/profil/historique`
- **Scénario principal**
  1. Le membre voit la liste de ses versements, avec date, montant, collecte et statut.
  2. Les paiements en attente sont clairement distingués des paiements validés.
  3. Le cumul versé est affiché en haut de page.
  4. Pour un paiement **confirmé**, le membre télécharge le reçu PDF.
- **Alternatives** : un paiement en attente ou échoué n'a pas de reçu PDF.
- **Postconditions** : aucune donnée modifiée.
- **Statut** : Implémenté

## UC-M08 — Consulter son compte

- **Acteur** : Membre
- **Déclencheur** : ouverture de `/client/profil/compte`
- **Scénario principal** : le membre voit son matricule, son nom, son numéro de téléphone, son solde d'avance et les groupes auxquels il appartient. Si aucun groupe ne lui est attribué, la page l'indique.
- **Statut** : Implémenté (consultation). **À vérifier** : le membre ne peut pas modifier ses informations depuis cet écran. Les modifications passent par un administrateur.

## UC-M09 — Consulter le profil et les informations de l'application

- **Acteur** : Membre
- **Déclencheur** : ouverture de `/client/profil` ou `/client/profil/apropos`
- **Scénario principal** : le membre accède à ses informations personnelles, à son historique, et à la page « À propos » (version de l'application, mention de sécurité et de confidentialité locale).
- **Statut** : Implémenté

## UC-M10 — Changer son code PIN

- **Acteur** : Membre
- **Déclencheur** : demande auprès de l'administrateur
- **Scénario principal** : le membre ne change pas son PIN lui-même. L'administrateur le réinitialise depuis la fiche du membre (voir [admin.md](admin.md), UC-A03).
- **Statut** : Partiel. Pas de changement de PIN en libre-service.

## Cas d'erreur transverses

- **Session expirée ou révoquée** (par déconnexion, ou désactivation par un administrateur) : le membre est renvoyé à la page de connexion.
- **Perte de connexion** : un indicateur hors ligne s'affiche. Les actions qui écrivent (paiement, don) exigent une connexion.
