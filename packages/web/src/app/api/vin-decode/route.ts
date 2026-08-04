import { NextRequest } from 'next/server';

const NHTSA_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended';

type NHTSARecord = Record<string, string>;

function clean(val: string | undefined | null): string | null {
  if (!val || val === 'Not Applicable' || val === 'N/A') return null;
  return val.trim() || null;
}

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin');

  if (!vin || vin.length !== 17) {
    return Response.json(
      { error: 'VIN must be exactly 17 characters' },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`${NHTSA_URL}/${vin}?format=json`);
  } catch {
    return Response.json(
      { error: 'NHTSA API unavailable' },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return Response.json(
      { error: 'NHTSA API unavailable' },
      { status: 502 }
    );
  }

  const data = await res.json();
  const r: NHTSARecord = data.Results?.[0];

  if (!r || !r.Make) {
    return Response.json(
      { error: 'No vehicle data found for this VIN' },
      { status: 404 }
    );
  }

  const engineParts = [
    clean(r.DisplacementL) ? `${clean(r.DisplacementL)}L` : null,
    clean(r.EngineCylinders) ? `${clean(r.EngineCylinders)}-cyl` : null,
    clean(r.FuelTypePrimary),
  ].filter(Boolean);

  return Response.json({
    vin: vin.toUpperCase(),
    year: clean(r.ModelYear),
    make: clean(r.Make),
    model: clean(r.Model),
    trim: clean(r.Trim),
    body_type: clean(r.BodyClass),
    engine: engineParts.length > 0 ? engineParts.join(' ') : null,
    transmission: clean(r.TransmissionStyle),
    drivetrain: clean(r.DriveType),
    doors: clean(r.Doors),
    plant_country: clean(r.PlantCountry),
    manufacturer: clean(r.Manufacturer),
  });
}
