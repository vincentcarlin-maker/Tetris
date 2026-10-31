# Neon Arcade

Plateforme de mini-jeux React/TypeScript. Node.js 22 ou supérieur.

## Développement

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir http://localhost:3000. Sans configuration Supabase, les jeux restent accessibles en mode invité ; connexion, sauvegarde cloud et administration sont indisponibles.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`dist/` contient le site statique. Les dépendances sont verrouillées dans `package-lock.json`. Les tests incluent une base PostgreSQL locale en mémoire (PGlite), sans toucher aux données distantes.

## GitHub Pages

Le workflow `.github/workflows/deploy.yml` vérifie, compile et publie les changements de `main`. Dans **Settings → Pages**, choisir **GitHub Actions**. Ajouter ces variables de dépôt dans **Settings → Secrets and variables → Actions → Variables** :

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (clé publique `sb_publishable_…`, jamais une clé secrète ou `service_role`).

Seules ces valeurs publiques sont incluses dans le JavaScript. Sans ces variables, le site publié fonctionne en mode invité.

## Configuration Supabase requise pour les comptes

Cette mise à jour remplace l'ancien système de mots de passe par **Supabase Auth**. Il faut installer le nouveau schéma avant d'activer la connexion sur le site.

1. Sauvegarder la base existante et essayer `supabase/security-upgrade.sql` sur une copie/staging. Le script remplace les anciennes politiques des tables du jeu, retire les anciens mots de passe/codes/e-mails du JSON et sépare le répertoire public des profils privés. Il ne modifie pas un projet distant automatiquement.
2. Appliquer le script dans l'éditeur SQL du projet du jeu, puis vérifier les conseillers de sécurité Supabase et les autres fonctions/vues existantes qui ne figurent pas dans l'archive.
3. Activer Email/Password et la confirmation des adresses dans **Authentication**. Configurer le service d'e-mail, les limites et les URL de redirection avec l'URL exacte du site (par exemple `https://vincentcarlin-maker.github.io/Tetris/`). La récupération utilise les liens sécurisés de Supabase ; aucun OTP n'est créé dans le navigateur.
4. Les anciens profils sont conservés avec `user_id = NULL` et ne sont jamais revendiqués automatiquement. Créer un compte Auth avec adresse vérifiée et nouveau mot de passe, puis rattacher son UUID au profil existant depuis l'administration sécurisée/éditeur SQL après vérification de l'identité. Ne pas importer les anciens mots de passe.
5. Attribuer le rôle administrateur avec l'API d'administration Auth, en définissant **`app_metadata.role = "admin"`**, puis renouveler la session. Les champs `user_metadata`, le pseudo et le mode local ne confèrent aucun privilège.

L'application crée les nouveaux profils liés à `auth.users.id` après confirmation de l'adresse. Si un pseudo existe déjà dans les anciens profils, un administrateur doit effectuer le rattachement ; connaître ce pseudo ne donne aucun accès.

## Générateur Gemini côté serveur

La clé Gemini n'est plus transmise au navigateur. Déployer `supabase/functions/neon-generate/index.ts` avec la CLI Supabase, après liaison au bon projet. Configurer uniquement dans les secrets de la fonction :

- `GEMINI_API_KEY`
- `APP_ORIGIN`, par exemple `https://vincentcarlin-maker.github.io` (sans chemin)

`supabase/config.toml` désactive la validation JWT de la passerelle pour cette fonction ; **la fonction vérifie elle-même le jeton utilisateur via `auth.getUser()` et le rôle `app_metadata`** avant tout appel facturé. Les modèles autorisés sont contrôlés côté serveur. Leur disponibilité dépend du compte Gemini.

## Limites

La vérification locale couvre la compilation, le typage, les sauvegardes, la boucle Tetris et les principales règles d'accès en base. Elle ne remplace pas un essai sur le vrai service Auth/e-mail/Gemini. Les scores et pièces restent issus des jeux exécutés côté navigateur : cette architecture ne constitue pas un système anti-triche pour des récompenses réelles.

Si une clé Gemini a déjà été intégrée dans un ancien déploiement, révoquer cette clé et configurer une nouvelle clé uniquement dans les secrets de la fonction.
