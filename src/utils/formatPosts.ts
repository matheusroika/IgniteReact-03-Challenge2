import formatDate from './formatDate';
import { Post } from '../pages/index';

export default function formatPosts(postData: Post[]) {
  const posts = postData.map(post => {
    const formattedDate = formatDate(new Date(post.first_publication_date));

    return {
      uid: post.uid,
      first_publication_date: formattedDate,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return posts;
}
