# Neon Arcade

Plateforme React/TypeScript de mini-jeux, publiée sur GitHub Pages. Les jeux restent accessibles en invité sans limite. Les comptes facultatifs et les sauvegardes en ligne utilisent Cloudflare Workers et D1.

## Jouer et sauvegarder

- En invité, les scores, pièces, objets, niveaux et préférences restent dans le navigateur.
- Le bouton **Se connecter / créer un compte** sur l’accueil active la sauvegarde en ligne. À l’inscription, vous pouvez importer la progression locale dans le nouveau compte.
- L’adresse e-mail sert d’identifiant, sans vérification par e-mail. Conservez le **code de secours** affiché à l’inscription. Il permet de remplacer le mot de passe et est renouvelé après récupération ; aucun e-mail n’est envoyé.
- La connexion est conservée dans l’onglet pendant sept jours au maximum. Sur un autre appareil ou dans un nouvel onglet, connectez-vous avec les mêmes identifiants.
- L’état de synchronisation, **Sauvegarder maintenant** et **Recharger la sauvegarde** figurent sur l’accueil et dans les réglages.
- Les réglages permettent de changer le mot de passe, renouveler le code de secours et supprimer le compte.

Les changements sont sauvegardés après un délai de trois secondes, avec une vérification périodique toutes les quinze secondes. Les sauvegardes en attente sont conservées dans l’onglet pour être réessayées après une coupure. Une version plus récente sur un autre appareil bloque les écritures : le rechargement de cette sauvegarde demande une confirmation. Il est préférable de terminer la sauvegarde d’un appareil avant de continuer sur un autre.

Le chat, le classement mondial, le multijoueur en ligne et le générateur Gemini restent désactivés. Les scores et pièces sont calculés dans le navigateur et ne constituent pas une preuve anti-triche.

## Développement

Node.js 22 ou supérieur.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3000.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Les dépendances sont verrouillées. `dist/` contient le site statique. Les tests du site utilisent Vitest ; les anciens tests des règles Supabase utilisent seulement une base PostgreSQL locale en mémoire, sans connexion distante.

## Comptes Cloudflare

Voir [cloudflare/README.md](cloudflare/README.md) pour les commandes, le schéma D1, l’authentification et les tests sous Miniflare/workerd. L’API publique est `https://neon-arcade-api.vincentcarlin-neon.workers.dev` et sa base est limitée à la juridiction UE. La base n’est jamais accessible directement depuis le navigateur : l’API identifie chaque compte par un jeton de session et vérifie la version de chaque sauvegarde.

Le serveur utilise scrypt avec sel aléatoire pour les mots de passe, des sessions aléatoires dont seules les empreintes sont stockées, et un code de secours utilisable une fois. Les tentatives de connexion sont limitées et les sessions expirées sont nettoyées chaque jour. Aucun secret Cloudflare n’est intégré au site.

Les comptes Supabase de l’ancienne version ne sont pas migrés. Il faut créer un nouveau compte Cloudflare ; la progression locale de l’appareil peut être importée lors de sa création. Les fichiers `supabase/` et le code du client historique restent archivés et inactifs. `GUEST_MODE` désactive ces anciens services tout en laissant l’accès invité illimité ; les comptes Cloudflare sont indépendants de cette constante.

## Publication

Le workflow `.github/workflows/deploy.yml` contrôle le site et l’API puis publie le site statique depuis `main` avec GitHub Pages. Aucune variable Supabase n’est nécessaire pour cette version. Le serveur Workers est déployé séparément ; aucun jeton Cloudflare n’a été ajouté à GitHub. Si l’URL du site change, il faut modifier `APP_ORIGIN` dans la configuration Workers et redéployer l’API.

Effacer les données du navigateur efface la progression invitée et peut supprimer les sauvegardes locales en attente. Une sauvegarde déjà synchronisée reste disponible en se reconnectant. Une perte simultanée du mot de passe et du code de secours ne permet pas de récupération automatique.
