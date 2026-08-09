import { ExampleList } from "@/features/example/components/example-list";

export default function ExamplePage() {
  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">Feature de exemplo</h1>
      <ExampleList />
    </main>
  );
}
