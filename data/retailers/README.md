# Retailer snapshot validation audit

`nyc_snap_supermarkets.csv` remains the repository's original asset. The server loader validates identity and location; it does **not** establish current SNAP authorization, stock, prices, hours, accessibility, or fresh-food selection. Source and authorization verification remain a shared team task (#3 and the hackathon plan §2.5).

## Audit on 2026-10-09

- SHA-256: `abb081a686103e70d16431c76b85f442d813950ac2e82516fdcbfe254e987dcf`.
- 1,250 parsed data records, with unique source IDs and all required fields populated. `address2` is empty in 1,215 records.
- Source types: 724 `Super Store` and 526 `Supermarket` records. These source labels do not verify inventory or selection.
- The CSV has no `source_url`, `extract_date`, `authorization_source`, or `authorization_date` columns. Its download date, original source, and current/historical authorization status remain unknown. Neither its filename nor its repository commit date supplies that evidence.
- 1,247 records pass identity, coordinate, and geographic consistency checks. Three have coordinates whose official borough differs from the CSV's borough/county. The loader excludes them rather than repairing coordinates or addresses speculatively.

| Retailer ID | CSV borough | Coordinate's borough |
| --- | --- | --- |
| 565788 | Bronx | Manhattan |
| 784152 | Bronx | Manhattan |
| 1588022 | Queens | Brooklyn |

Accepted candidates: Brooklyn 417, Queens 321, Manhattan 242, Bronx 213, Staten Island 54. The source CSV is unchanged. These counts describe this file and validation policy, not a current count of authorized NYC retailers.

## Geographic reference

Coordinates are checked against complete [official DCP borough polygons](https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne), retrieved on 2026-10-09 (version 26b; water areas excluded). `data/location/nyc-boroughs.json.gz` preserves their original numeric coordinates and polygon holes without simplification or rounding. Gzip reduces the local asset to approximately 1.15 MB. Bounding boxes skip unrelated polygons; ray casting checks actual polygon membership. A point must resolve to exactly one borough. State must be `NY`; supplied borough and county must agree with the coordinate's borough.

This tests geographic consistency, not the accuracy of a store's address or coordinates. Border points, points outside the polygons, and inconsistent source fields are conservatively excluded and need review. ZIPs are checked for five-digit syntax; the loader does not assume that a ZIP missing from the ZCTA lookup is outside NYC.

To regenerate the geographic asset using the actual retrieval date:

```sh
curl --fail --silent --show-error 'https://data.cityofnewyork.us/resource/gthc-hcne.json?$select=boroname,the_geom' -o /tmp/replate-boroughs-source.json
node scripts/extract-nyc-boroughs.mjs /tmp/replate-boroughs-source.json 2026-10-09 data/location/nyc-boroughs.json.gz
npm test
```

Review the source, resulting exclusions, and asset diff before accepting an update. Do not edit generated data by hand. This reference shares the official source used for the [ZIP/ZCTA audit](../location/README.md).

## Loader behavior and handoff

Server code imports `loadRetailerSnapshot` from `src/lib/retailers/retailer-snapshot.server.ts`. It reads the CSV and compressed geography locally; no provider call, key, database, or new dependency is used. Its optional paths are trusted server configuration for tests/tools and must never come from HTTP parameters. Node filesystem imports prevent use in Next.js client components.

The loader returns `status: ready | data-error`. `ready` means that identity and geographic checks produced usable candidate records. It includes normalized IDs, names, display addresses, city/state/ZIP, computed borough, nullable source store type, finite coordinates, and `authorizationStatus: unverified` for every record. Optional type omissions are explicit. Snapshot filename and SHA-256 are recorded; source/date and authorization source/verification date are `null`. Extra CSV columns claiming authorization are ignored until the shared audit verifies them. No accepted row is labeled currently authorized.

`quality` contains only aggregate counts, exclusion reasons, missing optional columns, and unverified fields. It contains no row contents, IDs, coordinates, file paths, or household/request inputs. The loader does not log inputs or errors.

Validation rules:

- Strict CSV quoting supports commas, escaped double quotes, multiline fields, CRLF/LF, and a UTF-8 BOM. Malformed quoting, invalid UTF-8, missing/duplicate headers, and excessive file size are snapshot errors. Files are limited to 4 MB, 20,000 records, and 100 columns.
- Missing identity/address fields, unsafe text, malformed ZIPs, wrong row widths, invalid/non-finite coordinates, and unsupported/inconsistent geography exclude individual rows. Whitespace is normalized; IDs remain strings rather than being converted to numbers.
- Identical normalized records sharing an ID collapse to one. Conflicting records sharing an ID are all excluded; a valid record sharing an ID with an invalid row is also excluded. Duplicate places (same normalized name/address/city/ZIP under different IDs) keep the lowest ID in ASCII order. Results are ordered by ID so reordering CSV rows does not change them. This is loader order, not the proximity ranking from #8.
- Missing, unreadable, and corrupt snapshots/geographic references have distinct error codes. An empty or wholly excluded snapshot returns `RETAILER_DATA_UNVALIDATED`, not a successful zero-results search.

The retailer endpoint (#4) must honor the remaining authorization evidence gate and disclose omissions. The [official USDA retailer locator](https://www.fns.usda.gov/snap/retailer-locator) remains the fallback for current authorization information; the loader supplies its link with usable candidates. Explore consumes these candidates through the retailer endpoint and labels authorization unverified.
