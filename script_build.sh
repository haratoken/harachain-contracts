#!/bin/bash

echo "build artifatcs on contracts:dev container using docker compose "
docker-compose -f docker-compose-build.yml up --build --abort-on-container-exit
TR=$?
echo exitcode=${TR}

echo "removing contracts:dev container "
docker-compose -f docker-compose-build.yml rm -f
# docker rmi contracts:dev

if [ ${TR} -eq 0 ]; then
    echo "tests passed!"
    exit 0
else
    echo "tests failed!"
    exit 1
fi
