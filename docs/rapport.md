# Vitrine Ultra Classe avec MongoDB

---

## Partie 1 – Installation et Déploiement de MongoDB Standalone avec Docker

Ce document décrit les étapes que j'ai suivies pour déployer une base de données MongoDB en mode standalone sur mon NAS via Portainer, ainsi que la configuration associée pour un accès sécurisé.

### 1. Contexte et Objectif

Étant habitué à Docker, j'ai choisi de déployer MongoDB avec Docker Compose dans Portainer. L'objectif est d'avoir une base MongoDB fonctionnelle avec une interface d'administration (mongo-express) accessible depuis l'extérieur, sécurisée par un reverse proxy et certificat SSL.

### 2. Déploiement initial avec un docker-compose simple

```yml
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

```yml
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

---


## Partie 4 - Installation et Utilisation de MongoSH et Compass

### 1. Installation de MongoSH

#### Windows
Téléchargez la dernière version de MongoSH depuis le site officiel :

[https://www.mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell)

Ou installez MongoSH globalement avec npm :

```bash
npm install -g mongosh
```

---

### 2. Lancer MongoSH et utiliser une base de données

#### Sélectionner ou créer la base `test`

```
use test
```

Cette commande sélectionne la base `test`. Si elle n'existe pas, elle sera automatiquement créée lors de l'insertion d'un premier document.

---

### 3. Opérations de base avec MongoSH

#### Créer une collection `user` et insérer un document

```
db.user.insertOne({ nom: "Alice", age: 25 })
```

Cette commande crée la collection `user` si elle n'existe pas encore, puis y insère un document.

---

#### Supprimer un document

```
db.user.deleteOne({ nom: "Alice" })
```

Supprime le premier document correspondant au filtre `{ nom: "Alice" }`.

---

#### Supprimer une collection

```
db.user.drop()
```

Supprime entièrement la collection `user` de la base de données.

---

#### Mettre à jour un document

```
db.user.updateOne(
  { nom: "Alice" },
  { $set: { age: 26 } }
)
```

Met à jour le champ `age` du premier document correspondant au filtre `{ nom: "Alice" }`.

---

### Remarques complémentaires

- Les commandes MongoSH sont sensibles à la casse.
- L'utilisation de `insertOne`, `deleteOne`, `updateOne`, et `drop` permet de gérer finement les documents et collections.
- Les commandes présentées ici s'exécutent depuis le shell `mongosh`, une interface interactive en ligne de commande pour MongoDB.

### 4. Installation de MongoDB Compass
Téléchargez MongoDB Compass depuis le site officiel :
[https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
Installez Compass en suivant les instructions pour votre système d'exploitation.
### 5. Utilisation de MongoDB Compass
#### Connexion à une base de données
Ouvrez MongoDB Compass et entrez l'URI de connexion pour votre base de données MongoDB. Par exemple :

![MongoDB Compass Connection](/img/connection-compass.png)
#### Navigation dans les collections
Une fois connecté, vous pouvez naviguer dans les collections de votre base de données. Compass affiche une interface graphique pour visualiser les documents, exécuter des requêtes et gérer les index.
#### Exécution de requêtes

Utilisez la barre de requêtes pour exécuter des requêtes MongoDB. Par exemple, pour trouver tous les utilisateurs qui ont 26 ans :

```json
{ "age": 26 }
```
![MongoDB Compass Query](../img/alice-pas-jeune.png)

#### Ajouter un document

![MongoDB Compass Add Document](/img/add-doc1.png)
![MongoDB Compass Add Document](/img/add-doc2.png)

#### Supprimer un document

![MongoDB Compass Delete Document](/img/del-doc.png)

#### Ajouter et supprimer une collection

Pour ajouter une collection : 
![MongoDB Compass Create Collection](/img/add-col.png)
Pour supprimer une collection, cliquez sur l'icône de la corbeille à côté du nom de la collection dans la liste des collections :
![MongoDB Compass Delete Collection](/img/del-doc.png)


---

# Atelier Redis - Cache et Architecture Distribuée

## Partie 1 – Installation et Déploiement Redis Standalone avec Docker

### 1. Contexte et Objectif

Cette partie fait suite au précédent TP MongoDB, mais cette fois-ci avec un nouveau défi : l'installation et l'intégration de Redis comme système de cache. L'objectif est de découvrir Redis, comprendre son fonctionnement en mode distribué, et l'intégrer dans une application web pour améliorer les performances.

### 2. Déploiement initial avec docker-compose simple

Avant de me lancer dans des déploiements complexes, je commence par la base. Je crée tous mes dossiers nécessaires et teste un premier docker-compose simple :

```yml
services:
  redis:
    image: redis:latest
    container_name: redis-standalone
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --requirepass vivelenosql
    volumes:
      - redis-data:/data
    networks:
      - redis-net

  redis-insight:
    image: redislabs/redisinsight:latest
    container_name: redis-insight
    restart: always
    ports:
      - "8001:8001"
    networks:
      - redis-net

volumes:
  redis-data:

networks:
  redis-net:
    driver: bridge
```

### 3. Tests et première exécution

Je commence donc par une première exécution de ce docker-compose :

![Pull de redis](../img/pull-redis.png)

Puis je teste dans le conteneur les premières commandes Redis :

![Test redis standalone](../img/test-redis-standalone.png)

#### Commandes testées :
```bash
# Connexion au conteneur Redis
docker exec -it redis-standalone redis-cli -a vivelenosql

# Tests de base
SET test "Hello Redis"
GET test
EXPIRE test 60
TTL test
```

### 4. Résultats et observations

* ✅ Redis est correctement déployé et accessible
* ✅ L'authentification fonctionne avec le mot de passe
* ✅ Les commandes de base (SET, GET, EXPIRE) sont opérationnelles
* ⚠️ **Point d'amélioration** : L'interface web RedisInsight devrait tourner sur le port 8001, mais impossible d'y accéder pour le moment. Ce n'est pas bloquant pour la suite du TP.

---

## Partie 2 – Déploiement Redis Replication Master/Slave

### Docker Compose configuration

J'attaque ensuite la partie réplication master/slave. Pour cela, je mets en place ce docker-compose avec un master et deux slaves :

```yml
services:
  redis-master:
    image: redis:latest
    container_name: redis-master
    restart: always
    ports:
      - "6380:6379"
    command: redis-server --requirepass masterpass --masterauth masterpass
    volumes:
      - redis-master-data:/data
    networks:
      - redis-replica-net

  redis-slave1:
    image: redis:latest
    container_name: redis-slave1
    restart: always
    ports:
      - "6381:6379"
    command: redis-server --slaveof redis-master 6379 --requirepass slavepass --masterauth masterpass
    volumes:
      - redis-slave1-data:/data
    networks:
      - redis-replica-net
    depends_on:
      - redis-master

  redis-slave2:
    image: redis:latest
    container_name: redis-slave2
    restart: always
    ports:
      - "6382:6379"
    command: redis-server --slaveof redis-master 6379 --requirepass slavepass --masterauth masterpass
    volumes:
      - redis-slave2-data:/data
    networks:
      - redis-replica-net
    depends_on:
      - redis-master

volumes:
  redis-master-data:
  redis-slave1-data:
  redis-slave2-data:

networks:
  redis-replica-net:
    driver: bridge
```

Après une petite review, la configuration me semble correcte pour mes besoins.

### Initialisation et tests de la réplication

Pour l'initialisation, je commence par exécuter les commandes pour lancer les conteneurs Docker :

```bash
cd redis/replication/
docker-compose up -d
```

Voici les logs de ce que j'ai testé afin de montrer que la réplication est bel et bien fonctionnelle :

![Réplication Redis](../img/replication-redis.png)

#### Tests effectués :
```bash
# Sur le master
docker exec -it redis-master redis-cli -a masterpass
SET replication_test "Data from master"
GET replication_test

# Sur le slave1
docker exec -it redis-slave1 redis-cli -a slavepass
GET replication_test  # ✅ Récupère bien la donnée du master

# Vérification du statut de réplication
INFO replication
```

### Résultats de la réplication

* ✅ **Master** : Écriture et lecture fonctionnelles
* ✅ **Slaves** : Réplication automatique des données depuis le master
* ✅ **Synchronisation** : Les données écrites sur le master apparaissent instantanément sur les slaves
* ✅ **Architecture** : 1 master + 2 slaves opérationnels (j'avoue ne pas avoir testé le deuxième)

---

## Partie 3 – Intégration Cache dans l'Application Node.js

### Structure du projet adaptée

La structure reste similaire au TP MongoDB, avec l'ajout des dossiers Redis :

```
.
├── docs/
│   ├── guide_mongosh.md
│   └── rapport.md
├── redis/                          # ➕ Nouveau dossier
│   ├── standalone/
│   │   └── docker-compose.yml
│   └── replication/
│       └── docker-compose.yml
├── mongo/                          # Existant
├── pages/
│   └── index.html                  # 🔄 Modifié pour Redis
├── server.js                       # 🔄 Modifié pour Redis
└── package.json                    # 🔄 Nouvelles dépendances
```

### Mise en place des dépendances Redis

J'ajoute d'abord les bonnes dépendances pour l'intégration Redis :

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "redis": "^4.6.0"
  }
}
```

```bash
npm install redis
```

### Implémentation du Cache-Aside Pattern

Je modifie mon `server.js` en m'aidant de l'IA (j'avoue, car pas trop le temps de tout faire à la main) pour intégrer le pattern Cache-Aside :

#### Fonctionnalités ajoutées :
- **Connexion Redis** avec gestion d'erreurs
- **Cache-Aside Pattern** : vérifier le cache → si absent, récupérer les données + mettre en cache
- **Statistiques de cache** : hits/misses, taux de réussite
- **Simulation de latence** : 2 secondes pour simuler une base de données lente
- **TTL** : expiration automatique après 60 secondes

#### Nouvelles routes API :
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/slow-data/:id` | Test performance avec cache |
| GET | `/api/cache-stats` | Statistiques du cache |
| GET | `/api/messages-cached` | Messages avec cache (TTL: 30s) |
| DELETE | `/api/cache/:key` | Supprimer une clé du cache |
| DELETE | `/api/cache` | Vider tout le cache |

### Premier lancement et débogage

En faisant mon premier `node server.js`, j'ai d'abord eu quelques bugs de connexion Redis. Après avoir corrigé le mot de passe pour la connexion à Redis, je me retrouve avec dans mon terminal :

```bash
(base) valentinlamine@MacBook-Pro-de-valentin NoSQL % node server.js
Serveur en ligne sur http://localhost:3000
✅ Connecté à MongoDB # Non fonctionnel car j'ai pas relancé les conteneurs pour ce TP
✅ Connecté à Redis
```

### Interface web et tests

Après avoir corrigé la page web (l'IA m'avait ajouté des espaces à chaque balise HTML, donc rien ne marchait), je me retrouve avec le site suivant :

![Test cache Redis](../img/test-cache.png)

#### Fonctionnalités de l'interface :
- **🧪 Test Performance** : Compare les temps de réponse avec/sans cache
- **🔄 Test Multiple** : 5 requêtes consécutives pour voir l'amélioration
- **📊 Statistiques** : Affichage en temps réel des hits/misses
- **💬 Messages Cachés** : Comparaison messages normaux vs cachés
- **🎯 Tests Manuels** : Test d'un ID spécifique

### Résultats et performances observées

L'intégration web fonctionne dans tous les cas. Les tests montrent :

* **1ère requête** : ~2000ms (cache miss + simulation latence)
* **2ème requête** : <10ms (cache hit)
* **Gain de performance** : **200x plus rapide** avec le cache
* **TTL fonctionnel** : Les données expirent après 60 secondes
* **Statistiques précises** : Taux de réussite du cache en temps réel

---

## Conclusion

Cette implémentation de Redis démontre clairement l'intérêt du cache pour améliorer les performances d'une application web. Le gain de **200x** sur les temps de réponse est spectaculaire et justifie totalement l'ajout de cette couche de cache.

L'architecture distribuée (master/slave) assure la disponibilité et la redondance des données, tandis que le pattern Cache-Aside offre une stratégie robuste pour gérer la cohérence entre le cache et la base de données principale.