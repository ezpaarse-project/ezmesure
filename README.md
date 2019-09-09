# ezMESURE

Platform aggregating electronic ressources usage statistics for the French reasearcher organizations.
https://ezmesure.couperin.org

## Prerequisites
[Docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
  git clone https://github.com/ezpaarse-project/ezmesure.git
```

## Configuration

1) Put the private key (``server.key``) and the certificate (``server.crt``) used to declare the service provider in the [fédération d'identités Education-Recherche](https://federation.renater.fr/registry?action=get_all) in ``rp/shibboleth/ssl/``.  
**NB**: the private key is critical and should not be shared.

2) Set the following environment variables :
- APPLI_APACHE_SERVERNAME
- APPLI_APACHE_SERVERADMIN
- APPLI_APACHE_LOGLEVEL
- SHIBBOLETH_SP_URL
- SHIBBOLETH_DS_URL
- EZMESURE_AUTH_SECRET

**NB**: you can set them in `ezmesure.local.env.sh` and source `ezmesure.env.sh`.

3) Configure shibboleth
```bash
  make config
```
4) For each node in the cluster, add certificates in `elasticsearch/config/certificates/`. If you don't have them yet, you can generate certificates by following these steps :
  - Open the `certs` directory.
  - Create an [instances.yml](https://www.elastic.co/guide/en/elasticsearch/reference/current/certutil.html#certutil-silent) file.
  - Run `docker-compose -f create-certs.yml up`.
  - A `certificates` directory should be created, you can just put it in both `elasticsearch/config/` and `kibana/config/`. (**NB**: you may need to `chown` it)

5) The authentication process requires the user to be located at `ezmesure-preprod.couperin.org`. If working on localhost, add the following line into `/etc/hosts`:
```
127.0.0.1 ezmesure-preprod.couperin.org
```
6) Adjust memory for elastic search
To avoid out of memory exception problems, you may have to adjust mmaps count (https://www.elastic.co/guide/en/elasticsearch/reference/2.1/setup-configuration.html)

```
sudo vi /etc/sysctl.conf
```

and add the lines :
```
# configuration needed for elastic search
vm.max_map_count=262144
```

then apply the changes :
```
sysctl -p
```

## Plugins installation
```
make plugins
docker-compose build kibana
```

## Start
```bash
  docker-compose up -d
```

You should be greeted with something like:
```bash
  2016-04-15T09:03:29.595Z - info: API server listening on port 3000
```

## Usage

### Get and use your token

You will need a token in order to use the API and Kibana. Start by browsing the profile page at https://localhost/front/#/profile and log in with your identity provider. Once logged, your token will appear and a cookie will be stored so that you can browse kibana right away.

To use your token, add the following header to your requests: `Authorization: Bearer <token>` (replace `<token>` with your actual token)

### Upload a file

To upload an EC result file in elastic-search, you need to POST it on the /api/logs/{index_name} route. For example:
```bash
  curl -v -X POST https://localhost/api/logs/test-index -F "files[]=@114ee1d0_2016-03-31_10h53.job-ecs.csv" -H "Authorization: Bearer <token>"
```

You can then issue a GET request on the /api/logs route to list your index(es)
```bash
  curl -X GET https://localhost/api/logs -H "Authorization: Bearer <token>"
```

### Visualize your data

Now you can access the Kibana instance on https://localhost and start building dashboards (soon to be documented).

## API

https://ezmesure.couperin.org/api
