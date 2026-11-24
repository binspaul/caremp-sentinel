// Geographic anchor for careMP Sentinel Memory Care Facility (Brookline / Longwood Medical Campus)
export const FACILITY_GEO_ANCHOR = {
  lat: 42.3485,
  lng: -71.1065,
  widthMeters: 60,
  heightMeters: 36,
  degLatPerMeter: 1 / 111111,
  degLngPerMeter: 1 / (111111 * Math.cos(42.3485 * (Math.PI / 180))),
};

export function pixelToGeo(x: number, y: number, layoutWidth = 1000, layoutHeight = 600) {
  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numLW = Number(layoutWidth) || 1000;
  const numLH = Number(layoutHeight) || 600;
  const normX = Math.max(0, Math.min(1, numX / numLW));
  const normY = Math.max(0, Math.min(1, numY / numLH));
  // Y goes downwards in SVG pixels (South in latitude):
  const lat = Number(
    (FACILITY_GEO_ANCHOR.lat + (0.5 - normY) * (FACILITY_GEO_ANCHOR.heightMeters * FACILITY_GEO_ANCHOR.degLatPerMeter)).toFixed(7),
  );
  // X goes rightwards in SVG pixels (East in longitude):
  const lng = Number(
    (FACILITY_GEO_ANCHOR.lng + (normX - 0.5) * (FACILITY_GEO_ANCHOR.widthMeters * FACILITY_GEO_ANCHOR.degLngPerMeter)).toFixed(7),
  );
  return { lat, lng };
}

export function rectToGeoPolygon(x: number, y: number, w: number, h: number, layoutWidth = 1000, layoutHeight = 600) {
  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numW = Number(w) || 160;
  const numH = Number(h) || 140;
  const numLW = Number(layoutWidth) || 1000;
  const numLH = Number(layoutHeight) || 600;

  const pTopLeft = pixelToGeo(numX, numY, numLW, numLH);
  const pTopRight = pixelToGeo(numX + numW, numY, numLW, numLH);
  const pBottomRight = pixelToGeo(numX + numW, numY + numH, numLW, numLH);
  const pBottomLeft = pixelToGeo(numX, numY + numH, numLW, numLH);

  // Standard GeoJSON coordinate order: [longitude, latitude]
  return [
    [pTopLeft.lng, pTopLeft.lat],
    [pTopRight.lng, pTopRight.lat],
    [pBottomRight.lng, pBottomRight.lat],
    [pBottomLeft.lng, pBottomLeft.lat],
    [pTopLeft.lng, pTopLeft.lat],
  ];
}
