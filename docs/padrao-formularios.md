# Padrão de Formulários (React Hook Form + Zod)

Este documento define a padronização para criação e validação de formulários no projeto.

## Libs Utilizadas
- `react-hook-form`: Gerenciamento de estado e performance do formulário.
- `zod`: Definição de schemas e validação de dados.
- `@hookform/resolvers`: Integração do Zod com o React Hook Form.

## Estrutura Básica

1. **Definição do Schema:** Crie o schema Zod especificando os campos, regras e mensagens de erro.
2. **Setup do Hook:** Utilize o hook `useForm` informando o `zodResolver(schema)`.
3. **Mapeamento de UI:** Conecte os campos usando `...register('nomeDoCampo')` e passe o estado de erro `hasError={Boolean(errors.nomeDoCampo)}`.
4. **Mensagens de Erro:** Exiba o texto de erro logo abaixo do componente quando `errors.campo` existir.