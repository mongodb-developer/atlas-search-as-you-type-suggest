// This script is for the MongoDB Shell
// mongosh "<connection string>" setup.js

const DB = 'sample_mflix';
const ENTITIES_COLLECTION = "entities";
const ENTITIES_INDEX = ENTITIES_COLLECTION + "_index";
const INDEX_CONFIG_FILE = path.join(__dirname, 'entities_index_config.json');

db = db.getSiblingDB(DB);

// Drop and create a fresh entities collection
db.getCollection(ENTITIES_COLLECTION).drop();
db.createCollection(ENTITIES_COLLECTION);
console.log(`Created ${ENTITIES_COLLECTION}`);

entities = db.getCollection(ENTITIES_COLLECTION);

// Create search index
const index_config = EJSON.parse(fs.readFileSync(INDEX_CONFIG_FILE));
entities.createSearchIndex(ENTITIES_INDEX, index_config);
console.log(`Created search index ${ENTITIES_INDEX}`);

// Import movie entities
console.log("Importing entities...")
movies = db.getCollection("movies");
movies.aggregate([
  {
    $unwind: "$cast",
  },
  {
    $group: {
      _id: "$cast",
      avg_rating: { $avg: "$imdb.rating" },
      num_movies: { $count: {} },
      latest_year: {
        $max: {
          $toInt: { $substr: ["$year", 0, 4] },
        },
      },
    },
  },
  {
    $project: {
      _id: {$concat: [ "cast", "-", "$_id" ]},
      type: "cast",
      name: "$_id",
      avg_rating: "$avg_rating",
      num_movies: "$num_movies",
      latest_year: "$latest_year",
      weight: "$avg_rating"
    }
  },
  { $merge: { into: ENTITIES_COLLECTION } }
]);
console.log(" * Cast imported");

movies.aggregate([
  {
    $unwind: "$genres",
  },
  {
    $group: {
      _id: "$genres",
      num_movies: { $count: {} },
    },
  },
  {
    $project: {
      _id: {$concat: [ "genre", "-", "$_id" ]},
      type: "genre",
      name: "$_id",
      num_movies: "$num_movies",
      weight: "$num_movies"
    }
  },
  { $merge: { into: ENTITIES_COLLECTION } }
]
);
console.log(" * Genres imported");

movies.aggregate([
  {
    $group: {
      _id: "$title",
      year: {
        $max: {
          $toInt: {
            $substr: ["$year", 0, 4],
          },
        },
      },
      rating: {
        $max: "$imdb.rating",
      },
      count: {
        $count: {},
      },
    },
  },
  {
    $project: {
      _id: {
        $concat: ["title", "-", "$_id"],
      },
      type: "title",
      name: "$_id",
      year: "$year",
      count: "$count",
      rating: "$rating",
      weight: {$multiply: [ { $convert: {input: "$rating", to: "double", onError: 1}}, {$cond: {if: { $gte: [ "$year", 1990 ] }, then: 2, else: 1}}]}
    },
  },
  {
    $merge: {
      into: ENTITIES_COLLECTION,
    },
  },
]
);
console.log(" * Titles imported");

