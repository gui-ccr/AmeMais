import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { dictionary as ptBrDictionary, translations } from "@zxcvbn-ts/language-pt-br";

const zxcvbn = new ZxcvbnFactory({
  translations,
  graphs: adjacencyGraphs,
  dictionary: {
    ...commonDictionary,
    ...ptBrDictionary,
  },
});

/** Score mínimo (0-4) aceito para uma senha nova. */
export const MIN_PASSWORD_SCORE = 2;

export function checkPasswordStrength(password: string, userInputs: string[] = []) {
  return zxcvbn.check(password, userInputs);
}
