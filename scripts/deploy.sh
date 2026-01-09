#!/bin/bash
# Deploy to production - run locally, executes on server via SSH
ssh tom@todo.rax0.de 'cd ~/todo && ./scripts/prod_build.sh'
