# Cas d'usage — RoundPay

RoundPay est une application de cotisations collectives : appels de fonds obligatoires par groupe, collectes libres et dons, avec paiement Mobile Money.

Ce dossier décrit ce que chaque acteur peut faire, espace par espace.

| Fichier | Espace | Acteurs |
|---|---|---|
| [public.md](public.md) | Portail public (`/`, `/fiche/:id`, `/contact`) | Visiteur anonyme |
| [membre.md](membre.md) | Espace membre (`/login`, `/client/*`) | Membre cotisant |
| [admin.md](admin.md) | Espace administration (`/admin/*`) | Trésorier, administrateur, administrateur principal |

## Acteurs

- **Visiteur** : personne sans compte, sur le portail public.
- **Membre** : personne inscrite dans un groupe, connectée par téléphone et code PIN (4 chiffres).
- **Administrateur** : compte distinct des membres, connecté par identifiant et mot de passe.
- **Administrateur principal** : administrateur qui peut en plus gérer les autres comptes administrateurs. Créé automatiquement par le système (migration).

## Conventions

Chaque cas d'usage suit le même modèle :

- **Acteur** et **Déclencheur**
- **Préconditions** : ce qui doit être vrai avant
- **Scénario principal** : les étapes nominales
- **Alternatives et erreurs** : cas particuliers et messages attendus
- **Postconditions** : état après réussite
- **Statut** :
  - `Implémenté` : fonctionnel de bout en bout ;
  - `Partiel` : fonctionnel avec une limite ;
  - `Simulé` : l'interface affiche une confirmation, mais rien n'est envoyé ou enregistré côté serveur.

## Modes de paiement

Le backend choisit le fournisseur via `PAYMENT_GATEWAY` :

- `local` : le paiement est enregistré immédiatement comme **validé**. Aucun appel externe. C'est le mode par défaut.
- `maishapay` ou `flexpay` : le paiement est enregistré **en attente**, puis validé ou rejeté par le callback du fournisseur. L'écran affiche alors « demande envoyée » tant que la confirmation n'est pas reçue. Ce mode nécessite des identifiants marchands réels et une URL de callback publique en HTTPS.

## Limites connues (à lire avant de présenter l'application)

| Fonction | Statut | Détail |
|---|---|---|
| Relance des retardataires (e-mail) | Partiel | Un e-mail est envoyé à chaque membre en retard qui a une adresse e-mail. Les membres sans e-mail ne peuvent pas être joints, et l'écran l'indique. **Il faut configurer un vrai transport mail** : avec `MAIL_MAILER=log` (valeur par défaut), rien n'est délivré. Les relances par SMS ou WhatsApp ne sont pas implémentées. |
| Formulaire de contact du portail | Implémenté | Les messages sont enregistrés et consultables dans l'onglet « Messages reçus » du portail. L'administration peut y répondre par e-mail si le visiteur a fourni une adresse valide. Limité à 3 envois par 15 minutes et par adresse IP. Aucun e-mail n'est envoyé à l'équipe à la réception : il faut consulter l'espace admin. |
| Passage d'une fiche au statut « terminée » | Implémenté | Bouton « Terminer » sur une fiche ouverte. Une fiche terminée n'accepte plus de paiements et ne peut pas être réactivée depuis l'interface. |
| Paiements Mobile Money externes | Partiel | Fonctionnels seulement avec des identifiants marchands réels. Testés en simulation uniquement. |
| Réinitialisation des données de démo | Partiel | Désactivée sur une base distante. |
| Réinitialisation du mot de passe administrateur par e-mail | Non implémenté | Un principal peut changer le mot de passe d'un admin depuis la page Administrateurs. |
