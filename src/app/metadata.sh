#!/bin/bash
# return version
parent_path=$( cd "$(dirname "$0")" ; pwd -P )
check=$(cat ${parent_path}/package.json| jq -c '{name: .name , version: .version, org: .author, hubuser: "stackrouteniit"}')
echo ${check/\}/,'"commitHash":"'$1'"'\}}
