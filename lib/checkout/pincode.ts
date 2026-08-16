export interface PincodeLookupResult {
  city: string;
  state: string;
}

interface PostalApiEntry {
  Status?: string;
  PostOffice?: Array<{
    District?: string;
    State?: string;
    Name?: string;
  }>;
}

export async function lookupPincode(
  pincode: string
): Promise<PincodeLookupResult | null> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as PostalApiEntry[];
    const entry = payload[0];

    if (entry?.Status !== "Success" || !entry.PostOffice?.length) {
      return null;
    }

    const office = entry.PostOffice[0];
    const city = office.District?.trim() || office.Name?.trim() || "";

    if (!city || !office.State?.trim()) {
      return null;
    }

    return {
      city,
      state: office.State.trim(),
    };
  } catch {
    return null;
  }
}
