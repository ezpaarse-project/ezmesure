# ezMESURE

Platform aggregating electronic ressources usage statistics for the French researcher organizations.
https://ezmesure.couperin.org

## Prerequisites
[Docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/)

## Installation

```bash
  git clone https://github.com/ezpaarse-project/ezmesure.git
```

## Configuration

1) Put the certificate (``server.crt``) and private key (``server.key``) used to declare the Shibboleth service provider in the [fédération d'identités Education-Recherche](https://federation.renater.fr/registry?action=get_all) in ``rp/shibboleth/ssl/``.  
**NB**: the private key is critical and should not be shared.

2) Put the SSL certificate (``server.pem``) and private key (``server.key``) in ``rp/apache2/ssl``. Optional if ezMESURE runs behind proxy which takes care of handling HTTPS.
**NB**: you can use [mkcert](https://github.com/FiloSottile/mkcert) for local development

3) Set the following environment variables :
- APPLI_APACHE_SERVERNAME
- APPLI_APACHE_SERVERADMIN
- APPLI_APACHE_LOGLEVEL
- SHIBBOLETH_SP_URL
- SHIBBOLETH_DS_URL
- EZMESURE_AUTH_SECRET

**NB**: you can set them in `ezmesure.local.env.sh` and source `ezmesure.env.sh`.

4) Configure shibboleth
```bash
  make config
```
5) For each node in the cluster, add certificates in `elasticsearch/config/certificates/`. If you don't have them yet, you can generate certificates by following these steps :
  - Open the `certs` directory.
  - Create an [instances.yml](https://www.elastic.co/guide/en/elasticsearch/reference/current/certutil.html#certutil-silent) file.
  - Run `docker-compose -f create-certs.yml up`.
  - A `certificates` directory should be created, you can just put it in both `elasticsearch/config/` and `kibana/config/`. (**NB**: you may need to `chown` it)

6) The authentication process requires the user to be located at `ezmesure-preprod.couperin.org`. If working on localhost, add the following line into `/etc/hosts`:
```
127.0.0.1 ezmesure-preprod.couperin.org
```
6) Adjust memory for elastic search. To avoid out of memory exception problems, you may have to adjust mmaps count (https://www.elastic.co/guide/en/elasticsearch/reference/2.1/setup-configuration.html)

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

### Log in

Navigate to https://localhost/myspace and log in with your identity provider. The first time you log into ezMESURE, you'll get a mail with your Kibana credentials.

### Get your authentication token

An authentication token is required in order to use the API. Once logged, grab your token from the authentication tab.

To use your token, add the following header to your requests: `Authorization: Bearer <token>` (replace `<token>` with your actual token)

### Upload a file

To upload an EC result file in elastic-search, you need to POST it on the /api/logs/{index_name} route. For example:
```bash
  curl -v -X POST https://localhost/api/logs/test-index -F "files[]=@114ee1d0_2016-03-31_10h53.job-ecs.csv" -H "Authorization: Bearer <token>"
```

You can then issue a GET request on the /api/logs route to list your indices
```bash
  curl -X GET https://localhost/api/logs -H "Authorization: Bearer <token>"
```

### Visualize your data

Now you can access the Kibana instance on https://localhost/kibana/ and start building dashboards.

## API

https://ezmesure.couperin.org/api
