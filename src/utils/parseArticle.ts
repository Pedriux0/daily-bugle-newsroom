import { ArticleData, ThreatData } from '../types/news';

/**
 * Strips stray <cite> tags and other markup from text.
 */
function stripCitations(text: string): string {
  return text
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/g, '')
    .replace(/<\/?cite[^>]*>/g, '')
    // Small models sometimes write "\n" as visible text; turn it into a real break
    .replace(/\\n/g, '\n')
    // Squeeze spaces but keep the line breaks that separate paragraphs
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

/**
 * Extracts a JSON object string from text that may contain
 * markdown code blocks or surrounding prose.
 */
function extractJSON(text: string): string {
  // Try markdown code block first
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlock) return codeBlock[1];

  // Try raw JSON object (outermost braces)
  const raw = text.match(/\{[\s\S]*\}/);
  if (raw) return raw[0];

  return text;
}

export function parseArticleResponse(text: string): ArticleData {
  try {
    const json = extractJSON(text);
    const parsed = JSON.parse(json);
    return {
      headline: stripCitations(parsed.headline || 'BREAKING NEWS'),
      subheadline: stripCitations(parsed.subheadline || ''),
      body: stripCitations(parsed.body || ''),
      jamesons_take: stripCitations(parsed.jamesons_take || ''),
    };
  } catch {
    // Graceful fallback — still show something useful
    return {
      headline: 'PARKER! WHERE ARE MY PHOTOS?!',
      subheadline: 'Technical difficulties at the Daily Bugle',
      body: stripCitations(text) || 'Jameson is having a bad day. The printing press seems to be jammed.',
      jamesons_take:
        "This is all Spider-Man's fault! He probably webbed up our servers! " +
        "— J. Jonah Jameson, Editor-in-Chief",
    };
  }
}

export function parseThreatResponse(text: string): ThreatData {
  try {
    const json = extractJSON(text);
    const parsed = JSON.parse(json);
    return {
      threat_level: ['Green', 'Yellow', 'Red'].includes(parsed.threat_level)
        ? parsed.threat_level
        : 'Yellow',
      summary: stripCitations(parsed.summary || ''),
      analysis: stripCitations(parsed.analysis || ''),
      recommended_actions: Array.isArray(parsed.recommended_actions)
        ? parsed.recommended_actions.map((a: string) => stripCitations(a))
        : [],
    };
  } catch {
    return {
      threat_level: 'Yellow',
      summary: 'Spider-Sense experiencing interference — unable to parse threat data.',
      analysis: stripCitations(text) || 'Sensor array recalibrating. Retry recommended.',
      recommended_actions: ['Retry threat scan', 'Run system diagnostics'],
    };
  }
}

/**
 * Reads a string field out of a JSON object that is still being streamed,
 * e.g. '{"headline":"SPIDER-MAN STR' → 'SPIDER-MAN STR'. Used for live previews.
 */
export function readPartialField(raw: string, key: string): string {
  const match = raw.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`));
  if (!match) return '';
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\$/, '');
}
