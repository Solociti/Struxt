import "dotenv/config";

export default {
  client: "mysql2",
  connection: {
    host: "localhost",
    user: "root",
    password: process.env.MARIADB_ROOT_PASSWORD,
    database: process.env.PRIMARY_DB,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "_knex_migrations",
    extension: "js",
    directory: "./migrations/knex",
  },
};
