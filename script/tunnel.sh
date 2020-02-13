#!/bin/bash
# access to postgres db & adminer
ssh -N -L 5432:127.0.0.1:5432 -L 8000:127.0.0.1:8080 project.hatt.co

