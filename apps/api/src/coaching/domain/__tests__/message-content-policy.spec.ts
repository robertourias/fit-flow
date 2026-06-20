import { containsProhibitedLanguage, PROHIBITED_TERMS } from "../message-content-policy";

describe("containsProhibitedLanguage()", () => {
  it("blocks exact term match", () => {
    expect(containsProhibitedLanguage("merda")).toBe(true);
  });

  it("blocks term within a sentence", () => {
    expect(containsProhibitedLanguage("você é um idiota mesmo")).toBe(true);
  });

  it("is case-insensitive (uppercase)", () => {
    expect(containsProhibitedLanguage("PORRA, isso não funciona")).toBe(true);
  });

  it("is case-insensitive (mixed case)", () => {
    expect(containsProhibitedLanguage("Que Merda")).toBe(true);
  });

  it("does not block clean messages", () => {
    expect(containsProhibitedLanguage("Bom treino hoje, parabéns pelo esforço!")).toBe(false);
  });

  it("does not flag a term that is a substring inside another word (computador/puta)", () => {
    expect(containsProhibitedLanguage("Esqueci o computador na sala")).toBe(false);
  });

  it("does not flag a term that is a substring inside another word (disputar/puta)", () => {
    expect(containsProhibitedLanguage("Vamos disputar a próxima etapa")).toBe(false);
  });

  it("does not flag a term that is a substring inside another word (reputação/puta)", () => {
    expect(containsProhibitedLanguage("Cuide da sua reputação")).toBe(false);
  });

  it("does not flag a term that is a substring inside another word (deputado/puta)", () => {
    expect(containsProhibitedLanguage("O deputado foi eleito")).toBe(false);
  });

  it("does not flag a term that is a prefix inside another word (imbecilidade/imbecil)", () => {
    // "imbecil" é prefixo de "imbecilidade", mas não há boundary depois — não deve bloquear
    expect(containsProhibitedLanguage("Isso é uma imbecilidade sem nome")).toBe(false);
  });

  it("still blocks the term when followed by punctuation", () => {
    expect(containsProhibitedLanguage("Seu burro!")).toBe(true);
  });

  it("still blocks the term at the start of the string", () => {
    expect(containsProhibitedLanguage("Burro, isso está errado")).toBe(true);
  });

  it("exposes a non-empty blocklist", () => {
    expect(PROHIBITED_TERMS.length).toBeGreaterThan(0);
  });
});
