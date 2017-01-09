# ezmesure

Platform aggregating suscribed electronic ressources usage statistics of the French reasearcher organizations.
https://ezmesure.couperin.org

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
- EZMESURE_AUTH_SECRET

3) Configure shibboleth
```bash
  make config
```

4) The authentication process requires the user to be located at `ezmesure-preprod.couperin.org`. If working on localhost, add the following line into `/etc/hosts`:
```
127.0.0.1 ezmesure-preprod.couperin.org
```
4bis) Adjust memory for elastic search
To avoid out of memory exception problems you may have to adjust mmaps count (https://www.elastic.co/guide/en/elasticsearch/reference/2.1/setup-configuration.html)

```
sudo vi /etc/sysctl.conf
```

and add the lines :
```
# configuration needed for elastic search
vm.max_map_count=262144
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

## API routes

### Authentication
<table>
<thead>
  <tr>
    <th>URL</th>
    <th>Action</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>GET /login</td>
    <td>login over shibboleth</td>
  </tr>
  <tr>
    <td>GET /api/profile</td>
    <td>get the profile associated with a token</td>
  </tr>
  <tr>
    <td>GET /api/profile/token</td>
    <td>get a token</td>
  </tr>
</tbody>
</table>

### Logs
<table>
<thead>
  <tr>
    <th>URL</th>
    <th>Action</th>
  </tr>
</thead>
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
</tbody>
</table>

### Data providers
<table>
<thead>
  <tr>
    <th>URL</th>
    <th>Action</th>
    <th>Request body</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>GET /api/providers</td>
    <td>List providers</td>
    <td></td>
  </tr>
  <tr>
    <td>GET /api/providers/check</td>
    <td>Apply providers</td>
    <td></td>
  </tr>
  <tr>
    <td>DELETE /api/providers/:providerName</td>
    <td>Delete a provider</td>
    <td></td>
  </tr>
  <tr>
    <td>PUT /api/providers/:providerName</td>
    <td>Create a data provider</td>
    <td> JSON
      <ul>
      <li><strong>target</strong>: the index that should be enriched</li>
        <li><strong>field</strong>: the field of the index used for matching</li>
        <li><strong>key</strong>: the field of the enrichment data used for matching</li>
        <li><strong>condition</strong>: the field of the index that will be used to consider each line enriched</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>POST /api/providers/:providerName</td>
    <td>Load data into a data provider</td>
    <td>JSON array of objects</td>
  </tr>
</tbody>
</table>
