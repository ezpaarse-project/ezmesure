#! /bin/bash

# Check whether this file is being run by another script.
function _is_sourced() {
	# https://unix.stackexchange.com/a/215279
	[ "${#FUNCNAME[@]}" -ge 2 ] \
		&& [ "${FUNCNAME[0]}" = '_is_sourced' ] \
		&& [ "${FUNCNAME[1]}" = 'source' ]
}

function auto_envsubst() {
  echo "[init] Generating config from templates"
  local template_dir="${SATOSA_ENVSUBST_TEMPLATE_DIR:-/etc/satosa-templates}"
  local suffix="${SATOSA_ENVSUBST_TEMPLATE_SUFFIX:-.template}"
  local output_dir="${SATOSA_ENVSUBST_OUTPUT_DIR:-/etc/satosa}"
  local filter="${SATOSA_ENVSUBST_FILTER:-}"

  local template defined_envs relative_path output_path subdir
  defined_envs=$(printf '${%s} ' $(awk "END { for (name in ENVIRON) { print ( name ~ /${filter}/ ) ? name : \"\" } }" < /dev/null ))
  [ -d "$template_dir" ] || return 0
  if [ ! -w "$output_dir" ]; then
    echo "[init]: ERROR: $template_dir exists, but $output_dir is not writable"
    return 0
  fi
  find "$template_dir" -follow -type f -name "*$suffix" -print | while read -r template; do
    relative_path="${template#"$template_dir/"}"
    output_path="$output_dir/${relative_path%"$suffix"}"
    subdir=$(dirname "$relative_path")
    # create a subdirectory where the template file exists
    mkdir -p "$output_dir/$subdir"
    echo "[init]: Running envsubst on $template to $output_path"
    envsubst "$defined_envs" < "$template" > "$output_path"
  done
}

function generate_saml_metadata() {
  echo "[init] Generating SAML metadata"
  satosa-saml-metadata \
    --split-backend \
    --no-sign \
    --dir certs \
    proxy_conf.yaml
}

function _main() {
  auto_envsubst
  generate_saml_metadata
  exec "$@"
}

if ! _is_sourced; then
	_main "$@"
fi
