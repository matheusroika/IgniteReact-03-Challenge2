import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function formatDate(date: Date) {
  const formattedDate = format(date, "dd MMM yyyy', às' HH:mm", {
    locale: ptBR,
  });

  return formattedDate;
}
