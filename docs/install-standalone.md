# Installation et Déploiement de MongoDB Standalone avec Docker

Ce document décrit les étapes que j'ai suivies pour déployer une base de données MongoDB en mode standalone sur mon NAS via Portainer, ainsi que la configuration associée pour un accès sécurisé.

---

## 1. Contexte et Objectif

Étant habitué à Docker, j'ai choisi de déployer MongoDB avec Docker Compose dans Portainer. L'objectif est d'avoir une base MongoDB fonctionnelle avec une interface d'administration (mongo-express) accessible depuis l'extérieur, sécurisée par un reverse proxy et certificat SSL.

---

## 2. Déploiement initial avec un docker-compose simple

Pour commencer, j'ai recherché un fichier Docker Compose standard sur Docker Hub :

```
services:

mongo:
image: mongo
restart: always
environment:
MONGO\_INITDB\_ROOT\_USERNAME: admin
MONGO\_INITDB\_ROOT\_PASSWORD: mysupersecretpassword

mongo-express:
image: mongo-express
restart: always
ports:
\- 8081:8081
environment:
ME\_CONFIG\_MONGODB\_ADMINUSERNAME: admin
ME\_CONFIG\_MONGODB\_ADMINPASSWORD: mysupersecretpassword
ME\_CONFIG\_MONGODB\_URL: mongodb://admin\:mysupersecretpassword\@mongo:27017/
ME\_CONFIG\_BASICAUTH: false
```

---

## 3. Adaptation et amélioration du docker-compose

Après quelques ajustements pour l'adapter à mon environnement NAS, gestion des volumes, et sécurisation des accès, voici le fichier final utilisé :

```
services:

mongo:
image: mongo
container\_name: mongo
restart: always
ports:
\- 27017:27017
environment:
MONGO\_INITDB\_ROOT\_USERNAME: root
MONGO\_INITDB\_ROOT\_PASSWORD: Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6
volumes:
\- /volume3/docker/nosql:/data/db
networks:
\- mongo-net

mongo-express:
image: mongo-express
container\_name: mongo-express
restart: always
ports:
\- 8081:8081
environment:
ME\_CONFIG\_MONGODB\_ADMINUSERNAME: root
ME\_CONFIG\_MONGODB\_ADMINPASSWORD: Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6
ME\_CONFIG\_MONGODB\_URL: "mongodb://root\:Penholder9-Commodore4-Nutshell0-Empower9-Removed7-Sternum6\@mongo:27017/"
ME\_CONFIG\_BASICAUTH: true
ME\_CONFIG\_BASICAUTH\_USERNAME: admin
ME\_CONFIG\_BASICAUTH\_PASSWORD: Impale4-Deranged2-Backside8-Euphemism0-Derived6-Unboxed4
networks:
\- mongo-net

networks:
mongo-net:
driver: bridge
```

---

## 4. Configuration réseau et accès externe

- J'ai redirigé uniquement le port `27017` (MongoDB) de ma Freebox vers mon NAS afin que mes collègues puissent se connecter à la base depuis Internet.

- J'utilise un sous-domaine que je possédais déjà, pointé vers mon IP publique.

- Sur mon NAS Synology, j'ai obtenu un certificat Let's Encrypt pour ce sous-domaine.

- J'ai mis en place un reverse proxy qui redirige directement le trafic HTTPS (port 443) vers l'interface Mongo Express, accessible via `https://mongo.valentinlamine.fr/` sans exposer le port 8081.

---

## 5. Résultats

- MongoDB est accessible en standalone depuis l’extérieur.

- Mongo Express est accessible via HTTPS avec authentification basique.

- Mes collègues peuvent maintenant se connecter et manipuler la base à distance.

---
