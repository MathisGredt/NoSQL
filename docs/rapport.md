+++markdown

# Vitrine Ultra Classe avec MongoDB

---

## Partie 1 – Installation et Déploiement de MongoDB Standalone avec Docker

Ce document décrit les étapes que j'ai suivies pour déployer une base de données MongoDB en mode standalone sur mon NAS via Portainer, ainsi que la configuration associée pour un accès sécurisé.

### 1. Contexte et Objectif

Étant habitué à Docker, j'ai choisi de déployer MongoDB avec Docker Compose dans Portainer. L'objectif est d'avoir une base MongoDB fonctionnelle avec une interface d'administration (mongo-express) accessible depuis l'extérieur, sécurisée par un reverse proxy et certificat SSL.

### 2. Déploiement initial avec un docker-compose simple

```
services:

  mongo:
    image: mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: mysupersecretpassword

  mongo-express:
    image: mongo-express
    restart: always
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: mysupersecretpassword
      ME_CONFIG_MONGODB_URL: mongodb://admin:mysupersecretpassword@mongo:27017/
      ME_CONFIG_BASICAUTH: false
```

### 3. Adaptation et amélioration du docker-compose

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

### 4. Configuration réseau et accès externe

* Redirection du port `27017` de la Freebox vers le NAS
* Utilisation d’un sous-domaine pointé vers l’IP publique
* Certificat Let's Encrypt obtenu via NAS Synology
* Reverse proxy redirigeant le trafic HTTPS (port 443) vers Mongo Express (`https://mongo.valentinlamine.fr/`)

### 5. Résultats

* MongoDB est accessible depuis l’extérieur
* Mongo Express est accessible en HTTPS avec authentification
* Connexion et manipulation à distance par des collègues

---

## Partie 2 – Déploiement Replica Set MongoDB

Déploiement de trois instances MongoDB dans un Replica Set avec authentification sécurisée.

### Docker Compose initial

```yaml
services:

  mongo1:
    image: mongo
    container_name: mongo1
    restart: always
    ports:
      - 27018:27017
    command: ["--replSet", "rs0", "--bind_ip_all"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo1:/data/db
    networks:
      - mongo-replica-net

  mongo2:
    image: mongo
    container_name: mongo2
    restart: always
    ports:
      - 27019:27017
    command: ["--replSet", "rs0", "--bind_ip_all"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo2:/data/db
    networks:
      - mongo-replica-net

  mongo3:
    image: mongo
    container_name: mongo3
    restart: always
    ports:
      - 27020:27017
    command: ["--replSet", "rs0", "--bind_ip_all"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo3:/data/db
    networks:
      - mongo-replica-net

networks:
  mongo-replica-net:
    driver: bridge
```

### Clé d’authentification (keyfile)

```bash
cd /volume3/docker/nosql-replica/
touch mongodb-keyfile
chmod 600 mongodb-keyfile
openssl rand -base64 756 > mongodb-keyfile
chmod 600 mongodb-keyfile
```

### Docker Compose avec clé partagée

```yaml
command: ["--replSet", "rs0", "--bind_ip_all", "--auth", "--keyFile", "/etc/mongo-keyfile/mongodb-keyfile"]
volumes:
  - /volume3/docker/nosql-replica/mongodb-keyfile:/etc/mongo-keyfile/mongodb-keyfile:ro
```

### Permissions

```bash
chown 999:999 /volume3/docker/nosql-replica/mongodb-keyfile
chmod 400 /volume3/docker/nosql-replica/mongodb-keyfile
```

### Initialisation Replica Set

```bash
docker exec -it mongo1 mongosh -u root -p 'Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4' --authenticationDatabase admin
```

```js
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
})
```

### Connexion URI + Préférence de lecture

URI standard :

```
mongodb://root:motdepasse@mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0
```

Lecture secondaire :

```
mongodb://root:motdepasse@mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0&readPreference=secondary
```

---

## Partie 3 – Développement de la Vitrine Node.js + MongoDB

### Structure du projet

```
.
├── docs/
│   └── install-standalone.md     
├── mongo/
│   └── standalone/
│       └── docker-compose.yml    
│   └── replica/
│       └── docker-compose.yml
├── node_modules/                
├── pages/
│   └── index.html               
├── .gitignore                   
├── package.json                 
├── package-lock.json            
├── README.md                    
├── index.js                     
└── server.js                    
```

### Mise en place

```bash
npm init -y
npm install express mongoose cors dotenv
npm install --save-dev nodemon
```

#### `index.js` (serveur simple)

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

#### `package.json`

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

### Lancer le backend principal

```bash
node server.js
```

Accès backend : [http://localhost:8081](http://localhost:8081)

### Lancer le frontend

Ouvre le fichier `pages/index.html` dans le navigateur.

---

## Fichier `.gitignore`

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
* `mongo/standalone/docker-compose.yml` : configuration MongoDB standalone
* `mongo/replica/docker-compose.yml` : configuration Replica Set MongoDB via Docker
