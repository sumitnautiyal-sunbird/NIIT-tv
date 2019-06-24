#!/bin/sh
# Build script
# set -o errexit
e () {
    echo $( echo ${1} | jq ".${2}" | sed 's/\"//g')
}
m=$(./src/app/metadata.sh)

org=$(e "${m}" "org")
hubuser=$(e "${m}" "hubuser")
name=$(e "${m}" "name")
version=$(e "${m}" "version")

artifactLabel=${ARTIFACT_LABEL:-bronze}

#remove docker login and pushing code that is manually added in jenkins
docker login -u "${hubuser}" -p$(cat /home/ubuntu/corporate_pass)
docker push ${org}/${name}:${version}-${artifactLabel}
docker logout
