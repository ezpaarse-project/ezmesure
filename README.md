# ezmesure

## Prerequisite
A recent version of NodeJS and npm should be installed.
See the [official documentation](https://nodejs.org/en/download/package-manager/).

## Install
```bash
  git clone https://github.com/ezpaarse-project/ezmesure.git
  cd ezmesure
```

## Start
First, you have to start dockerized versions of elasticsearch and kibana:
```bash
  cd docker
  docker-compose up -d
```

Then, you install and run ezmesure:
```bash
  cd ..
  npm install
  npm start
```

You should be greeted with something like:
```bash
  2016-04-15T09:03:29.595Z - info: API server listening on port 3010
```

## Usage

To upload an EC result file in elastic-search with ezmesure, you need to POST it on the /logs/{index_name} route. For example:
```bash
  curl -v -X POST http://localhost:3010/logs/test-index -H "Accept:text/csv" -F "files[]=@114ee1d0_2016-03-31_10h53.job-ecs.csv"
```

You can then issue a GET request on the /logs route to list your index(es)
```bash
  curl -X GET http://localhost:3010/logs
```
or simply open your brower and navigate to http://localhost:3010/logs to get the same information

The last step is accessing the Kibana instance on http://localhost:3000 and building dashboards (soon to be documented).

## Routes
<table>
<tbody>
  <tr>
    <td>GET /logs</td>
    <td>list current indixes</td>
  </tr>
  <tr>
    <td>POST /logs/:index</td>
    <td>insert a CSV file into an index</td>
  </tr>
  <tr>
    <td>DELETE /logs/:index</td>
    <td>delete an index</td>
  </tr>
</tbody>
</table>
