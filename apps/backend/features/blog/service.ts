import { ErrorResponse, sendMail } from '../../shared/index.js';
import { Article, blogRepository } from './repository.js';

interface CreateArticleInput {
  question?: string;
  answer?: string;
  received?: string;
  responded?: string;
}

interface UpdateArticleInput {
  question?: string;
  answer?: string;
  received?: string;
  responded?: string;
}

interface SendQuestionInput {
  name?: string;
  phone?: string;
  question?: string;
}

const getArticles = async (): Promise<Article[]> => blogRepository.findAll();

const createArticle = async ({
  question,
  answer,
  received,
  responded,
}: CreateArticleInput): Promise<Article> => {
  if (!question || !answer || !received || !responded) {
    throw new ErrorResponse('Please add required fields', 400);
  }

  const article: Article = {
    id: blogRepository.getLastId() + 1,
    question,
    answer,
    received,
    responded,
  };

  await blogRepository.create(article);

  return article;
};

const updateArticle = async (id: string, payload: UpdateArticleInput): Promise<Article> => {
  const updatedArticle = await blogRepository.updateById(Number(id), payload);

  if (!updatedArticle) {
    throw new ErrorResponse('Resource not found', 404);
  }

  return updatedArticle;
};

const deleteArticle = async (id: string): Promise<void> => {
  const isDeleted = await blogRepository.deleteById(Number(id));

  if (!isDeleted) {
    throw new ErrorResponse('Resource not found', 404);
  }
};

const sendQuestion = async ({ name, phone, question }: SendQuestionInput): Promise<void> => {
  if (!name || !phone || !question) {
    throw new ErrorResponse('Please add required fields', 400);
  }

  await sendMail({
    from: 'Node Mailer <emailfromnodemailer@gmail.com>',
    to: 'devspot@mail.ru',
    subject: `New Question from ${name}`,
    html: question,
  });
};

export const blogService = {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  sendQuestion,
};
