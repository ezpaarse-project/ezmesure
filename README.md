# ezMESURE

Platform aggregating electronic resources usage statistics for the French researcher organizations.
https://ezmesure.couperin.org

## Prerequisites
* [docker](https://www.docker.com/)
* [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
git clone https://github.com/ezpaarse-project/ezmesure.git
```

## Configuration

### 1. Install SSL certificates

ezMESURE uses an Apache reverse proxy which communicates with HTTPS only. Put the SSL certificate (``server.pem``) and private key (``server.key``) in ``rp/apache2/ssl``. Optional if ezMESURE runs behind a proxy which takes care of handling HTTPS.

**NB**: you can use [mkcert](https://github.com/FiloSottile/mkcert) for local development

### 2. Setup environment

Create an environment file named `ezmesure.local.env.sh` and export the following environment variables. You can then source `ezmesure.env.sh` , which contains a set of predefined variables and is overridden by `ezmesure.local.env.sh`.

**NB**: a helper script is available at `tools/init_env.sh`.

| name | description |
|------|-------------|
| EZMESURE_DOMAIN | the server domain |
| APPLI_APACHE_SERVERADMIN | the admin of the server |
| EZMESURE_AUTH_SECRET | secret for JWT signing |
| ELASTICSEARCH_PASSWORD | password of the elastic user |
| EZMESURE_SMTP_HOST | host of the SMTP server |
| EZMESURE_NOTIFICATIONS_SENDER | the sender for emails issued by ezMESURE |
| EZMESURE_NOTIFICATIONS_RECIPIENTS | recipients of the recent activity email |
| EZMESURE_NOTIFICATIONS_SUPPORT_RECIPIENTS | recipients of the recent activity email |
| EZMESURE_NOTIFICATIONS_CRON | cron for recent activity (defaults to daily midnight) |
| REPORTING_SENDER | the sender for reporting emails |

If all services are not hosted on the same machine, set the following variables (URLs should not have trailing slashes) :

| name | description |
|------|-------------|
| EZMESURE_FRONT_URL     | Base URL of the front website. Must be reachable by the `reverse proxy`. |
| EZMESURE_API_URL       | Base URL of the API. Must be reachable by the `reverse proxy`. |
| EZMESURE_REPORTING_URL | Base URL of the reporting service. Must be reachable by `Kibana`. |
| KIBANA_INTERNAL_URL    | Kibana URL used by the `reporting` service in order to access dashboards. Must pass through the `reverse proxy` (ie. RP address + `/kibana`). |
| EZMESURE_KIBANA_HOST   | Kibana host. Must be reachable by the `reverse proxy` and the `API`. |
| EZMESURE_KIBANA_PORT   | Kibana port. |
| EZMESURE_ELASTIC_HOST  | Elasticsearch host. Must be reachable by the `API` and `reporting` service |
| EZMESURE_ELASTIC_PORT  | Elasticsearch port. |

### 3. Configure shibboleth

Put the certificate (``server.crt``) and private key (``server.key``) used to declare the Shibboleth service provider in the [fédération d'identités Education-Recherche](https://federation.renater.fr/registry?action=get_all) in ``rp/shibboleth/ssl/``.  

**NB**: the private key is critical and should not be shared.

Additionally, set the environment variables `SHIBBOLETH_SP_URL` and `SHIBBOLETH_DS_URL` with the URL of the service provider and discovery service. Those variables are not necessary if you disable Shibboleth authentication (see below).

#### Disabling Shibboleth

If you don't need the shibboleth authentication, set the `EZMESURE_DISABLE_SHIBBOLETH` environment variable to any value. If you already started ezMESURE, rebuild the `front` service and restart `front` and `rp` :

```bash
docker-compose up -d --force-recreate front
docker-compose restart rp
```

### 4. Setup Elastic certificates

For each node in the cluster, add certificates in `elasticsearch/config/certificates/`. Kibana should also have certificates in `kibana/config/certificates`. If you don't have them yet, you can generate them by following these steps :

  - Open the `certs` directory.
  - Create an [instances.yml](https://www.elastic.co/guide/en/elasticsearch/reference/current/certutil.html#certutil-silent) file. A helper script is available at `tools/init_es_instances.sh`.
  - Run `docker-compose -f create-certs.yml run --rm create_certs`.
  - A `bundle.zip` file should be created, just unzip it in the certificates directory (**NB**: you may need to `chown` it) :
    - `unzip bundle.zip -d ../elasticsearch/config/certificates/`
    - `unzip bundle.zip -d ../kibana/config/certificates/`


### 5. Adjust system configuration for Elasticsearch

Elasticsearch has some [system requirements](https://www.elastic.co/guide/en/elasticsearch/reference/current/system-config.html) that you should check.

To avoid memory exceptions, you may have to increase maps count. Edit `/etc/sysctl.conf` and add the following line :

```ini
# configuration needed for elastic search
vm.max_map_count=262144
```

Then apply the changes :

```bash
sysctl -p
```

## Start / Stop / Status

Before you start ezMESURE, make sure all necessary environment variables are set.

```bash
# Start ezMESURE as daemon
docker-compose up -d

# Stop ezMESURE
docker-compose stop

# Get the status of ezMESURE services
docker-compose ps
```

## Usage

### Log in

Navigate to https://ezmesure-preprod.couperin.org/myspace and log in with your identity provider. The first time you log into ezMESURE, you'll get a mail with your Kibana credentials.

If the Shibboleth authentication is not enabled, users should be created via the Kibana management page. You can sign in with the `elastic` superuser to achieve this. Users can then log into ezMESURE using their Kibana credentials.

### Get your authentication token

An authentication token is required in order to use the API. Once logged, grab your token from the authentication tab.

To use your token, add the following header to your requests: `Authorization: Bearer <token>` (replace `<token>` with your actual token)

### Upload a file

To upload an EC result file in elastic-search, you need to `POST` it on the `/api/logs/{index_name}` route. For example :

```bash
curl -v -X POST https://localhost/api/logs/test-index -F "files[]=@114ee1d0_2016-03-31_10h53.job-ecs.csv" -H "Authorization: Bearer <token>"
```

You can then issue a `GET` request on the `/api/logs` route to list your indices :

```bash
curl -X GET https://localhost/api/logs -H "Authorization: Bearer <token>"
```

### Visualize your data

Now you can access the Kibana instance on https://localhost/kibana/ and start building dashboards.

## API

The ezMESURE API is documented here : https://localhost/api-reference

## Dev mode

### Prerequisites

* [docker](https://www.docker.com/) 
* [docker compose](https://docs.docker.com/compose/)
* [npm](https://docs.npmjs.com/about-npm)
* [node 18](https://nodejs.org/en/)

### 1. Install local dependencies

You should install local dependencies with npm in ``api`` and ``front`` directory;

```bash
ezmesure/api npm i

ezmesure/front npm i
```

If you want to start ezmesure in docker mode, you need to install `sharp` in the container

```bash
$ rm -rf ./api/node_modules
$ docker compose -f docker-compose.debug.yml run --rm api npm i
```

### 2. Source environnement variable

You should source ``ezmesure.env.sh`` for the following and before each start.

```bash
source ezmesure.env.sh
```
### 3. Install SSL certificates

use [mkcert](https://github.com/FiloSottile/mkcert) for local development

ezMESURE uses an Apache reverse proxy which communicates with HTTPS only. Put the SSL certificate (``server.pem``) and private key (``server.key``) in ``rp/apache2/ssl``.

### 4. Setup https for kibana and elastic

ezmesure request to elastic in https, to do that, you need to create certificate.

Before that, you need to create ``instances.yml`` file, you need to use a script that will help you to create that in ``init_es_instance.sh``. This script will pre-fill the necessary fields.

```bash
ezmesure/tools/init_es_instances.sh

Adding new instance
  Name: <Name>
  IP: <IP>
  Hostname: <Hostname>
Instance added to ./tools/../certs/instances.yml
Add another instance (Y/n) ? n
```

Once the file is created, you need to add elastic in dns and you can generate the certificates.

```bash
ezmesure/certs docker-compose -f create-certs.yml run --rm create_certs
```

Once the certificates are generated, they must be unzipped and placed in the right folders.

```bash
ezmesure/certs sudo unzip bundle.zip -d ../elasticsearch/config/certificates/
ezmesure/certs sudo unzip bundle.zip -d ../kibana/config/certificates/
```

### 5. Setup local DNS (for dev with Shibboleth)

The Shibboleth authentication process requires the user to be located at `ezmesure-preprod.couperin.org`. If working on localhost, add the following line into `/etc/hosts`:

```
127.0.0.1 ezmesure-preprod.couperin.org
```

On top of that, you have to override the environment variable ``EZMESURE_DISABLE_SHIBBOLETH`` on ezmesure.local.env.sh

```
export EZMESURE_DISABLE_SHIBBOLETH=""
```

Don't forget to restore the environment variables after the modification.

### 6. Prepare start

Before launching ezmesure, you have to create the elastic container and launch the database migration, for that you have to use these commands :

```bash
docker compose -f docker-compose.debug.yml run --rm elastic chown -R elasticsearch /usr/share/elasticsearch/
docker compose -f docker-compose.migrate.yml up
docker compose -f docker-compose.migrate.yml down
```
### 7. Start

```bash
docker-compose -f docker-compose.debug.yml up -d
```

### 8. Database update

If you have updated the database schema, you need to migrate your database :

```bash
# node
npx prisma db push
# docker
docker compose -f docker-compose.debug.yml run --rm api npx prisma db push
```

### 9. Test

To start test, make sur you have a ezmesure started in dev mode

```bash
docker compose exec api npm run test
```