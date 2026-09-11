import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import OpenAI from 'openai';
import { parse } from 'yaml';

import { buildPrompt, normalizeRadarUrl, radarCandidatesSchema, type RadarCandidate, type RadarItem, type ResearchSourcesConfig } from './radar';
import { getSources, type SocialConfig } from './site-data';

export type RadarSearchClient = { collect(input: string): Promise<{ text: string; sourceUrls: string[] }> };

export function renderRadarPrompt(config: ResearchSourcesConfig, existing: RadarItem[], now: Date): string {
  const template = readFileSync(resolve(process.cwd(), 'prompts/collect-latest.md'), 'utf8');
  const end = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(now);
  const startDate = new Date(now); startDate.setDate(startDate.getDate() - 30);
  const start = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(startDate);
  return buildPrompt(template, {
    START_DATE: start,
    END_DATE: end,
    REQUIRED_SOURCES: getRequiredSources(config).map(source => `- ${source.name}: ${source.url}`).join('\n'),
    EXISTING_ITEMS: JSON.stringify(existing.slice(0, 200).map(item => ({ id: item.id, title: item.title, date: item.date, dateType: item.dateType, sourceUrl: normalizeRadarUrl(item.source.url) })))
  });
}

function getRequiredSources(config: ResearchSourcesConfig): Array<{ name: string; url: string }> {
  const social = parse(readFileSync(resolve(process.cwd(), 'data/social.yml'), 'utf8')) as SocialConfig[];
  const configured = [
    ...config.required,
    ...getSources().filter(source => source.enabled).map(source => ({ name: source.name, url: source.url })),
    ...social.filter(source => source.enabled).map(source => ({ name: source.displayName, url: source.profileUrl }))
  ];
  const seen = new Set<string>();
  return configured.filter(source => {
    const url = normalizeRadarUrl(source.url);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export class OpenAiRadarSearchClient implements RadarSearchClient {
  readonly client: OpenAI;
  constructor(apiKey = process.env.OPENAI_API_KEY) { if (!apiKey) throw new Error('OPENAI_API_KEY is required.'); this.client = new OpenAI({ apiKey }); }
  async collect(input: string): Promise<{ text: string; sourceUrls: string[] }> {
    const response = await this.client.responses.create({
      model: 'gpt-5.2',
      input,
      tools: [{ type: 'web_search' }],
      tool_choice: 'required',
      include: ['web_search_call.action.sources'],
      store: false,
      text: { format: { type: 'json_schema', name: 'radar_candidates', strict: true, schema: radarJsonSchema } }
    } as never);
    if (response.status !== 'completed') throw new Error(`OpenAI response did not complete: ${response.status}`);
    const sourceUrls = collectSourceUrls(response);
    if (sourceUrls.length === 0) throw new Error('Web Search source URLs were not returned.');
    return { text: response.output_text, sourceUrls };
  }
}

export function parseVerifiedCandidates(text: string, sourceUrls: string[]): RadarCandidate[] {
  const sources = new Set(sourceUrls.map(normalizeRadarUrl));
  const parsed = radarCandidatesSchema.parse(JSON.parse(text));
  return parsed.candidates.filter(candidate => sources.has(normalizeRadarUrl(candidate.source.url)) && candidate.researchSources.every(source => sources.has(normalizeRadarUrl(source.url))));
}

function collectSourceUrls(response: unknown): string[] {
  const found = new Set<string>();
  const visit = (value: unknown, sourceContext = false) => {
    if (Array.isArray(value)) { value.forEach(entry => visit(entry, sourceContext)); return; }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (typeof record.url === 'string' && sourceContext) { try { found.add(normalizeRadarUrl(record.url)); } catch { /* reject invalid citation */ } }
    for (const [key, entry] of Object.entries(record)) visit(entry, sourceContext || key === 'sources' || key === 'source');
  };
  visit(response);
  return [...found];
}

const radarJsonSchema = {
  type: 'object', additionalProperties: false, required: ['candidates'], properties: {
    candidates: { type: 'array', maxItems: 20, items: { type: 'object', additionalProperties: false, required: ['title', 'summary', 'category', 'date', 'dateType', 'source', 'researchSources'], properties: {
      title: { type: 'string' }, summary: { type: 'string' }, category: { type: 'string', enum: ['event', 'appearance', 'goods', 'sale', 'collaboration', 'media', 'broadcast', 'campaign', 'recruitment', 'other'] }, date: { type: ['string', 'null'] }, dateType: { type: 'string', enum: ['published', 'updated', 'event', 'sale', 'broadcast', 'other'] },
      source: { type: 'object', additionalProperties: false, required: ['name', 'url'], properties: { name: { type: 'string' }, url: { type: 'string' } } },
      researchSources: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'url'], properties: { title: { type: 'string' }, url: { type: 'string' } } } }
    } } }
  }
} as const;
