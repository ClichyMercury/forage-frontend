# ForageCI — Frontend

Interface web de la **Plateforme de Mise en Relation pour Prestations de Forage**.
Solution tripartite : **Client** · **Entreprise prestataire** · **Administrateur**.

> Ce dépôt contient uniquement la partie **frontend** (SvelteKit). Le backend (API REST) est attendu sur `http://localhost:3333/api/v1`.

---

## Contexte

La plateforme digitalise le processus de mise en relation entre demandeurs de forage et entreprises prestataires, avec un administrateur comme tiers de confiance commercial.

- Le **client** soumet une demande avec un budget confidentiel.
- L'**administrateur** valide la demande, sollicite des entreprises, compare les offres et fixe le prix final.
- Les **entreprises** soumettent des offres sans connaître le budget client.
- Le client accepte ou refuse l'offre finale depuis son tableau de bord.

Voir le [cahier des charges fonctionnel](../CDC_Plateforme_Forage.pdf) pour le détail du workflow.

---

## Stack technique

- **SvelteKit 2** + **Svelte 5** (mode runes)
- **Vite 8** (bundler)
- **TailwindCSS 4** (styling)
- **Axios** (client HTTP)
- **Leaflet** (cartographie — localisation des chantiers)
- **TypeScript**

---

## Structure du projet

```
src/
├── app.css, app.html, app.d.ts
├── lib/
│   ├── api.ts              # Client Axios (baseURL, intercepteurs auth/erreurs)
│   ├── stores/             # Stores Svelte 5 (auth, toast, messages, notifications)
│   ├── components/         # Composants UI partagés (layout, ui)
│   └── assets/
└── routes/
    ├── (auth)/             # login, register (client), register-entreprise
    └── (app)/
        ├── client/         # Espace client : demandes, offres reçues, messages
        ├── entreprise/     # Espace prestataire : appels d'offres, mes offres
        └── admin/          # Espace admin : gestion, comparatif, analytics
```

### Modules fonctionnels couverts

| Module | Localisation |
|---|---|
| Authentification (3 rôles) | `routes/(auth)/`, `lib/stores/auth.svelte.ts` |
| Soumission de demandes (avec géolocalisation) | `routes/(app)/client/` + `lib/components/.../MapPicker` |
| Appels d'offres et soumission d'offres | `routes/(app)/entreprise/` |
| Comparaison d'offres et offre finale | `routes/(app)/admin/` |
| Messagerie interne contextuelle | `lib/stores/messages.svelte.ts` |
| Notifications | `lib/stores/notifications.svelte.ts` |
| Tableau de bord analytique admin | `routes/(app)/admin/` |

---

## Prérequis

- **Node.js** ≥ 20
- **npm** (ou pnpm / yarn)
- Le **backend AdonisJS** lancé sur le port `3333` (voir le repo `backend/`)

---

## Installation

```sh
npm install
```

---

## Lancer en développement

```sh
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

Pour ouvrir automatiquement dans le navigateur :

```sh
npm run dev -- --open
```

> ⚠️ Le backend doit être démarré en parallèle sur `http://localhost:3333`. L'URL est définie dans [`src/lib/api.ts`](src/lib/api.ts) (constante `BASE_URL`).

---

## Build de production

```sh
npm run build
npm run preview   # prévisualisation locale du build
```

---

## Vérification de types

```sh
npm run check          # one-shot
npm run check:watch    # mode watch
```

---

## Configuration de l'API

L'URL du backend est codée en dur dans [`src/lib/api.ts`](src/lib/api.ts) :

```ts
export const BASE_URL = 'http://localhost:3333/api/v1'
```

Pour cibler un autre environnement, modifier cette constante (ou la migrer vers une variable d'environnement `PUBLIC_API_URL` via `$env/dynamic/public`).

Le client Axios gère automatiquement :

- l'injection du **token Bearer** depuis le store `auth`
- la **déconnexion automatique** sur 401 (sauf routes non critiques)
- l'affichage de **toasts** sur 403 / 5xx
- les erreurs **422** (validation) sont laissées aux composants

---

## Règles métier critiques (rappel CDC)

Ces règles sont reflétées côté UI et **doivent rester respectées** :

- Le **budget client** ne s'affiche **jamais** côté entreprise.
- Les offres entreprises **ne sont pas visibles entre elles** (pas d'enchères).
- Aucune communication directe **client ↔ entreprise** : la messagerie passe par l'admin.
- Toutes les transitions de statut suivent le workflow : *En attente → Offres en cours → Offre reçue → Acceptée / Refusée / Clôturée*.

---

## Roadmap (Phase 2)

Non couverts dans le périmètre actuel, mais identifiés au CDC :

- Paiement en ligne (acompte / paiement complet, reversement automatique)
- Évaluation des entreprises post-chantier
- Génération de contrats numériques signables
- Application mobile dédiée
