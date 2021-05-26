import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function formatDate(date: Date) {
  const formattedDate = format(date, 'dd MMM yyyy', {
    locale: ptBR,
  });

  return formattedDate;
}
