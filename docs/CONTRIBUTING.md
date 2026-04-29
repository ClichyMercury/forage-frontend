# Contribuer à ForageCI Frontend

Bienvenue ! Ce document décrit le workflow Git, les règles à respecter et les
procédures de récupération en cas d'incident sur le repo `forage-frontend`.

> **À lire en entier avant ton premier commit.** La majorité des incidents Git
> sur ce projet viennent du non-respect des règles ci-dessous — pas d'un manque
> de compétence, mais d'un raccourci pris dans la précipitation.

---

## 📚 Stack technique

- **Framework** : SvelteKit 2 + Svelte 5 (runes : `$state`, `$derived`, `$effect`, `$props`)
- **Build** : Vite 8
- **Langage** : TypeScript
- **Styles** : Tailwind CSS v4 (via `@tailwindcss/vite`)
- **HTTP** : Axios
- **Carte** : Leaflet
- **Package manager** : npm (utilise `package-lock.json`)
- **Déploiement** : Vercel — https://forage-frontend.vercel.app/

---

## 🌿 Workflow de contribution

**Règle d'or : on ne pousse JAMAIS directement sur `main`.**

`main` est protégée par une branch protection ruleset GitHub :
- ✅ Require a pull request before merging (1 approval requise)
- ✅ Require review from Code Owners (`@ClichyMercury`)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Block force pushes
- ✅ Restrict deletions

Toute tentative de push direct sur `main` sera **rejetée par GitHub**.

### Étapes pour contribuer

1. **Se mettre à jour** depuis le dernier `main` :
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Créer une branche feature** depuis `main` (jamais depuis une autre branche
   feature) :
   ```bash
   git checkout -b feat/nom-de-la-feature
   # ou
   git checkout -b fix/description-du-bug
   ```

   Conventions de nommage : `feat/...`, `fix/...`, `chore/...`, `docs/...`,
   `refactor/...`.

3. **Faire ses modifications**, tester localement :
   ```bash
   npm run dev          # serveur dev local sur http://localhost:5173
   npm run check        # validation types + lint Svelte (DOIT passer)
   npm run build        # build prod (DOIT passer)
   ```

4. **Commiter avec un message clair** (pas `"les dernières modifications"`) :
   ```bash
   git add src/path/du/fichier.svelte src/path/autre.ts
   git commit -m "feat(scope): courte description impérative"
   ```

   Exemples de bons messages :
   - `feat(profile): add avatar upload with image preview`
   - `fix(dashboard): prevent infinite loop in $effect on periode change`
   - `chore(api): read base URL from VITE_API_BASE_URL env var`

5. **Pousser la branche** :
   ```bash
   git push -u origin feat/nom-de-la-feature
   ```

6. **Ouvrir une Pull Request** sur GitHub vers `main` :
   - Titre court (< 70 caractères)
   - Description : ce que ça change, pourquoi, comment tester
   - Capture d'écran si changement UI

7. **Attendre la review** de `@ClichyMercury`. Répondre aux remarques en
   poussant des commits supplémentaires sur la même branche. La PR sera mergée
   par le owner après validation.

---

## 🚫 Règles à NE JAMAIS enfreindre

Ces règles existent à cause d'incidents passés. Les violer = casser le projet
pour toute l'équipe.

### 1. ❌ Ne JAMAIS faire `git init` dans un repo déjà cloné

**Pourquoi** : ça crée une nouvelle histoire Git non liée à `origin/main`.
Tu te retrouves avec deux arbres parallèles, et la résolution se fait à la
main fichier par fichier (incident vécu sur ce repo : 11 fichiers en conflit).

**À la place** : si Git semble cassé, fais `git status`, demande au owner.

### 2. ❌ Ne JAMAIS faire `git push --force` sur une branche partagée

**Pourquoi** : tu écrases l'historique du remote. Si quelqu'un avait basé son
travail sur cette branche, son travail disparaît.

**Quand c'est OK** : seulement sur ta propre branche feature, jamais sur
`main` ni `develop`. Même là, préfère `git push --force-with-lease` qui te
protège si quelqu'un d'autre a poussé entre-temps.

### 3. ❌ Ne JAMAIS faire `git add .` ou `git add -A` à l'aveugle

**Pourquoi** : risque de commiter accidentellement :
- Un fichier `.env` avec des secrets (clés API, tokens Vercel, etc.)
- Des dumps de logs ou de DB locale
- Des `node_modules` ou des binaires

**À la place** : `git add chemin/specifique/fichier.ts` ou utilise
`git status` puis stage explicitement les fichiers attendus.

### 4. ❌ Ne JAMAIS toucher aux fichiers de config sans demander

Fichiers concernés :
- `vite.config.ts`, `svelte.config.js`, `tsconfig.json`
- `package.json`, `package-lock.json` (sauf ajout de dépendance via `npm install`)
- `.env.example`, `.gitignore`, `.npmrc`
- Tout fichier sous `.github/`

**Pourquoi** : un changement de config peut casser le build sur Vercel sans
être visible en local.

### 5. ❌ Ne JAMAIS pousser du code qui ne build pas

Avant chaque commit, **obligatoire** :
```bash
npm run check   # 0 errors attendu
npm run build   # build doit terminer sans erreur
```

Si `check` ou `build` échoue, **on ne push pas**. On corrige d'abord.
Vercel rejettera le déploiement de toute façon, et `main` sera en état cassé.

### 6. ❌ Ne JAMAIS commiter `.env` ou un fichier contenant des secrets

Le `.gitignore` couvre `.env` et `.env.*`, mais reste vigilant si tu crées
des fichiers `secrets.json`, `credentials.local.ts`, etc.

**Si tu as commité un secret par erreur** : préviens immédiatement
`@ClichyMercury`. Le secret doit être révoqué et l'historique nettoyé. Ne tente
pas de réparer seul.

---

## 🆘 Procédures de récupération

### J'ai commité par erreur sur `main` (avant de push)

```bash
# 1. Sauvegarder le commit dans une nouvelle branche
git branch feat/mes-changements

# 2. Annuler le commit sur main (garde les fichiers)
git reset --soft HEAD~1   # garde les changements staged
# OU
git reset HEAD~1          # garde les changements unstaged

# 3. Continuer le travail sur la branche feature
git checkout feat/mes-changements
```

### J'ai un conflit lors d'un `git pull` ou `git merge`

```bash
# 1. NE PAS PANIQUER. NE PAS faire reset --hard.
# 2. Voir les fichiers en conflit
git status

# 3. Ouvrir chaque fichier conflictuel, chercher les marqueurs :
#    <<<<<<< HEAD
#    ... ta version ...
#    =======
#    ... version distante ...
#    >>>>>>> origin/main
#
# 4. Choisir/fusionner manuellement, supprimer les marqueurs.
# 5. git add fichier_resolu.ts
# 6. git commit (ou git merge --continue)

# Si tu veux abandonner le merge :
git merge --abort
```

Si tu n'es pas sûr → **ping `@ClichyMercury` avant de toucher à quoi que ce
soit**. Un merge raté qu'on n'a pas committé est récupérable. Un
`reset --hard` panique-driven ne l'est pas toujours.

### Mon `npm run build` échoue alors qu'il marchait avant

```bash
# 1. Nettoyer les caches
rm -rf .svelte-kit node_modules/.vite

# 2. Réinstaller les deps
rm -rf node_modules package-lock.json
npm install

# 3. Retenter
npm run check && npm run build
```

Si ça échoue toujours → ouvrir un issue ou ping owner avec le log d'erreur
complet.

---

## 🔐 Variables d'environnement

Frontend = client-side, donc **toutes les variables visibles dans le navigateur**
doivent être préfixées `VITE_` (sinon SvelteKit ne les expose pas au client).

### `.env.local` (local dev)

À créer à la racine, **NON COMMITTÉ** :

```env
VITE_API_BASE_URL=http://localhost:3333/api/v1
```

### Vercel (production)

À configurer dans **Vercel Dashboard → Project → Settings → Environment Variables** :

| Nom | Valeur prod | Scope |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.forage.wharpe.com/api/v1` | Production, Preview |

**Note** : `.env.example` à la racine du repo documente les variables requises.
Si tu en ajoutes une, mets à jour `.env.example` dans le même commit.

---

## 🚀 Workflow de déploiement

1. **PR mergée sur `main`** par le owner
2. **Vercel détecte le push** sur `main` automatiquement
3. **Vercel lance le build** (`npm install` + `npm run build`)
4. **Si le build passe** → déploiement automatique sur https://forage-frontend.vercel.app/
5. **Si le build échoue** → le déploiement précédent reste actif, le owner reçoit une notif

Vercel utilise `@sveltejs/adapter-auto` qui détecte automatiquement la
plateforme (pas besoin d'adapter explicite).

### Preview deployments

Chaque PR ouverte génère automatiquement un **preview deployment** Vercel avec
une URL `forage-frontend-<hash>.vercel.app`. Utilise-le pour valider visuellement
ton changement avant le merge.

---

## ❓ En cas de doute

**Toujours préférer demander avant d'agir.** Ce projet a déjà eu deux incidents
Git majeurs (un côté backend, un côté frontend) qui auraient été évités par
30 secondes de question Slack.

Contact : `@ClichyMercury` (Gaël Sassan, owner du projet)
