import type { Metadata } from "next";
import { ListView } from "@/components/list/list-view";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return <ListView listId={listId} />;
}
