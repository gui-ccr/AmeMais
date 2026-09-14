import tseslint from "typescript-eslint";
import baseConfig from "./base.js";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...baseConfig,
  ...compat.extends("next/core-web-vitals"),
  {
    // Arquivo gerado e mantido pelo próprio Next.js — não é pra editar
    // nem lintar.
    ignores: ["next-env.d.ts"],
  },
  {
    // "next/core-web-vitals" (via eslint-config-next) sobrescreve tanto o
    // parser quanto o plugin "@typescript-eslint" com cópias internas
    // próprias, que juntas quebram a regra `no-unused-vars` com um crash
    // (`node.params is not iterable`) em qualquer tipo de função — inclusive
    // um método de interface (`interface I { foo(): void }`). Reafirma os
    // dois aqui, por último, pra usar o parser/plugin @typescript-eslint
    // padrão em vez das cópias do eslint-config-next.
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
