/**
 * Retorna a URL da imagem de capa para cada departamento.
 * O matching tolera acentos (graças ao normalize NFD) e aceita
 * tanto o tipo do grupo (ex: "Crianças") quanto o nome oficial
 * (ex: "Jardim de Deus").
 */
export function imagemDoDepartamento(nome: string): string {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove acentos para matching robusto

  // Crianças / Jardim de Deus
  if (/crian|jardim/.test(n))
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80";

  // Jovens / Som de Adoradores
  if (/jovem|jovens|som\s*de|adorador/.test(n))
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80";

  // Irmãs / Rosa de Saron
  if (/irma|irmas|rosa|saron/.test(n))
    return "https://images.unsplash.com/photo-1490750967868-88df5691cc4e?w=1200&q=80";

  // Adolescentes / Heróis da Fé
  if (/adolescen|hero|heroi|fe/.test(n))
    return "https://images.unsplash.com/photo-1574169208507-84376144848b?w=1200&q=80";

  // Orquestra / Shekna
  if (/orquestra|shekna|shekin/.test(n))
    return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80";

  // Banda / Cozinha / Frutos da Promessa
  if (/banda|cozinha|fruto|promessa/.test(n))
    return "https://images.unsplash.com/photo-1501386761578-eaa54b915e8a?w=1200&q=80";

  // Fallback genérico (worship/louvor)
  return "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=80";
}
