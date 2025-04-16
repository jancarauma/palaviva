"use client";

import { useParams } from 'next/navigation';
import FlashcardsView from '@/components/FlashCardsPage/FlashCardsView';

export default function Page() {
  const params = useParams();
  return <FlashcardsView id={params.id as string} />;
}