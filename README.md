# As-you-type Suggest Solution with Atlas Search

## Building the entities collection

An `entities` collection contains suggestable items. These items can be from any source.

Entities can be extracted from a main collection using an aggregation pipeline that maps the entities into the schema described below, and then `$merge`'d as the last stage. See "Examples" below for concrete pipelines.

### Schema

* `_id`: Unique, stable identifier for the entity
* `type`: Entity type
* `name`: Text string name of the entity
* other fields: as needed for filtering or relevancy

## Indexing entities

Set up an Atlas Search `entities_index` on the `entities` collection with the following considerations:

* `type`: Index it as a `stringFacet` to allow faceting by entity types. Also, index it as a `token` field type for filtering capability.
* `name`: This field is indexed in numerous "multi"-analyzed ways to facilitate a variety of partial matching techniques. 

## Searching for suggestions

Given a users query, `$search` the entities with a broad set of optional query clauses across the "multi"-analyzed `name` field variations. Boosts can be attached to each clause to tune the relevancy of results.

## Faceting

The `entities` collection can be faceted by `type` (provided the field was configured as `stringFacet`), to provide an overview of the various types matched.

## Tips and Tricks

* If there is only one type of entity to suggest, a separate `entities` collection isn't needed. The index configuration for the existing collection can be augmented with the analyzers and queried using the techniques described here.

## Examples

### Movies

It's easy to get started with this as-you-type suggestion solution using the sample movies data available within Atlas.  First, [load the sample data](https://www.mongodb.com/docs/atlas/sample-data/sample-mflix/) into your cluster and have [`mongosh` installed](https://www.mongodb.com/docs/mongodb-shell/), then following these steps:

 1. `cd examples/movies`
 2. Run `mongosh "<connection string>" setup.js`
 3. Wait until the index has been built and is available. This may take a few minutes, depending on 
    your cluster tier. You can check on the status through the Atlas web UI or with Compass.
 4. Then run `mongosh "<connection string>" suggest.js`

 `suggest.js` emulates a user typing the query that is coded at the top of the file, one query for each character of the string. Adjust this string to try other examples. The output will be a series of results like this, ending with the time each query took to execute:

 ```
 matr
* The Matrix (title)
* The Matrix Reloaded (title)
* The Matrix Revolutions (title)
* The Matriarch (title)
* The Matrimony (title)
* India: Matri Bhumi (title)
* Mia Madre (title)
* Holy Matrimony (title)
* David Matranga (cast)
* Mother (title)
   63ms
```

 If you need to run `setup.js` again, you may encounter `MongoServerError: Duplicate Index` due to the existing `entities_index` lingering briefly before it gets automatically removed in order to set it up again. Wait a few seconds and try again. 
