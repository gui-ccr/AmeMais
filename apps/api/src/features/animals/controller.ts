import { NextRequest } from "next/server";
import { created, fail, ok } from "@/core/http";
import { requireRole } from "@/middleware/rbac";
import { getSupabaseClientForRequest } from "./repository";
import { createAnimalSchema, updateAnimalSchema } from "./schema";
import { animalService } from "./service";

type RouteContext = {
  params?: Promise<{ id?: string }> | { id?: string };
};

/**
 * Resolução de ID suportando contexto dinâmico do Next.js 14/15, query param ?id= ou body.id.
 */
async function resolveId(request: NextRequest, context?: RouteContext): Promise<string> {
  if (context?.params) {
    const resolved = await context.params;
    if (resolved?.id) return resolved.id;
  }

  const queryId = request.nextUrl.searchParams.get("id");
  if (queryId) return queryId;

  return "";
}

/**
 * GET /api/animais
 * Lista os animais. Respeita o RLS: visitantes anônimos recebem apenas animais disponíveis,
 * enquanto colaboradores/admin logados recebem a lista completa.
 */
export async function listAnimalsController(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const client = await getSupabaseClientForRequest(request);

    const animals = await animalService.listAnimals(status ? { status } : undefined, client);
    return ok(animals);
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/animais/[id]
 * Retorna os detalhes de um animal específico.
 */
export async function getAnimalByIdController(request: NextRequest, context?: RouteContext) {
  try {
    const id = await resolveId(request, context);
    const client = await getSupabaseClientForRequest(request);

    const animal = await animalService.getAnimalById(id, client);
    return ok(animal);
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/animais
 * Cadastra um novo animal.
 * - Bloqueio Antecipado (Fail-Fast): exige cargo Admin ou Voluntário via RBAC antes de qualquer operação.
 * - Validação Zod: garante todos os campos requeridos.
 * - RLS: conecta com o cliente configurado com headers/cookies do usuário.
 * - Resposta padronizada 201 Created.
 */
export async function createAnimalController(request: NextRequest) {
  try {
    // 1. [Segurança da API] Bloqueio Antecipado (Fail-Fast) via RBAC
    await requireRole(request, ["Admin", "Voluntário"]);

    // 2. Validação dos dados via Zod
    const body = await request.json();
    const input = createAnimalSchema.parse(body);

    // 3. Cliente Supabase com os headers/cookies da requisição (respeitando o RLS)
    const client = await getSupabaseClientForRequest(request);

    // 4. Execução da persistência
    const createdAnimal = await animalService.createAnimal(input, client);

    // 5. Retorno com formatador padronizado e Status 201
    return created(createdAnimal);
  } catch (error) {
    return fail(error);
  }
}

/**
 * PUT / PATCH /api/animais/[id] (ou /api/animais)
 * Atualiza os dados de um animal existente.
 * - Bloqueio Antecipado (Fail-Fast): exige cargo Admin ou Voluntário via RBAC.
 */
export async function updateAnimalController(request: NextRequest, context?: RouteContext) {
  try {
    // 1. [Segurança da API] Bloqueio Antecipado (Fail-Fast) via RBAC
    await requireRole(request, ["Admin", "Voluntário"]);

    const body = await request.json();
    const id = (await resolveId(request, context)) || (body && typeof body === "object" ? body.id : "");
    const input = updateAnimalSchema.parse(body);

    const client = await getSupabaseClientForRequest(request);
    const updatedAnimal = await animalService.updateAnimal(id, input, client);

    return ok(updatedAnimal);
  } catch (error) {
    return fail(error);
  }
}

/**
 * DELETE /api/animais/[id] (ou /api/animais)
 * Exclui um animal.
 * - Bloqueio Antecipado (Fail-Fast): exige cargo Admin ou Voluntário via RBAC.
 */
export async function deleteAnimalController(request: NextRequest, context?: RouteContext) {
  try {
    // 1. [Segurança da API] Bloqueio Antecipado (Fail-Fast) via RBAC
    await requireRole(request, ["Admin", "Voluntário"]);

    const id = await resolveId(request, context);
    const client = await getSupabaseClientForRequest(request);

    await animalService.deleteAnimal(id, client);

    return ok({ message: "Animal removido com sucesso" });
  } catch (error) {
    return fail(error);
  }
}

