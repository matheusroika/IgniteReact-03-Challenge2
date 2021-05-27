import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

import formatDateTime from '../../utils/formatDateTime';
import formatDate from '../../utils/formatDate';
import useUtterances from '../../hooks/useUtterances';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import ExitPreviewButton from '../../components/ExitPreviewButton';

interface OtherPost {
  title: string;
  slug: string;
}

interface Post {
  first_publication_date: string | null;
  editTime: string | null;
  time_to_read: string;
  postBefore: OtherPost;
  postAfter: OtherPost;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps) {
  const router = useRouter();
  useUtterances('utteranceComments', post);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetravelling.</title>
      </Head>

      <Header />
      {router.isFallback ? (
        <div>Carregando...</div>
      ) : (
        <main className={styles.container}>
          <div className={styles.bannerContainer}>
            <img src={post.data.banner.url} />
          </div>
          <article
            className={`${commonStyles.container} ${styles.postContainer}`}
          >
            <h1>{post.data.title}</h1>
            <div className={styles.extraInfo}>
              <div>
                <FiCalendar />
                <time>{post.first_publication_date}</time>
              </div>
              <div>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
              <div>
                <FiClock />
                <span>{post.time_to_read}</span>
              </div>
              {post.editTime && <i>Editado em {post.editTime}</i>}
            </div>
            {post.data.content.map(content => (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                ></div>
              </section>
            ))}
          </article>
          <div className={`${styles.divider} ${commonStyles.container}`}></div>
          <div className={`${styles.otherPosts} ${commonStyles.container}`}>
            {post.postBefore.title && (
              <Link href={`/post/${post.postBefore.slug}`}>
                <a className={styles.postBefore}>
                  <p>{post.postBefore.title}</p>
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}

            {post.postAfter.title && (
              <Link href={`/post/${post.postAfter.slug}`}>
                <a className={styles.postAfter}>
                  <p>{post.postAfter.title}</p>
                  <strong>Próximo post</strong>
                </a>
              </Link>
            )}
          </div>
          <div id="utteranceComments"></div>

          {preview && <ExitPreviewButton />}
        </main>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
    },
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const postBefore = await prismic.queryFirst(
    Prismic.Predicates.dateBefore(
      'document.first_publication_date',
      new Date(response.first_publication_date),
    ),
    { fetch: 'posts.title' },
  );
  const postAfter = await prismic.queryFirst(
    Prismic.Predicates.dateAfter(
      'document.first_publication_date',
      new Date(response.first_publication_date),
    ),
    { orderings: '[document.first_publication_date]', fetch: 'posts.title' },
  );

  const time_to_read = response.data.content.reduce((acc, cur) => {
    const wordsReadPerMinute = 200;
    const wordArray = RichText.asText(cur.body).split(' ');
    const readTimeInMinutes = wordArray.length / wordsReadPerMinute;

    return acc + readTimeInMinutes;
  }, 0);

  const editTime =
    response.first_publication_date !== response.last_publication_date
      ? formatDateTime(new Date(response.last_publication_date))
      : null;

  response.first_publication_date = formatDate(
    new Date(response.first_publication_date),
  );

  const newResponse = {
    ...response,
    editTime,
    time_to_read: Math.ceil(time_to_read) + ' min',
    postBefore: {
      title: postBefore?.data.title ?? null,
      slug: postBefore?.uid ?? null,
    },
    postAfter: {
      title: postAfter?.data.title ?? null,
      slug: postAfter?.uid ?? null,
    },
  };

  return {
    props: {
      post: newResponse,
      preview,
    },
    revalidate: 24 * 60 * 60, // 24 hours
  };
};
