#!/bin/bash
set -euo pipefail

commit_hash=$1
org=stackrouteniit
name=player
version=1.13.2

#docker build -f ./Dockerfile.Build --build-arg commit_hash=${commit_hash} -t ${org}/${name}:${version}-build . 
docker build --no-cache -f ./Dockerfile.Build --build-arg commit_hash=${commit_hash} -t ${org}/${name}:${version}-build . 
docker run --name=${name}-${version}-build ${org}/${name}:${version}-build
containerid=$(docker ps -aqf "name=${name}-${version}-build")
rm -rf ./dist
docker cp $containerid:/opt/player/app/player-dist.tar.gz .
docker rm ${containerid}
docker build -f ./Dockerfile --label commitHash=$(git rev-parse --short HEAD) -t ${org}/${name}:${version}_${commit_hash} .
echo ${org}/${name}:${version}_${commit_hash} > metadata.json
