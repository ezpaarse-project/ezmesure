# ezmesure

## Prerequisite
A recent version of NodeJS and npm should be installed.
See the [official documentation](https://nodejs.org/en/download/package-manager/).

## Install

### Clone !

```bash
  git clone https://github.com/ezpaarse-project/ezmesure.git
```

### Configuration

1) Put the private key (``server.key``) and the certificate (``server.crt``) used to declare the service provider in the [fédération d'identités Education-Recherche](https://federation.renater.fr/registry?action=get_all) in ``rp/shibboleth/ssl/``.
**NB**: the private key is critical and should not be shared.

2) Set the following environment variables :
- APPLI_APACHE_SERVERNAME
- APPLI_APACHE_SERVERADMIN
- APPLI_APACHE_LOGLEVEL
- SHIBBOLETH_SP_URL
- SHIBBOLETH_DS_URL

3) Install
```bash
  make install
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

You will need a token in order to use the API. Start by browsing https://localhost/login and log in with your identity provider. Once logged, you should get a JSON with your token.

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

## Routes
<table>
<tbody>
  <tr>
    <td>GET /api/logs</td>
    <td>list current indixes</td>
  </tr>
  <tr>
    <td>POST /api/logs/:index</td>
    <td>insert a CSV file into an index</td>
  </tr>
  <tr>
    <td>DELETE /api/logs/:index</td>
    <td>delete an index</td>
  </tr>
  <tr>
    <td>GET /login</td>
    <td>login over shibboleth</td>
  </tr>
</tbody>
</table>
