// src/app/article/[id]/page.tsx

import ArticleView from './ArticleView';

export default function Page({ params }) {
  // params.id aqui já vem corretamente tipado pelo Next.js
  return <ArticleView id={params.id} />;
}
