#!/usr/bin/env bash
set -e
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib git
npm install -g pm2 @nestjs/cli
