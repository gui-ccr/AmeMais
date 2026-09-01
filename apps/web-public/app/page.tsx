import { Hero } from "@/features/home/components/hero";
import { Stats } from "@/features/home/components/stats";
import { Story } from "@/features/home/components/story";
import { FeaturedPets } from "@/features/home/components/featured-pets";
import { UrgenciesAndCollection } from "@/features/home/components/urgencies-and-collection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Story />
      <FeaturedPets />
      <UrgenciesAndCollection />
    </>
  );
}
