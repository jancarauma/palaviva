// src/app/article/[id]/page.tsx

import ArticleView from './ArticleView';

type PageProps = {
  params: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function Page(props: PageProps) {
  const { id } = props.params;
  return <ArticleView id={id} />;
}
