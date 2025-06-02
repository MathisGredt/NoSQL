
# Vitrine Ultra Classe avec MongoDB

---

## Partie 1 – Installation et Déploiement de MongoDB Standalone avec Docker

Ce document décrit les étapes que j'ai suivies pour déployer une base de données MongoDB en mode standalone sur mon NAS via Portainer, ainsi que la configuration associée pour un accès sécurisé.

### 1. Contexte et Objectif

Étant habitué à Docker, j'ai choisi de déployer MongoDB avec Docker Compose dans Portainer. L'objectif est d'avoir une base MongoDB fonctionnelle avec une interface d'administration (mongo-express) accessible depuis l'extérieur, sécurisée par un reverse proxy et certificat SSL.


### 2. Adaptation et amélioration du docker-compose

Après quelques ajustements pour l'adapter à mon environnement NAS, gestion des volumes, et sécurisation des accès, voici le fichier final utilisé :

```
services:

  mongo:
    image: mongo
    container_name: mongo
    restart: always
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6
    volumes:
      - /volume3/docker/nosql:/data/db
    networks:
      - mongo-net

  mongo-express:
    image: mongo-express
    container_name: mongo-express
    restart: always
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: root
      ME_CONFIG_MONGODB_ADMINPASSWORD: Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6
      ME_CONFIG_MONGODB_URL: "mongodb://root:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6@mongo:27017/"
      ME_CONFIG_BASICAUTH: true
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    networks:
      - mongo-net

networks:
  mongo-net:
    driver: bridge
```

### 3. Configuration réseau et accès externe

* J'ai redirigé uniquement le port `27017` (MongoDB) de ma Freebox vers mon NAS afin que mes collègues puissent se connecter à la base depuis Internet.
* J'utilise un sous-domaine que je possédais déjà, pointé vers mon IP publique.
* Sur mon NAS Synology, j'ai obtenu un certificat Let's Encrypt pour ce sous-domaine.
* J'ai mis en place un reverse proxy qui redirige directement le trafic HTTPS (port 443) vers l'interface Mongo Express, accessible via `https://mongo.valentinlamine.fr/` sans exposer le port 8081.

### 4. Résultats

* MongoDB est accessible en standalone depuis l’extérieur.
* Mongo Express est accessible via HTTPS avec authentification basique.
* Mes collègues peuvent maintenant se connecter et manipuler la base à distance.

---

## Partie 2 – Développement de la Vitrine Node.js + MongoDB

Une vitrine web élégante et minimaliste, réalisée avec **HTML/CSS/JS côté client** et un **backend Node.js + Express** connecté à **MongoDB** pour stocker des messages utilisateurs.

### Structure du projet

```
.
├── docs/
│   └── install-standalone.md     # Documentation d'installation MongoDB standalone
├── mongo/
│   └── standalone/
│       └── docker-compose.yml    # Déploiement MongoDB via Docker Compose
├── node_modules/                # Modules Node.js installés
├── pages/
│   └── index.html               # Page HTML principale (frontend)
├── .gitignore                   # Fichiers/dossiers ignorés par Git
├── package.json                 # Dépendances et scripts npm
├── package-lock.json            # Fichier de verrouillage des dépendances
├── README.md                    # Documentation du projet
├── index.js                     # Serveur Node.js simple
└── server.js                    # Backend Express + Mongoose
```

---

### Étapes de mise en place

#### 1. Cloner le projet

```bash
git clone https://github.com/MathisGredt/NoSQL
```

Ou crée un dossier manuellement et place les fichiers dedans.

#### 2. Initialiser le projet Node.js

```bash
npm init -y
```

#### 3. Installer les dépendances

```bash
npm install express mongoose cors dotenv
npm install --save-dev nodemon
```

#### 4. Créer un serveur simple (optionnel pour test)

Créer un fichier `index.js` :

```js
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello, mon serveur Node.js fonctionne !');
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
```

Scripts à ajouter dans `package.json` :

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

#### 5. Lancer le backend principal

```bash
node server.js
```

Accès backend : [http://localhost:8081](http://localhost:8081)

#### 6. Lancer le frontend

Ouvre le fichier `pages/index.html` dans ton navigateur.

> Le frontend contient un bouton permettant d’envoyer un message via `fetch()` vers le backend Node + MongoDB.

---

### Fichier `.gitignore`

```
node_modules/
.idea
```

---

## API disponibles

| Méthode | URL             | Description                  |
| ------: | --------------- | ---------------------------- |
|     GET | `/api/messages` | Récupère les 5 derniers JSON |

### Format POST attendu

```json
{
  "text": "RANDOM JSON"
}
```

---

## Technologies utilisées

* **Frontend** : HTML5, CSS3, JavaScript (vanilla)
* **Backend** : Node.js + Express
* **Base de données** : MongoDB via Mongoose
* **Librairies** : `cors`, `dotenv`

---


## Autres fichiers utiles

* `docs/install-standalone.md` : guide d'installation locale de MongoDB
* `mongo/standalone/docker-compose.yml` : configuration MongoDB via Docker
