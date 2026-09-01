export function MapEmbed({ height = 210 }: { height?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-border bg-white">
      <iframe
        src="https://www.openstreetmap.org/export/embed.html?bbox=-41.55%2C-17.89%2C-41.46%2C-17.82&layer=mapnik&marker=-17.8595%2C-41.5087"
        style={{ height }}
        className="block w-full border-0"
        title="Mapa de Teófilo Otoni"
      />
    </div>
  );
}
