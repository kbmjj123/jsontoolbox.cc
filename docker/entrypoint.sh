#!/bin/sh
set -eu

. /usr/local/bin/runtime-config.sh

jt_write_runtime_config

exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
