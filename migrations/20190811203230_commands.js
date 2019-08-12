
exports.up = async (knex) => {
  await knex.schema
    .createTable('processed_commands', (table) => {
      table.uuid('id').primary();
      table.jsonb('meta');
      table.datetime('createdAt', { useTz: false })
    })
};

exports.down = (knex) => {
  return knex.schema.dropTable('processed_commands')
};
