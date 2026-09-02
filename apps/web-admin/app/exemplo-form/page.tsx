"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Schema do Zod
const petSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  especie: z.string().min(1, "Selecione uma espécie válida."),
});

type PetFormData = z.infer<typeof petSchema>;

export default function ExemploFormPage() {
  // 2. Integração React Hook Form
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
  });

  const onSubmit = (data: PetFormData) => {
    console.log("Dados salvos com sucesso:", data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-xl font-bold mb-6">Exemplo de Formulário Padronizado</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Nome do Animal</label>
          <Input
            {...register("nome")}
            placeholder="Ex: Bidu"
            hasError={Boolean(errors.nome)}
          />
          {errors.nome && (
            <span className="text-xs text-destructive">{errors.nome.message}</span>
          )}
        </div>

        {/* Campo Select */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Espécie</label>
          <Controller
            control={control}
            name="especie"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger hasError={Boolean(errors.especie)}>
                  <SelectValue placeholder="Selecione uma opção..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cachorro">Cachorro</SelectItem>
                  <SelectItem value="gato">Gato</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.especie && (
            <span className="text-xs text-destructive">{errors.especie.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}