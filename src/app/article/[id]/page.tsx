import ArticleView from './ArticleView';

export default function Page({ params }: { params: { id: string } }) {
  return <ArticleView id={params.id} />;
}
