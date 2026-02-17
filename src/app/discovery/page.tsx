import { Container } from '@/components/ui';
import { DiscoveryListGrid } from '@/components/discovery/discovery-list-grid';
import { AdUnit } from '@/components/ads/ad-unit';
import { fetchDiscoveryLists } from './queries';
import { Compass } from 'lucide-react';
import { CATEGORY_VALUES } from '@/lib/categories';

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory =
    category &&
    CATEGORY_VALUES.includes(category as (typeof CATEGORY_VALUES)[number])
      ? category
      : null;

  const { lists, isAuthenticated, currentUserId } = await fetchDiscoveryLists();

  return (
    <Container as="section" className="py-8">
      <div className="mb-6">
        <AdUnit />
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Compass className="h-7 w-7 text-primary" />
          Discovery
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore public study lists created by the community.
        </p>
      </div>

      <DiscoveryListGrid
        allLists={lists}
        initialCategory={initialCategory}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />
    </Container>
  );
}
