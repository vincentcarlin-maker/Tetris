# API de comptes Neon Arcade

API Workers et D1 pour les comptes facultatifs et les sauvegardes. Le site reste sur GitHub Pages.

## Développement et tests

```sh
npm ci
npm run types -- --include-runtime=false
npm run check
npm run build
npm test
```

Les tests utilisent Miniflare/workerd et D1 local. La date de compatibilité est `2026-10-30`, dernière date acceptée par le binaire workerd installé lors de cette mise à jour.

## Déploiement

Le Worker `neon-arcade-api` et la base `neon-arcade-accounts` sont configurés dans `wrangler.jsonc`. Depuis une machine avec une connexion Cloudflare autorisée :

```sh
npx wrangler d1 migrations apply neon-arcade-accounts --remote
npx wrangler deploy
```

L’URL publique est `https://neon-arcade-api.vincentcarlin-neon.workers.dev`. `APP_ORIGIN` limite les appels navigateur au site GitHub Pages. L’autorisation des sauvegardes repose toujours sur la session, jamais sur un pseudo fourni par le client. Les données D1 sont limitées à la juridiction UE.

Le workflow GitHub vérifie aussi cette API, mais ne la redéploie pas automatiquement : aucun jeton Cloudflare n’a été ajouté aux secrets GitHub. Il publie seulement le site statique. Toute modification serveur doit donc être déployée sur Workers séparément.

## Authentification

- Adresse e-mail comme identifiant, sans vérification par e-mail ; pseudo unique.
- Mot de passe de 12 à 256 caractères ; scrypt N=32768, r=8, p=3, sel aléatoire de 128 bits.
- Jeton de session aléatoire de 256 bits ; seule son empreinte SHA-256 est stockée côté serveur ; expiration après 7 jours.
- Code de secours aléatoire de 192 bits, affiché à la création et remplacé après récupération. Seule son empreinte est stockée. Aucun e-mail n’est envoyé.
- Limitation atomique des tentatives en D1 ; nettoyage quotidien des compteurs et sessions expirés à 03:00 UTC.
- Les anciens comptes Supabase ne sont pas importés. Un nouveau compte peut importer, sur demande de l’utilisateur, la progression locale de ce navigateur.

## Sauvegardes

`GET /me` retourne seulement le compte de la session. `PUT /profile` accepte des champs de progression prédéfinis et une version attendue. Une version périmée renvoie 409 : le client bloque alors les écritures jusqu’au rechargement explicite de la sauvegarde en ligne. Les scores et pièces restent des valeurs de jeu transmises par le navigateur, sans garantie anti-triche.

La session est stockée dans `sessionStorage`, pour fonctionner sur Safari sans cookies tiers. Les sauvegardes en attente restent dans l’onglet et sont réessayées tant qu’il demeure ouvert. L’état invité est sauvegardé séparément avant connexion, puis restauré à la déconnexion. Les données d’un compte ne sont jamais fusionnées automatiquement dans un autre compte existant.
