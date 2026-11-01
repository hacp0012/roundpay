# Cas d'usage — Portail public

Acteur principal : **Visiteur** (sans compte).
Pages : `/` (accueil), `/fiche/:id` (détail d'une collecte), `/contact` (à propos et contact).

Seules les collectes **ouvertes** et **publiques** sont visibles. Une collecte fermée, archivée ou non publique renvoie « Fiche introuvable ou fermée ».

---

## UC-P01 — Consulter les collectes en cours

- **Acteur** : Visiteur
- **Déclencheur** : ouverture de `/`
- **Préconditions** : aucune connexion requise
- **Scénario principal**
  1. Le visiteur ouvre le portail.
  2. Le portail affiche le nom du collectif, le slogan et le message d'accueil (paramètres du portail).
  3. Il voit la liste des collectes ouvertes au public, avec le montant déjà collecté et la cible.
  4. Il voit le total mobilisé et des indicateurs de transparence.
- **Alternatives et erreurs**
  - Aucune collecte publique : la liste est vide.
  - Chargement en cours : « Chargement des collectes publiques... ».
- **Postconditions** : aucune donnée modifiée.
- **Statut** : Implémenté

## UC-P02 — Consulter le détail d'une collecte

- **Acteur** : Visiteur
- **Déclencheur** : clic sur une collecte, ou ouverture directe de `/fiche/:id`
- **Préconditions** : la collecte est ouverte et publique
- **Scénario principal**
  1. Le visiteur voit le titre, le motif, le bénéficiaire et la catégorie.
  2. Il voit l'état de la cagnotte : montant collecté, cible, pourcentage.
  3. Il consulte la liste des contributions enregistrées (noms affichés, sauf dons anonymes).
- **Alternatives et erreurs**
  - Collecte fermée, archivée, non publique ou inexistante : message « Fiche introuvable ou fermée ». Aucune donnée n'est révélée.
  - Le lien « Retour aux collectes » ramène à l'accueil.
- **Postconditions** : aucune donnée modifiée.
- **Statut** : Implémenté

## UC-P03 — Partager une collecte

- **Acteur** : Visiteur
- **Déclencheur** : bouton « Partager la fiche »
- **Scénario principal** : le visiteur partage le lien de la collecte avec un tiers.
- **Statut** : À vérifier. Le bouton est présent sur la page de détail, mais son comportement exact (feuille de partage native ou copie du lien) n'a pas été vérifié.

## UC-P04 — Faire un don sur une collecte libre

- **Acteur** : Visiteur
- **Déclencheur** : bouton « Faire une contribution » sur le détail d'une collecte libre
- **Préconditions** : collecte libre ouverte et publique
- **Scénario principal**
  1. Le visiteur ouvre la fenêtre de contribution.
  2. Il choisit un montant.
  3. Il choisit son opérateur Mobile Money (Orange Money, M-Pesa, Airtel, Wave, MTN).
  4. Il saisit son numéro si le mode de paiement l'exige (passerelle réelle).
  5. Il peut choisir de rester anonyme.
  6. Il valide.
  7. Le système enregistre la contribution et affiche la référence renvoyée par le serveur.
- **Alternatives et erreurs**
  - Mode `local` : la contribution est validée immédiatement, et le reçu s'affiche.
  - Mode passerelle : la contribution est **en attente**. L'écran affiche « demande envoyée » et non « validé », tant que le fournisseur n'a pas confirmé.
  - Numéro manquant pour une passerelle réelle : le paiement est refusé avec un message explicite.
  - Montant invalide ou collecte devenue fermée entre-temps : refus avec un message d'erreur.
  - Échec du fournisseur : la contribution passe en « échoué ».
- **Postconditions**
  - Mode `local` : une contribution validée est ajoutée à la collecte.
  - Mode passerelle : une contribution en attente est créée. Elle devient validée ou échouée après le callback, qui est vérifié par jeton, montant et devise. Le callback reçu deux fois ne crédite pas deux fois.
- **Statut** : Implémenté en mode `local`. Partiel en mode passerelle (simulé en test, sans transaction réelle).

## UC-P05 — Imprimer le reçu d'une contribution

- **Acteur** : Visiteur qui vient de contribuer
- **Déclencheur** : bouton « Imprimer reçu » dans la fenêtre de confirmation
- **Scénario principal** : le reçu affiche le contributeur, la date et l'heure, la collecte, le mode de paiement, le montant et la référence de transaction. Le visiteur l'imprime depuis le navigateur.
- **Alternatives** : un reçu n'est proposé que pour un paiement confirmé. Un paiement en attente n'a pas de reçu définitif.
- **Statut** : Implémenté

## UC-P06 — Lire la présentation et les coordonnées

- **Acteur** : Visiteur
- **Déclencheur** : menu « À propos & Contact » ou page `/contact`
- **Scénario principal** : le visiteur lit la présentation du collectif, la règle de transparence (comptabilité contrôlée collégialement) et les coordonnées de contact définies par l'administration.
- **Statut** : Implémenté

## UC-P07 — Envoyer un message au collectif

- **Acteur** : Visiteur
- **Déclencheur** : envoi du formulaire de contact (`/contact`)
- **Scénario principal** : le visiteur saisit son nom, son objet, éventuellement un contact (e-mail ou téléphone), et son message, puis valide.
- **Résultat** : le message est enregistré et apparaît dans l'onglet « Messages reçus » de la page Portail de l'espace administration. Le visiteur voit une confirmation.
- **Alternatives et erreurs**
  - Nom ou message vide : le formulaire indique ce qui manque.
  - Message de plus de 2000 caractères : refus avec un message explicite.
  - Erreur réseau : un message d'erreur s'affiche et le texte saisi est conservé.
  - Trop d'envois : au maximum **3 messages par tranche de 15 minutes et par adresse IP**. Au-delà, un message indique le délai d'attente. Chaque tentative compte, même si le formulaire est invalide.
- **Postconditions** : un enregistrement est créé dans les messages reçus de l'administration.
- **Statut** : Implémenté. Aucun e-mail n'est envoyé à l'équipe : l'administration doit consulter l'onglet « Messages reçus ».

## UC-P08 — Installer l'application

- **Acteur** : Visiteur sur mobile ou ordinateur
- **Déclencheur** : bouton d'installation PWA
- **Scénario principal** : le visiteur installe RoundPay comme application sur son appareil. L'application reste consultable hors ligne (indicateur de connexion affiché).
- **Statut** : Implémenté (installation et indicateur hors ligne). À vérifier sur les appareils cibles.

## UC-P09 — Accéder à son espace

- **Acteur** : Visiteur qui est membre ou administrateur
- **Déclencheur** : liens « Espace Membre » et « Espace Trésorier » du portail
- **Scénario principal** : le lien mène à la page de connexion correspondante (voir [membre.md](membre.md) et [admin.md](admin.md)).
- **Statut** : Implémenté
