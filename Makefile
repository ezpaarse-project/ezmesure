.PHONY: help
.DEFAULT_GOAL := help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

config: ## patch shibboleth2.xml config file with SP/DS URLs
	sed -e "s|{{SHIBBOLETH_SP_URL}}|${SHIBBOLETH_SP_URL}|" \
	    -e "s|{{SHIBBOLETH_DS_URL}}|${SHIBBOLETH_DS_URL}|" \
			./rp/shibboleth/shibboleth2.dist.xml > ./rp/shibboleth/shibboleth2.xml

run: cleanup-docker config ## run ezMESURE using environment variables
	. ./ezmesure.env.sh ; docker-compose up -d

run-node: cleanup-docker config ## run ezMESURE elastic node(s) only (with ezmesure.local.env.sh)
	. ./ezmesure.env.sh ; docker-compose up -d elastic

run-debug: cleanup-docker config ## run ezMESURE debug mode 
	. ./ezmesure.env.sh ; docker-compose -f docker-compose.debug.yml up -d

stop: ## stop ezMESURE using environment variables
	. ./ezmesure.env.sh ; docker-compose stop

cleanup-docker: ## remove docker image (needed for updating it)
	docker-compose stop
	docker-compose rm -f

plugins: ## build plugin zip
	./kibana/plugins/build.sh