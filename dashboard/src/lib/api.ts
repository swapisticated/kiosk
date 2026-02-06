const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  allowedOrigins: string[];
  widgetConfig?: {
    botName?: string;
    welcomeMessage?: string;
    primaryColor?: string;
  };
  createdAt: string;
}

export interface CreateTenantData {
  name: string;
  email: string;
  domain?: string;
}

export interface IngestUrlData {
  url: string;
  title?: string;
}

export interface IngestResult {
  message: string;
  documentId: string;
  status: "pending" | "processing" | "processed" | "failed";
}

// Create a new tenant
export async function createTenant(data: CreateTenantData): Promise<Tenant> {
  const res = await fetch(`${API_BASE}/tenants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create tenant");
  }

  const result = await res.json();
  return result.tenant;
}

// Generate API key for a tenant
export async function generateApiKey(
  tenantId: string
): Promise<{ apiKey: string; keyId: string }> {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/keys`, {
    method: "POST",
    headers: {
      "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to generate API key");
  }

  return res.json();
}

// Ingest a URL (scrape + vectorize)
export async function ingestUrl(
  apiKey: string,
  data: IngestUrlData
): Promise<IngestResult> {
  const res = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to ingest URL");
  }

  return res.json();
}

// Lookup tenant by email
export async function lookupTenant(email: string): Promise<Tenant | null> {
  const res = await fetch(
    `${API_BASE}/tenants/lookup?email=${encodeURIComponent(email)}`,
    {
      headers: {
        "x-dashboard-secret": process.env.NEXT_PUBLIC_DASHBOARD_SECRET || "",
      },
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to lookup tenant");
  }

  const result = await res.json();
  return result.tenant;
}
