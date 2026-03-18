/**
 * Istanbul Metropolitan Municipality (IBB) Open Data Portal.
 * Uses CKAN action API. No key required.
 * https://data.ibb.gov.tr/
 */

export interface IbbDataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  organization?: { title: string };
  metadata_modified: string;
  numResources: number;
  tags?: Array<{ name: string }>;
}

export interface IbbDataResponse {
  datasets: IbbDataset[];
  total: number;
  updatedAt: string;
}

const IBB_API = "https://data.ibb.gov.tr/api/3/action";

/** Fetch list of available datasets from IBB Open Data */
export async function fetchIbbDatasets(): Promise<IbbDataResponse | null> {
  try {
    const res = await fetch(`${IBB_API}/package_list`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const names: string[] = data?.result || [];

    return {
      datasets: names.slice(0, 50).map((name) => ({
        id: name,
        name,
        title: name.replace(/-/g, " "),
        notes: "",
        metadata_modified: new Date().toISOString(),
        numResources: 0,
      })),
      total: names.length,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Fetch details for a specific IBB dataset */
export async function fetchIbbDatasetDetail(
  datasetId: string,
): Promise<IbbDataset | null> {
  if (!datasetId) return null;

  try {
    const params = new URLSearchParams({ id: datasetId });
    const res = await fetch(`${IBB_API}/package_show?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const pkg = data?.result;
    if (!pkg) return null;

    return {
      id: pkg.id || datasetId,
      name: pkg.name || datasetId,
      title: pkg.title || "",
      notes: pkg.notes || "",
      organization: pkg.organization,
      metadata_modified: pkg.metadata_modified || "",
      numResources: pkg.num_resources || 0,
      tags: pkg.tags,
    };
  } catch {
    return null;
  }
}
