#!/bin/bash
cd /home/ubuntu/NEEMO/
git pull
cd /home/ubuntu/NEEMO/app
sudo killall node > /dev/null 2>&1 
sudo node app.js production 
cd /home/ubuntu/NEEMO/


