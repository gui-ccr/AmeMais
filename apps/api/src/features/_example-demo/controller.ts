import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { exampleService } from "./service";
import { createExampleSchema } from "./schema";

/**
 * Camada de controller: traduz HTTP <-> chamadas de service.
 * Não contém regra de negócio nem acesso a dados diretamente.
 *
 * Esta feature ("example") é só uma demonstração de conectividade
 * front -> API -> Supabase e por isso NÃO chama requireUser()/requireRole().
 * Toda feature de negócio real deve chamar uma delas logo no início do
 * controller, como mostrado (comentado) abaixo.
 */
export async function listExamplesController(_request: NextRequest) {
  try {
    // await requireUser(request); // features reais devem exigir isso
    const examples = await exampleService.listExamples();
    return ok(examples);
  } catch (error) {
    return fail(error);
  }
}

export async function createExampleController(request: NextRequest) {
  try {
    // await requireRole(request, ["Admin", "Voluntário"]); // features administrativas devem exigir isso
    const body = await request.json();
    const input = createExampleSchema.parse(body);
    const example = await exampleService.createExample(input);
    return created(example);
  } catch (error) {
    return fail(error);
  }
}
