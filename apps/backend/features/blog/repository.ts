import fs from 'fs';
import path from 'path';

export interface Article {
  id: number;
  question: string;
  answer: string;
  received: string;
  responded: string;
}

type ArticleUpdate = Partial<Pick<Article, 'question' | 'answer' | 'received' | 'responded'>>;

const articlesFilePath = path.join(process.cwd(), 'models/blog/model.json');

const readArticles = (): Article[] => {
  try {
    return JSON.parse(fs.readFileSync(articlesFilePath, 'utf8')) as Article[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

export const blogRepository = {
  findAll: (): Article[] => readArticles(),
  getLastId: (): number => {
    const articles = readArticles();
    return articles.length === 0 ? 0 : articles[articles.length - 1].id;
  },
  create: async (article: Article): Promise<void> => {
    const articles = readArticles();
    articles.push(article);
    await fs.promises.writeFile(articlesFilePath, JSON.stringify(articles));
  },
  updateById: async (id: number, payload: ArticleUpdate): Promise<Article | null> => {
    const articles = readArticles();
    const index = articles.findIndex((article) => article.id === id);

    if (index === -1) {
      return null;
    }

    const updatedArticle: Article = {
      ...articles[index],
      question: payload.question ?? articles[index].question,
      answer: payload.answer ?? articles[index].answer,
      received: payload.received ?? articles[index].received,
      responded: payload.responded ?? articles[index].responded,
    };

    articles[index] = updatedArticle;
    await fs.promises.writeFile(articlesFilePath, JSON.stringify(articles));

    return updatedArticle;
  },
  deleteById: async (id: number): Promise<boolean> => {
    const articles = readArticles();
    const index = articles.findIndex((article) => article.id === id);

    if (index === -1) {
      return false;
    }

    articles.splice(index, 1);
    await fs.promises.writeFile(articlesFilePath, JSON.stringify(articles));

    return true;
  },
};
