import { useEffect } from 'react';

export default function useUtterances(commentNodeId, post) {
  useEffect(() => {
    const commentParent = document.getElementById(commentNodeId);
    if (!commentParent) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'matheusroika/IgniteReact-03-Challenge2');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');

    commentParent.appendChild(script);

    return () => {
      commentParent.removeChild(commentParent.firstChild);
    };
  }, [commentNodeId, post]);
}
