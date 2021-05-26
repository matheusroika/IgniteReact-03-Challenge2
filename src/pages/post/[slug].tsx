import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import formatDate from '../../utils/formatDate';
import Header from '../../components/Header';
import { RichText } from 'prismic-dom';
import Head from 'next/head';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  time_to_read: string;
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
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>{post.data.title} | spacetravelling.</title>
      </Head>

      <Header />
      {router.isFallback ? (
        <div>Carregando...</div>
      ) : (
        <main>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  response.first_publication_date = formatDate(
    new Date(response.first_publication_date),
  );

  const time_to_read = response.data.content.reduce((acc, cur) => {
    const wordsReadPerMinute = 200;
    const wordArray = RichText.asText(cur.body).split(' ');
    const readTimeInMinutes = wordArray.length / wordsReadPerMinute;

    return acc + readTimeInMinutes;
  }, 0);

  response.time_to_read = Math.ceil(time_to_read) + ' min';

  return {
    props: {
      post: response,
    },
    revalidate: 24 * 60 * 60, // 24 hours
  };
};
