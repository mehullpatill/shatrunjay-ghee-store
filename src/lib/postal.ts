import { validatePincodeFormat } from "./pricing";

type PostalOffice = {
  Name?: string;
  District?: string;
  State?: string;
  Pincode?: string;
};

type PostalApiResponse = {
  Status?: string;
  PostOffice?: PostalOffice[] | null;
};

export type PostalLookup = {
  valid: boolean;
  city: string | null;
  state: string | null;
  area: string | null;
};

/**
 * Validate a PIN against the public India postal directory. The result is
 * intentionally used only for online-payment serviceability; COD remains
 * controlled by the admin-managed database rows.
 */
export async function lookupIndianPostalPincode(pincode: string): Promise<PostalLookup> {
  const normalized = pincode.trim();
  if (!validatePincodeFormat(normalized)) {
    return { valid: false, city: null, state: null, area: null };
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Postal lookup failed with status ${response.status}`);

  const body = (await response.json()) as PostalApiResponse[];
  const result = body[0];
  const offices = result?.Status === "Success" && Array.isArray(result.PostOffice) ? result.PostOffice : [];
  const office = offices[0];

  return {
    valid: offices.length > 0,
    city: office?.District || null,
    state: office?.State || null,
    area: office?.Name || null,
  };
}
