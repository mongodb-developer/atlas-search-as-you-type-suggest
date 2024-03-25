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

## Highlighting

Highlighting can be enabled for each "multi"-variant of the `name` field to provide matching context to the results.

## Faceting

The `entities` collection can be faceted by `type` (provided the field was configured as `stringFacet`), to provide an overview of the various types matched.

## Grouping

Results could be grouped by `type` using `$group` after `$search`. It is best to use `$limit` before grouping when only a few results are needed.

## Tips and Tricks

* If there is only one type of entity to suggest, a separate `entities` collection isn't needed. The index configuration for
the existing collection can be augmented with the analyzers and queried using the techniques described here.

## Examples

### Movies

   coming soon