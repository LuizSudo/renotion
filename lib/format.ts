export function relativeTimePt(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `Há ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hora${hours === 1 ? "" : "s"} atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} semana${weeks === 1 ? "" : "s"} atrás`;
  const months = Math.floor(days / 30);
  return `${months} mês${months === 1 ? "" : "es"} atrás`;
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
