type PageProps = {
  params: {
    id: string;
  };
};

import ArticleView from './ArticleView';

export default function Page({ params }: PageProps) {
  return <ArticleView id={params.id} />;
}