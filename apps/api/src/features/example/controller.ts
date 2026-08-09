import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/middleware/auth";
import { withCors } from "@/middleware/cors";
import { exampleService } from "./service";
import { createExampleSchema } from "./schema";

/**
 * Camada de controller: traduz HTTP <-> chamadas de service.
 * Não contém regra de negócio nem acesso a dados diretamente.
 *
 * Esta feature ("example") é só uma demonstração de conectividade
 * front -> API -> Supabase e por isso NÃO chama requireUser(). Toda
 * feature de negócio real deve chamar requireUser(request) logo no
 * início do controller, como mostrado (comentado) abaixo.
 */
export async function listExamplesController(_request: NextRequest) {
  try {
    // await requireUser(request); // features reais devem exigir isso
    const examples = await exampleService.listExamples();
    return withCors(NextResponse.json({ data: examples }));
  } catch (error) {
    return handleError(error);
  }
}

export async function createExampleController(request: NextRequest) {
  try {
    // await requireUser(request); // features reais devem exigir isso
    const body = await request.json();
    const input = createExampleSchema.parse(body);
    const example = await exampleService.createExample(input);
    return withCors(NextResponse.json({ data: example }, { status: 201 }));
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return withCors(NextResponse.json({ error: error.message }, { status: 401 }));
  }
  if (error instanceof ZodError) {
    return withCors(NextResponse.json({ error: "Dados inválidos", issues: error.issues }, { status: 400 }));
  }
  console.error(error);
  return withCors(NextResponse.json({ error: "Erro interno" }, { status: 500 }));
}
