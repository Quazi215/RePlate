# Reviewed NYC ZIP/ZCTA reference

`nyc-zctas.json` is generated from the [NYC Open Data ZCTA dataset](https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v). It retains `zcta5` and the source's `intptlat` / `intptlon` as numeric `latitude` / `longitude`. It does not use `centlat` / `centlon` or retailer locations. The source metadata guarantees that the internal point lies inside its ZCTA polygon; a center point may lie outside it. ZCTAs approximate USPS ZIP areas and do not include every ZIP.

Extracted and reviewed on **2026-10-09**. This is the retrieval date, not a claim of current USPS coverage. The source metadata reported its last row update as 2026-04-10. The dataset description does not identify a Census vintage, so none is claimed.

## Geographic audit

The source returned 221 unique five-digit ZCTAs with finite, valid internal coordinates. Some source polygons intersect NYC while their internal points are outside it. To keep the approximate origins inside NYC, the extraction script checked each internal point against the official [DCP borough boundaries](https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne), retrieved on the same date (version 26b, water areas excluded). Ray casting checks the outer polygon and excludes polygon holes. The borough label describes the internal point; it does not claim that the entire ZCTA is contained in one borough.

211 points passed. Ten internal points did not fall inside the borough boundaries and were omitted: `07305`, `10550`, `10704`, `10705`, `10803`, `11001`, `11020`, `11021`, `11040`, `11580`. Their omission makes them **unsupported** by this lookup. It does not establish that an entire ZIP is outside NYC, and the resolver makes no outside-NYC classification.

Reviewed supported examples, using the original internal coordinates:

| ZIP/ZCTA | Point's borough | Latitude | Longitude |
| --- | --- | --- | --- |
| 10001 | Manhattan | 40.7506490 | -73.9972976 |
| 10451 | Bronx | 40.8221675 | -73.9226159 |
| 11201 | Brooklyn | 40.6937005 | -73.9898589 |
| 11101 | Queens | 40.7471126 | -73.9397082 |
| 10301 | Staten Island | 40.6275046 | -74.0943767 |

## Regeneration

Download both official inputs, then run the offline generator with the actual retrieval date. Review counts, exclusions, five-borough examples, and the resulting diff before accepting an update. Do not edit the generated JSON by hand. The 1,000-row limit exceeds the reviewed 221 rows; the generator rejects a full-limit response as potentially truncated.

```sh
curl --fail --silent --show-error 'https://data.cityofnewyork.us/resource/35j5-n34v.json?$select=zcta5,intptlat,intptlon&$order=zcta5&$limit=1000' -o /tmp/replate-zctas-source.json
curl --fail --silent --show-error 'https://data.cityofnewyork.us/resource/gthc-hcne.json?$select=boroname,the_geom' -o /tmp/replate-boroughs-source.json
node scripts/extract-nyc-zctas.mjs /tmp/replate-zctas-source.json /tmp/replate-boroughs-source.json 2026-10-09 data/location/nyc-zctas.json
npm test
```

## Server usage

Import `resolveNycZip` from `src/lib/location/nyc-zcta.server.ts` in server code. The loader uses Node filesystem imports to prevent inclusion in a Next.js client component. Its reference path is fixed by application code; never pass a user-supplied file path. No key, payment card, geocoding request, or location logging is used.

The result has `status: supported | malformed | unsupported | data-error`. Success includes the approximate internal point, its label, and source/extract date. Errors have stable codes and plain messages; missing, unreadable, or corrupt reference data is a server data error. Any invalid or duplicate reference row invalidates the whole reference, so bad data cannot become a misleading unsupported-input response. The future retailer endpoint (#4) will map these results to HTTP responses.
