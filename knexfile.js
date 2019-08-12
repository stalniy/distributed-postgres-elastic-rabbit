module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOSTNAME,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB
    },
    migrations: {
      tableName: 'migrations'
    },
    pool: {
      min: 2,
      max: 10
    },
  }
};
