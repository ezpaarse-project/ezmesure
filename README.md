# ezmesure

## Prerequisite
A recent version of NodeJS and npm should be installed.
See the [official documentation](https://nodejs.org/en/download/package-manager/).

## Install
Clone !
```bash
  git clone ...
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
  npm run build
  npm start
```

## Usage

To upload an EC result file in elastic-search with ezmesure, you need to POST it on the /logs/{index_name} route. For example:
```bash
  curl -v -X POST http://localhost:3000/logs/test-index -H "Accept:text/csv" -F "files[]=@114ee1d0_2016-03-31_10h53.job-ecs.csv"
```

You can then issue a GET request on the /logs route to list your index(es)
```bash
  curl -X GET http://localhost:3000/logs
```
or simply open your brower and navigate to http://localhost:3000/logs to get the same information

The last step is to access the Kibana instance on http://localhost:5601 and build dashboards (to be documented).

