import {
  ComparisonResultSchema,
  ScenarioSchema,
  type ComparisonResult,
  type CreateComparisonInput,
  type GenerateScenarioInput,
  type Scenario,
} from '@queuescope/contracts';

const apiUrl = import.meta.env.VITE_API_URL;

async function get(
  path: string,
  missingMessage = "No s'ha trobat l'escenari",
): Promise<unknown> {
  if (!apiUrl) {
    throw new Error("No s'ha configurat l'adreça de l'API");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}${path}`);
  } catch {
    throw new Error(
      "No s'ha pogut contactar amb l'API. Comprova que estigui en marxa.",
    );
  }
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(missingMessage);
    }
    throw new Error("No s'han pogut carregar les dades de l'API");
  }

  return (await response.json()) as unknown;
}

async function post(path: string, body: unknown): Promise<unknown> {
  if (!apiUrl) {
    throw new Error("No s'ha configurat l'adreça de l'API");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "No s'ha pogut contactar amb l'API. Comprova que estigui en marxa.",
    );
  }
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Ja existeix un escenari amb aquest identificador');
    }
    if (response.status === 400) {
      throw new Error(
        path === '/comparisons'
          ? 'Tria almenys dues polítiques diferents amb paràmetres vàlids'
          : 'Les dades de l’escenari no són vàlides',
      );
    }
    throw new Error("No s'ha pogut desar o previsualitzar l'escenari");
  }
  return (await response.json()) as unknown;
}

function parseScenario(value: unknown): Scenario {
  const result = ScenarioSchema.safeParse(value);
  if (!result.success) {
    throw new Error("La resposta de l'API no té el format esperat");
  }
  return result.data;
}

function parseComparison(value: unknown): ComparisonResult {
  const result = ComparisonResultSchema.safeParse(value);
  if (!result.success) {
    throw new Error("La resposta de l'API no té el format esperat");
  }
  return result.data;
}

export async function listScenarios(): Promise<Scenario[]> {
  const result = ScenarioSchema.array().safeParse(await get('/scenarios'));
  if (!result.success) {
    throw new Error("La resposta de l'API no té el format esperat");
  }
  return result.data;
}

export async function getScenario(id: string): Promise<Scenario> {
  return parseScenario(await get(`/scenarios/${encodeURIComponent(id)}`));
}

export async function previewScenario(
  input: GenerateScenarioInput,
): Promise<Scenario> {
  return parseScenario(await post('/scenarios/preview', input));
}

export async function createScenario(scenario: Scenario): Promise<Scenario> {
  return parseScenario(await post('/scenarios', scenario));
}

export async function createComparison(
  input: CreateComparisonInput,
): Promise<ComparisonResult> {
  return parseComparison(await post('/comparisons', input));
}

export async function getComparison(id: string): Promise<ComparisonResult> {
  return parseComparison(
    await get(
      `/comparisons/${encodeURIComponent(id)}`,
      "No s'ha trobat la comparació",
    ),
  );
}
