#!/bin/sh

echo "Installing Node JS v15 ..."
curl -fsSL https://deb.nodesource.com/setup_15.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing GIT and PostgreSQL ..."
sudo apt-get install git postgresql

echo "Preparing database (you need to input the password for the arrange user 4 times) ..."
sudo -u postgres createuser -P -d arrange
sudo -u postgres createdb -O arrange arrange
sudo su - postgres -c 'psql -c "\\password arrange" arrange postgres'

echo "Downloading repository ..."
git clone https://github.com/hilderonny/arrange.git
cd arrange

echo "Installing NPM dependencies ..."
npm install

echo "Creating and starting system service ..."
sudo cat > /etc/systemd/system/arrange.service << EOF
[Unit]
Description=arrange

[Service]
ExecStart=/usr/bin/node $PWD/index.js
WorkingDirectory=$PWD
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=arrange
Environment="HTTPPORT=80"
Environment="HTTPSPORT=443"
Environment="PGHOST=localhost"
Environment="PGUSER=arrange"
Environment="PGDATABASE=arrange"
Environment="PGPASSWORD=arrange"
Environment="PGPORT=5432"

[Install]
WantedBy=multi-user.target
EOF
systemctl enable arrange
systemctl start arrange

echo "Finished."