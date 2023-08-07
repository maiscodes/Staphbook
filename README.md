# Bactbook
BactBook is a web app that reads from a local flat file system bactopia output, and displays the information in an easy to read format. A PostgreSQL database supports the application by storing users, favourites and more. This projects user interface is built off of the existing Staphbook project, which can be found here:
With this app, users are able to:
- browse genomes and view information such as isolation source and sequence data and be able to download the information as .csv files.
- find similar genomes by shared information such as isolation sources and by genetic distance
- favorite and tag samples by adding them to a group which can then be shared and viewed by other users
- annotate groups and view generic statistics about each group

## Prerequisites
- Node.js v.10.15.3 (other versions may be supported)
- PostgresSQL v14 (other versions may be supported)
- Can run on Windows and MacOS
- Bactopia Output Files  (V3.00)
  - Old folder structure currently supported, recommended to download data from releases.

## Installation Process
### PostgreSQL Setup
1. Download here: https://www.postgresql.org/download/
2. Once installed, it is highly recommended that you use a GUI such as pgAdmin 4 which can be downloaded here: https://www.pgadmin.org/download/pgadmin-4-windows/
3. Setup your PostgreSQL Server, Database, then run the database creation scripts in /sql.

<details>
  <summary>More Info</summary>
  With a Postgres database server created and running locally, the scripts can be executed on the command line:
  
  ```{bash}
  cd Nodewebsite/sql
  psql {db_name} < bactopia_role.sql
  psql {db_name} < create_tables.sql
  ```
</details>


### Bactopia Setup
Requires Bactopia data on the local disk. Some examples can be found under the 'Releases' section to the right.
Currently, requires output in the format of that data as Bactopia directory structure has changed slightly. 
1. Download the data to the local disk and extract
2. Note the path of the directory `bactopia-samples` (to be included in `.env` file)

### Node.js and NPM Setup
1. Download Node.js here: https://nodejs.org/en/download/
2. Install Node.js

### Run Project
1. Clone project
2. Create an `.env` file and complete as per `template.env` within the `Nodewebsite` directory. Fill out all fields as per your local server port preference, database server, and local Bactopia output directory.
3. Run 
```bash
npm install
node app.js
```
## Extensions
Source code can be modified for other database schemas and genomes.
