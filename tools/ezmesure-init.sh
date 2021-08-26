#!/bin/bash

TEMPLATES=1
EZMESURE_BASE_URL="http://localhost:3000"

echo "Instantiation will be done on ${EZMESURE_BASE_URL}"
read -p "Are you sure you want to continue [y/N]: " choice
case "$choice" in 
  n|N|*)
    echo 'To change ezMESURE API entrypoint set --api parameter'
    exit 0
  ;;
esac

while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    -t|--templates)
      TEMPLATES="$2"
      shift
      shift
      ;;
    -a|--api)
      EZMESURE_BASE_URL="$2"
      shift
      shift
      ;;
    -h|--help)
      printf "Usage: ezmesure-init.sh [OPTIONS]\n\n"
      printf "Initialize an ezMESURE instance\n\n"
      printf "Options:\n"
      printf "    -t, --templates  Set the templates version to use\n"
      printf "    -a, --api   Set ezMESURE API entrypoint (default: http://localhost:3000)\n"
      exit 0
      ;;
    *)
      printf "Script usage : ezmesure-init.sh --version <version>"
      exit 1
      ;;
  esac
done

regex='^[0-9]+$'
if  [[ ! $TEMPLATES =~ $regex ]] ; then
  echo "error: Templates version is not a number"
  exit 1
fi

if [[ ! -x "$(command -v ezmesure-admin)" ]]; then
  echo "Please install ezmesure-admin command : npm install -g @ezpaarse-project/ezmesure-admin"
  exit 1
fi

if [[ -z ${EZMESURE_ADMIN_USERNAME} ]]; then
  echo "Please set EZMESURE_ADMIN_USERNAME variable"
  exit 1
fi

if [[ -z ${EZMESURE_ADMIN_PASSWORD} ]]; then
  echo "Please set EZMESURE_ADMIN_PASSWORD variable"
  exit 1
fi

printf "[Init configuration]\n"
ezmesure-admin config set ezmesure.baseUrl ${EZMESURE_BASE_URL}

printf "\n[Login user]\n"
ezmesure-admin login --username ${EZMESURE_ADMIN_USERNAME} --password ${EZMESURE_ADMIN_PASSWORD}

printf "\n[Create Bienvenue space]\n"
# ezmesure-admin spaces update default --new-name Bienvenue --description "Espace d'accueil des nouveaux connectés" --color "#9C27B0" --features dashboard,discover
ezmesure-admin spaces add Bienvenue --description "Espace d'accueil des nouveaux connectés" --color "#9C27B0" --features dashboard,discover

printf "\n[Create univ-example indice]\n"
ezmesure-admin indices add univ-example

printf "\n[Create univ-example index-pattern in bienvenue space]\n"
ezmesure-admin index-pattern add bienvenue univ-example

printf "\n[Create org-template space]\n"
ezmesure-admin spaces add org-template --description "Espace modèle des organismes pour une création automatique" --initials "TP" --color "#9C27B0"

printf "\n[Create univ-example index-pattern in org-template space]\n"
ezmesure-admin index-pattern add org-template univ-example

printf "\n[Create role new_user]\n"
ezmesure-admin roles add new_user --space bienvenue --privileges read --index-pattern univ-example

printf "\n[Create demo user]\n"
ezmesure-admin users add demo ezmesure --roles new_user --full-name "Demo ezMESURE" --email "demo@ezmesure.couperin.org" --enabled

if [[ ! -d "./ezmesure-templates" ]]; then
  printf "\n[Cloning ezmesure-templates]\n"
  git clone https://github.com/ezpaarse-project/ezmesure-templates
fi

printf "\n[Pulling ezmesure-templates]\n"
git -C ./ezmesure-templates pull

printf "\n[Import dashoards in bienvenue space]\n"
ezmesure-admin dashboard import bienvenue --index-pattern univ-example --overwrite --files ./ezmesure-templates/welcome/v${TEMPLATES}/*.json

printf "\n[Import dashoards in org-template space]\n"
ezmesure-admin dashboard import org-template --index-pattern univ-example --overwrite --files ./ezmesure-templates/org-template/v${TEMPLATES}/*.json