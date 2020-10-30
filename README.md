# Staphbook
"A social network for genomes"

StaphBook is a web app that reads from a PostgreSQL database and displays Staphylococcus aureus genomes in an easy to read format. With this app users are able to:
- browse genomes and view information such as isolation source and sequence data and be able to download the information as .csv files.
- find similar genomes by shared information such as isolation sources and by genetic distance
- favorite and tag samples by adding them to a group which can then be shared and viewed by other users
- annotate groups and view generic statistics about each group

## Prerequisites
- Node.js v.10.15.3 (newer versions should be supported)
- PostgresSQL v12.3 (newer versions should be supported)
- Can run on Windows and MacOS

## Installation Process
### PostgreSQL Setup
1. Download here: https://www.postgresql.org/download/
2. Once installed, it is highly recommended that you use a GUI such as pgAdmin 4 which can be downloaded here: https://www.pgadmin.org/download/pgadmin-4-windows/
3. Setup your PostgreSQL Server and run our database creation scripts in sql/.

### Node.js Setup
1. Download Node.js here: https://nodejs.org/en/download/
2. Install Node.js

### Run Project
1. Clone project into your computer.
2. Create an .env file using the provided template.env to contain the port configurations to your SQL server and host IP address of your application server.
3. Run
```Bash
npm install
node app.js
```

## Extensions
Source code can be modified for other database schemas and genomes.
