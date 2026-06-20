// Blocklist própria (PT-BR) — decisão registrada na spec TASK18: sem lib externa de
// profanity filter. Lista isolada e testável; fácil de estender sem mudar o contrato
// de `containsProhibitedLanguage`.
export const PROHIBITED_TERMS: readonly string[] = [
  "arrombado",
  "babaca",
  "bosta",
  "burro",
  "caralho",
  "cuzao",
  "cuzão",
  "desgraça",
  "estupido",
  "estúpido",
  "idiota",
  "imbecil",
  "merda",
  "otario",
  "otário",
  "porra",
  "puta",
  "retardado",
  "viado",
];

// Caracteres especiais de regex que podem aparecer em termos da blocklist (acentos
// não precisam de escape, mas mantemos a função genérica por segurança).
function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// `\b` (word boundary) do JS é baseado em `\w` (ASCII), o que falha para acentos
// (ex.: en "não" o "\b" antes de "ã" não funciona como esperado). Por isso usamos
// lookaround com classe de caracteres "não-letra" (unicode-aware) como delimitador,
// em vez de `\b` puro — garante que "classificar" não seja bloqueado por conter
// substring de um termo curto incidental dentro de outra palavra.
function buildWordBoundaryPattern(term: string): RegExp {
  const escaped = escapeRegExp(term);
  return new RegExp(`(?<![a-zA-Z0-9À-ÿ])${escaped}(?![a-zA-Z0-9À-ÿ])`, "iu");
}

const PROHIBITED_PATTERNS: RegExp[] = PROHIBITED_TERMS.map(buildWordBoundaryPattern);

/**
 * Verifica se o texto contém algum termo da blocklist, respeitando limites de
 * palavra (case-insensitive). Não marca falso positivo por substring incidental
 * dentro de outra palavra (ex.: "classificar" não é bloqueado mesmo que contenha
 * uma substring igual a um termo curto da lista).
 */
export function containsProhibitedLanguage(text: string): boolean {
  return PROHIBITED_PATTERNS.some((pattern) => pattern.test(text));
}
