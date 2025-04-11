/* eslint-disable */
// src/app/article/[id]/page.tsx

import ArticleView from './ArticleView';

export default function Page({ params }: { params: { id: string } } & { params: any }) {

  return <ArticleView id={params.id} />;

}