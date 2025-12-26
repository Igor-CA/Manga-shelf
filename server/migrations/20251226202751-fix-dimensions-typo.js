module.exports = {
  async up(db, client) {
    await db.collection('series').updateMany(
      { dimmensions: { $exists: true } },
      { 
        $rename: { "dimmensions": "dimensions" } 
      }
    );
  },

  async down(db, client) {
    await db.collection('series').updateMany(
      { dimensions: { $exists: true } },
      { 
        $rename: { "dimensions": "dimmensions" } 
      }
    );
  }
};
