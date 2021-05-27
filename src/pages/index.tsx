import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import formatPosts from '../utils/formatPosts';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiUser } from 'react-icons/fi';
import ExitPreviewButton from '../components/ExitPreviewButton';

export interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(
    formatPosts(postsPagination.results),
  );
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleLoadNextPage() {
    const response = await fetch(nextPage);
    const data = await response.json();

    const newPosts = [...posts, ...formatPosts(data.results)];
    setPosts(newPosts);

    if (data.next_page) {
      setNextPage(data.next_page);
    } else {
      setNextPage(null);
    }
  }

  return (
    <>
      <Head>
        <title>Posts | spacetravelling.</title>
      </Head>

      <header className={`${commonStyles.container} ${styles.header}`}>
        <img src="/images/logo.svg" alt="logo" />
      </header>
      <main className={`${styles.container} ${commonStyles.container}`}>
        {posts.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
              </a>
            </Link>
            <p>{post.data.subtitle}</p>
            <div>
              <FiCalendar />
              <time>{post.first_publication_date}</time>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
          </div>
        ))}

        {nextPage && (
          <button
            onClick={handleLoadNextPage}
            className={styles.loadMoreButton}
            type="button"
          >
            Carregar mais posts
          </button>
        )}

        {preview && <ExitPreviewButton />}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    },
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
    revalidate: 1 * 60 * 60, // 1 hour
  };
};
