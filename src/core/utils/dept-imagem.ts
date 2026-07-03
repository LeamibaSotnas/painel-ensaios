export function imagemDoDepartamento(nome: string): string {
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Criancas / Jardim de Deus
  if (/crian|jardim/.test(n))
    return "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80";

  // Jovens / Som de Adoradores
  if (/jovem|jovens|som\s*de|adorador/.test(n))
    return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80";

  // Irmas / Rosa de Saron (Pexels 931177)
  if (/irma|rosa|saron/.test(n))
    return "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  // Adolescentes / Herois da Fe
  if (/adolescen|hero|heroi/.test(n))
    return "https://images.unsplash.com/photo-1574169208507-84376144848b?w=1200&q=80";

  // Orquestra / Shekna
  if (/orquestra|shekna|shekin/.test(n))
    return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80";

  // Banda / Cozinha / Frutos da Promessa (Pexels 1190297)
  if (/banda|cozinha|fruto|promessa/.test(n))
    return "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

  // Fallback
  return "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=80";
}
