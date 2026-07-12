const NAIROBI_AREA_COORDINATES: Array<{ terms: string[]; lat: number; lng: number }> = [
  { terms: ['westlands'], lat: -1.2675, lng: 36.8108 },
  { terms: ['kilimani'], lat: -1.2925, lng: 36.7872 },
  { terms: ['lavington'], lat: -1.2833, lng: 36.7617 },
  { terms: ['kileleshwa'], lat: -1.2802, lng: 36.7831 },
  { terms: ['parklands'], lat: -1.2615, lng: 36.8242 },
  { terms: ['upper hill'], lat: -1.3003, lng: 36.8154 },
  { terms: ['ngong road'], lat: -1.3009, lng: 36.7852 },
  { terms: ['langata'], lat: -1.3499, lng: 36.7641 },
  { terms: ['karen'], lat: -1.3194, lng: 36.7076 },
  { terms: ['ruaka'], lat: -1.2102, lng: 36.7756 },
  { terms: ['runda'], lat: -1.2241, lng: 36.8019 },
  { terms: ['kasarani'], lat: -1.2234, lng: 36.8981 },
  { terms: ['embakasi'], lat: -1.3156, lng: 36.9182 },
  { terms: ['donholm'], lat: -1.2998, lng: 36.8886 },
  { terms: ['south b', 'southb'], lat: -1.3085, lng: 36.8422 },
  { terms: ['south c', 'southc'], lat: -1.3203, lng: 36.8209 },
  { terms: ['thika road'], lat: -1.2338, lng: 36.8777 },
  { terms: ['cbd', 'city centre', 'city center', 'nairobi cbd'], lat: -1.2864, lng: 36.8172 },
  { terms: ['nairobi'], lat: -1.2864, lng: 36.8172 },
];

export function inferCoordinatesFromText(location?: string, address?: string) {
  const haystack = [location, address]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();

  if (!haystack) {
    return null;
  }

  const match = NAIROBI_AREA_COORDINATES.find((entry) =>
    entry.terms.some((term) => haystack.includes(term))
  );

  return match ? { lat: match.lat, lng: match.lng } : null;
}
