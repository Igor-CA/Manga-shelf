module.exports = {
  async up(db, client) {
    await db.collection('series').updateMany(
      { dimensions: { $type: "array" } },
      [
        {
          $set: {
            specs: {
              dimensions: {
                width: { $arrayElemAt: ["$dimensions", 0] },
                height: { $arrayElemAt: ["$dimensions", 1] }
              },
              volumesInFormat: 1
            }
          }
        },
        {
          $unset: "dimensions"
        }
      ]
    );
  },

  async down(db, client) {
    await db.collection('series').updateMany(
      { "specs.dimensions": { $exists: true } },
      [
        {
          $set: {
            dimensions: [
              "$specs.dimensions.width",
              "$specs.dimensions.height"
            ]
          }
        },
        {
          $unset: "specs"
        }
      ]
    );
  }
};