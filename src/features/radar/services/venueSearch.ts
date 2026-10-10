export interface VenueHit {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export async function searchVenues(name: string, place: string, postcode: string): Promise<VenueHit[]> {
  const q = [name, place, postcode].map((part) => part.trim()).filter(Boolean).join(' ');
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Venue search failed');
  const body = (await res.json()) as { features?: PhotonFeature[] };
  const hits: VenueHit[] = [];
  for (const feature of body.features || []) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates;
    const label = props.name || [props.housenumber, props.street].filter(Boolean).join(' ');
    if (!label || !coords) continue;
    const address = [props.housenumber, props.street, props.city || props.state, props.postcode, props.country]
      .filter(Boolean)
      .join(', ');
    hits.push({
      id: String(props.osm_id || `${coords[0]}:${coords[1]}`),
      name: label,
      address: address || label,
      lng: coords[0],
      lat: coords[1],
    });
  }
  return hits;
}
