// This script is for the MongoDB Shell
// mongosh "<connection string>" suggest.js

final_query = "matrix";

const DB = 'sample_mflix';
const ENTITIES_COLLECTION = "entities";
const ENTITIES_INDEX = ENTITIES_COLLECTION + "_index";

db = db.getSiblingDB(DB);
entities = db.getCollection(ENTITIES_COLLECTION);

function text_match(multi, query) {
  return {
    "text": {
      "query": query,
      "path": {
        "value": "name",
        "multi": multi
      }
    }
  };
}

function phrase_match(multi, query) {
  return {
    "phrase": {
      "query": query,
      "path": {
        "value": "name",
        "multi": multi
      },
      "slop": 100
    }
  };
}

function fuzzy_text_match(multi, query) {
  return {
    "text": {
      "query": query,
      "path": {
        "value": "name",
        "multi": multi
      },
      "fuzzy": {
        "prefixLength": 1,
        "maxExpansions": 10
      }
    }
  };
}

function prefix_match(multi, prefix) {
  return {
    "wildcard": {
      "query": prefix+"*",
      "path": {
        "value": "name",
        "multi": multi
      },
      "allowAnalyzedField": true
    }
  };
}

function boost(operator, boost) {
  // Gotta find the first/only key and set `score` under that nested object
  operator[Object.keys(operator)[0]]["score"] = {
    "boost": {
      "value": boost
    }
  }
  
  return operator;
}

for (j=1; j <= final_query.length; j++) {
  query = final_query.substring(0,j);

  shoulds = [
    boost(text_match("exact",query), 10),
    boost(prefix_match("lowercased", query.toLowerCase()),5),
    boost(text_match("shingled", query), 7),
    phrase_match("edge", query),
    boost(fuzzy_text_match("english", query), 0.7),
    boost(text_match("phonetic", query), 0.5)
  ];

  start = Date.now();
  results = entities.aggregate([
    {
      "$search": {
        "compound": {
          "should": shoulds,
          "score": {
            "boost": {
              "path": "weight",
              "undefined": 1.0
            }
          }
        },
        "index": ENTITIES_INDEX,
        "scoreDetails": true,
        "highlight": {
          "path": [
            "name",
            {
              "value": "name",
              "multi": "edge"
            },
            {
              "value": "name",
              "multi": "lowercased"
            }
          ]
        }
      }
    },
    {
      "$project": {
        "name": 1,
        "type": 1,
        "year": 1,
        "score": {
          "$meta": "searchScore"
        },
        "scoreDetails": {
          "$meta": "searchScoreDetails"
        },
        "highlights": {
          "$meta": "searchHighlights"
        }
      }
    },
    {
      "$limit": 10
    }
  ]).toArray();

  q_time = Date.now() - start;

  console.log(query);

  for (i = 0; i < results.length; i++) {
    result = results[i];
    console.log("* " + result.name + " (" + result.type + ")");
  }

  console.log("   " + q_time + "ms");

  console.log('-----');
}
