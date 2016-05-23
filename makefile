.PHONY: help
.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: config ## install node dependencies and configure Shibboleth
	docker run --rm -e http_proxy -e https_proxy -v `pwd`/api:/app -w /app node:4-wheezy npm install

config: ## patch shibboleth2.xml config file service provider entityID
	sed -e "s|{{SHIBBOLETH_SP_URL}}|${SHIBBOLETH_SP_URL}|" \
	    -e "s|{{SHIBBOLETH_DS_URL}}|${SHIBBOLETH_DS_URL}|" \
			./rp/shibboleth/shibboleth2.dist.xml > ./rp/shibboleth/shibboleth2.xml

run-prod: cleanup-docker config ## run ezMESURE using environment variables
	docker-compose up -d rp

run-dev: cleanup-docker config ## run ezMESURE for https://ezmesure-preprod.couperin.org
	. ./dev.env.sh ; docker-compose up -d

cleanup-docker: ## remove docker image (needed for updating it)
	docker-compose stop
	docker-compose rm -f
