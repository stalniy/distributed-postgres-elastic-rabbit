const { 
  queryField, 
  objectType, 
  mutationField,
  inputObjectType,
  arg,
  makeSchema 
} = require('nexus')

module.exports = function createSchema(mq, db) {
  const Material = objectType({
    name: 'Material',
    definition(t) {
      t.id('id')
      t.string('name')
    }
  })

  const MaterialCollection = objectType({
    name: 'MaterialCollection',
    definition(t) {
      t.list.field('items', { type: Material })
    }
  })

  const getMaterials = queryField('materials', {
    type: MaterialCollection,
    async resolve() {
      const items = await db.select()
        .from('materials')

      return { items }
    }
  })

  const CMaterialInput = inputObjectType({
    name: 'CMaterialInput',
    definition(t) {
      t.string('name');
    }
  })

  const createMaterial = mutationField('createMaterial', {
    type: Material,
    args: {
      data: arg({ type: CMaterialInput, required: true })
    },
    async resolve(_, vars) {
      return mq.exec('command.material.create', vars)
    }
  });

  return makeSchema({
    shouldGenerateArtifacts: false,
    types: [
      getMaterials,
      MaterialCollection,
      Material,
      createMaterial,
      CMaterialInput,
    ]
  });
}

