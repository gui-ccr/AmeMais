import { ExampleList } from "@/features/_example-demo/components/example-list";

export default function ExamplePage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Feature de exemplo (código de demonstração)</h1>
      <p className="text-sm text-neutral-500">
        Só para ilustrar o consumo do apps/api — não é uma feature real do produto.
      </p>
      <ExampleList />
    </main>
  );
}
