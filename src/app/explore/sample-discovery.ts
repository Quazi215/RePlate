// Fictional fixtures only. Coordinates and distances are independently illustrative.
// Do not use these points for geocoding, route claims, or external directions.
export type Search = { zip: string; radius: string };
export type Store = {
  id: string;
  name: string;
  address: string;
  miles: number;
  location?: { latitude: number; longitude: number };
};
export type SearchErrors = { zip?: string; radius?: string };

export const sampleSearch: Search = { zip: "11206", radius: "1" };
export const sampleStores: Store[] = [
  { id: "sample-01", name: "Broadway Community Market", address: "760 Broadway, Brooklyn, NY 11206", miles: 0.24, location: { latitude: 40.7025, longitude: -73.943 } },
  { id: "sample-02", name: "Union Avenue Grocers", address: "310 Union Avenue, Brooklyn, NY 11211", miles: 0.58, location: { latitude: 40.7098, longitude: -73.9519 } },
  { id: "sample-03", name: "Flushing Fresh Market", address: "695 Flushing Avenue, Brooklyn, NY 11206", miles: 0.92, location: { latitude: 40.7001, longitude: -73.9463 } },
  { id: "sample-04", name: "Graham Avenue Food Center", address: "150 Graham Avenue, Brooklyn, NY 11206", miles: 1.46, location: { latitude: 40.7089, longitude: -73.9422 } },
];

export function validateSearch(search: Search): SearchErrors {
  const errors: SearchErrors = {};
  if (!/^\d{5}$/.test(search.zip)) errors.zip = "Enter a 5-digit ZIP code.";
  else if (search.zip !== "11206") errors.zip = "This ZIP is not in the sample lookup. Try 11206. This does not mean it is outside NYC.";
  if (search.radius !== "" && (!Number.isFinite(Number(search.radius)) || Number(search.radius) <= 0 || Number(search.radius) > 25)) {
    errors.radius = "Enter a straight-line radius greater than 0 and up to 25 miles, or leave it blank.";
  }
  return errors;
}

export function hasLocation(store: Store): boolean {
  const point = store.location;
  return Boolean(point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180);
}

export function sampleResults(search: Search): Store[] {
  return sampleStores.filter(store => search.radius === "" || store.miles <= Number(search.radius))
    .sort((a, b) => a.miles - b.miles || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
