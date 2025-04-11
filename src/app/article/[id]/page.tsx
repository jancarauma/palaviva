// src/app/article/[id]/page.tsx

import ArticleView from './ArticleView';
import { type DynamicRoute } from 'next';

export default function Page({ params }: DynamicRoute<{ id: string }>) {
  return <ArticleView id={params.id} />;
}