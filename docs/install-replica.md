# Partie 2 – Déploiement Replica Set MongoDB

Pour cette partie, j’ai repris la même logique que pour le déploiement standalone, en utilisant Portainer pour déployer une stack Docker contenant les 3 conteneurs MongoDB. Les ports ont été ouverts afin que chaque instance soit accessible depuis l’extérieur.

---

## Docker Compose initial

Voici la configuration Docker Compose utilisée pour lancer les 3 conteneurs MongoDB dans un Replica Set :

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

> J’ai adapté cette configuration à mon environnement en modifiant les ports, les mots de passe et les volumes de stockage.

---

## Gestion de la clé d’authentification (keyfile)

À la première tentative de démarrage, MongoDB a signalé une erreur concernant l’absence d’un fichier de clé (keyfile) nécessaire pour l’authentification entre membres du Replica Set.

### Création de la clé

Je crée donc une clé d’authentification partagée entre les conteneurs dans le dossier où sont stockées les données des conteneurs :

```bash
cd /volume3/docker/nosql-replica/
touch mongodb-keyfile
chmod 600 mongodb-keyfile
openssl rand -base64 756 > mongodb-keyfile
chmod 600 mongodb-keyfile
```

---

## Modification du Docker Compose avec la clé d’authentification

J’ajoute la clé dans chaque conteneur en montant le fichier dans un dossier accessible, puis je modifie la commande de lancement pour utiliser cette clé et activer l’authentification :

```yaml
services:

  mongo1:
    image: mongo
    container_name: mongo1
    restart: always
    ports:
      - 27018:27017
    command: ["--replSet", "rs0", "--bind_ip_all", "--auth", "--keyFile", "/etc/mongo-keyfile/mongodb-keyfile"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo1:/data/db
      - /volume3/docker/nosql-replica/mongodb-keyfile:/etc/mongo-keyfile/mongodb-keyfile:ro
    networks:
      - mongo-replica-net

  mongo2:
    image: mongo
    container_name: mongo2
    restart: always
    ports:
      - 27019:27017
    command: ["--replSet", "rs0", "--bind_ip_all", "--auth", "--keyFile", "/etc/mongo-keyfile/mongodb-keyfile"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo2:/data/db
      - /volume3/docker/nosql-replica/mongodb-keyfile:/etc/mongo-keyfile/mongodb-keyfile:ro
    networks:
      - mongo-replica-net

  mongo3:
    image: mongo
    container_name: mongo3
    restart: always
    ports:
      - 27020:27017
    command: ["--replSet", "rs0", "--bind_ip_all", "--auth", "--keyFile", "/etc/mongo-keyfile/mongodb-keyfile"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
    volumes:
      - /volume3/docker/nosql-replica/mongo3:/data/db
      - /volume3/docker/nosql-replica/mongodb-keyfile:/etc/mongo-keyfile/mongodb-keyfile:ro
    networks:
      - mongo-replica-net

networks:
  mongo-replica-net:
    driver: bridge
```

---

### Permissions sur le fichier keyfile

MongoDB refuse de démarrer si le fichier keyfile n’a pas les bonnes permissions. J’attribue donc le propriétaire et les droits suivants sur mon NAS :

```bash
chown 999:999 /volume3/docker/nosql-replica/mongodb-keyfile
chmod 400 /volume3/docker/nosql-replica/mongodb-keyfile
```

* Le propriétaire `999` correspond à l’utilisateur MongoDB dans le conteneur.
* Les permissions `400` garantissent que seul root peut lire ce fichier sur le NAS.

---

## Initialisation du Replica Set

Une fois les conteneurs démarrés, je me connecte à l’instance principale (`mongo1`) avec `mongosh` en utilisant les identifiants root et la base d’authentification `admin` :

```bash
docker exec -it mongo1 mongosh -u root -p 'Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4' --authenticationDatabase admin
```

J’initie le Replica Set avec la commande suivante :

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

---

## Vérification du statut du Replica Set

Après initialisation, voici un extrait du statut obtenu :

```json
{
  set: 'rs0',
  myState: 1,
  members: [
    { _id: 0, name: 'mongo1:27017', stateStr: 'PRIMARY' },
    { _id: 1, name: 'mongo2:27017', stateStr: 'SECONDARY' },
    { _id: 2, name: 'mongo3:27017', stateStr: 'SECONDARY' }
  ],
  ok: 1
}
```

---

## Test de réplication

### Insertion sur le primaire

```js
use testdb
db.testcoll.insertOne({ message: "Test réplication", date: new Date() })
```

Réponse :

```json
[
  {
    _id: ObjectId('683da6b622c8661885d861e0'),
    message: 'Test réplication',
    date: ISODate('2025-06-02T13:27:18.580Z')
  }
]
```

### Lecture sur une instance secondaire

Connexion à la seconde instance :

```bash
docker exec -it mongo2 mongosh -u root -p 'Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4' --authenticationDatabase admin
```

Vérification des données :

```js
use testdb
db.testcoll.find().pretty()
```

Résultat :

```json
[
  {
    _id: ObjectId('683da6b622c8661885d861e0'),
    message: 'Test réplication',
    date: ISODate('2025-06-02T13:27:18.580Z')
  }
]
```

---

## Explication simplifiée des modes de lecture/écriture

Dans ce Replica Set MongoDB configuré, nous avons un nœud **PRIMARY** (mongo1) et deux nœuds **SECONDARY** (mongo2 et mongo3).

* **Écriture** : Toutes les opérations d’écriture (insert, update, delete) doivent passer par le nœud PRIMARY. C’est lui qui accepte les modifications et les réplique ensuite aux SECONDARY.
* **Lecture** : Par défaut, les lectures se font aussi sur le nœud PRIMARY, garantissant ainsi la cohérence des données (lecture des données à jour).
* **Réplique et disponibilité** : Les SECONDARY reçoivent en continu les modifications du PRIMARY pour assurer la redondance et la haute disponibilité. En cas de défaillance du PRIMARY, une nouvelle élection désigne un SECONDARY pour prendre sa place.

Cette configuration assure que les données sont toujours cohérentes, disponibles et protégées contre les pannes.

Voici un paragraphe simple que tu peux ajouter à ta doc pour couvrir la partie **connexions possibles** avec URI et readPreference :
