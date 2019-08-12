
exports.up = async (knex) => {
  await knex.schema
    .createTable('materials', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.jsonb('meta');
    })
};

exports.down = (knex) => {
  return knex.schema.dropTable('materials')
};
