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

### 0. Prerequisites

- ezMESURE needs **two** dedicated DNS entry: one for application, and one for for [`satosa`](https://github.com/IdentityPython/SATOSA/)
  - For dev purposes, you can edit `/etc/hosts` to something like `ezmesure.localhost`. You can also use tools like [`localias`](https://github.com/peterldowns/localias)

### 1. Setup environment

Create an environment file named `ezmesure.local.env.sh` and export the following environment variables. You can then source `ezmesure.env.sh` , which contains a set of predefined variables and is overridden by `ezmesure.local.env.sh`.

**NB**: a helper script is available at `tools/init_env.sh`.

| name | description |
|------|-------------|
| EZMESURE_DOMAIN | the ezmesure domain |
| SATOSA_DOMAIN | the satosa domain |
| SATOSA_ENCRYPTION_KEY | the satosa encryption key |
| NGINX_PROTOCOL | The protocol used by the reverse proxy to serve ezMESURE |
| EZMESURE_SMTP_HOST | host of the SMTP server |
| ELASTIC_REQUIRED_STATUS | status of elastic cluster needed from ezmesure to connect |
| EZMESURE_NOTIFICATIONS_RECIPIENTS | recipients of the recent activity email |
| EZMESURE_NOTIFICATIONS_SUPPORT_RECIPIENTS | recipients of the recent activity email |

### 2. Install SSL certificates

ezMESURE needs to be served over HTTPS, by default the reverse proxy included with ezMESURE handles that, but needs proper SSL certificates in the following locations :

- `./rp/certs/cert.pem` - The certificate
- `./rp/certs/key.pem` - The private key

You can skip this step by using a dedicated reverse proxy (cf. step 0).

You can generate certificates with tools like [`mkcert`](https://github.com/FiloSottile/mkcert).

### 3. Configure satosa

Put the certificate (`server.crt`) and private key (`server.key`) used to declare the service provider in the [fédération d'identités Education-Recherche](https://federation.renater.fr/registry?action=get_all) in :

- `./satosa/certs/sp.crt` - The certificate
- `./satosa/certs/sp.key` - The private key

**NB**: the private key is critical and should not be shared.

Additionally, set the environment variables `SAML_METADATA_URL` and `SAML_DS_URL` with the URL of the service provider and discovery service. Those variables are not necessary if you disable satosa authentication (see below).

#### Disabling satosa

If you don't need the satosa authentication, set the `SATOSA_ENABLED` environment variable to an empty string. If you already started ezMESURE, restart the `auth` service :

```bash
docker compose up -d --force-recreate auth
docker compose restart rp
```

### 4. Setup Elastic certificates

For each node in the cluster, add certificates in `elasticsearch/config/certificates/`. Kibana should also have certificates in `kibana/config/certificates`. If you don't have them yet, you can generate them by following these steps :

  - Open the `certs` directory.
  - Create an [instances.yml](https://www.elastic.co/guide/en/elasticsearch/reference/current/certutil.html#certutil-silent) file. A helper script is available at `tools/init_es_instances.sh`.
  - Run `docker compose -f create-certs.yml run --rm create_certs`.
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
docker compose up -d

# Stop ezMESURE
docker compose stop

# Get the status of ezMESURE services
docker compose ps
```

## Usage

### Log in

Navigate to https://localhost/myspace and log in with your identity provider.

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
* [node 24](https://nodejs.org/en/)

### 1. Install local dependencies

You should install local dependencies with npm in `api` and `front` directory;

```bash
docker compose run --rm api npm ci

docker compose run --rm front npm ci
```

### 2. Source environnement variable

You should source ``ezmesure.env.sh`` for the following and before each start.

```bash
source ezmesure.env.sh
```

### 3. Install SSL certificates

cf. Configuration - step 2

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
ezmesure/certs docker compose -f create-certs.yml run --rm create_certs
```

Once the certificates are generated, they must be unzipped and placed in the right folders.

```bash
ezmesure/certs sudo unzip bundle.zip -d ../elasticsearch/config/certificates/
ezmesure/certs sudo unzip bundle.zip -d ../kibana/config/certificates/
```

### 5. Setup local DNS

cf. Configuration - step 0

### 6. Prepare start

Before launching ezmesure, you have to create the elastic container and launch the database migration, for that you have to use these commands :

```bash
docker compose -f docker-compose.dev.yml run --rm elastic chown -R elasticsearch /usr/share/elasticsearch/

docker compose -f docker-compose.migrate.yml up api report
```

### 7. Start in dev mode

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 8. Database update

If you have updated the database schema, you need to migrate your database :

```bash
docker compose -f docker-compose.dev.yml run --rm api npx prisma db push
```

### 9. Test

To start test, make sure you have a ezmesure started in dev mode

```bash
docker compose exec api npm run test
```
