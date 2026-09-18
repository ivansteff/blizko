type WordProfile = { word: string; tags: string[] };

const WORDS: WordProfile[] = [
  { word: "море", tags: ["природа","вода","отдых","пространство","синий"] },
  { word: "океан", tags: ["природа","вода","пространство","синий"] },
  { word: "река", tags: ["природа","вода","движение"] },
  { word: "озеро", tags: ["природа","вода","отдых"] },
  { word: "волна", tags: ["природа","вода","движение"] },
  { word: "пляж", tags: ["природа","вода","отдых","песок"] },
  { word: "остров", tags: ["природа","вода","земля","путешествие"] },
  { word: "лодка", tags: ["вода","транспорт","путешествие"] },
  { word: "рыба", tags: ["вода","животное","еда"] },
  { word: "дождь", tags: ["природа","вода","погода"] },
  { word: "лес", tags: ["природа","растение","земля","зелёный"] },
  { word: "дерево", tags: ["природа","растение","зелёный"] },
  { word: "цветок", tags: ["природа","растение","красота"] },
  { word: "гора", tags: ["природа","земля","высота","путешествие"] },
  { word: "небо", tags: ["природа","пространство","высота","синий"] },
  { word: "солнце", tags: ["природа","небо","тепло","свет"] },
  { word: "луна", tags: ["природа","небо","ночь","свет"] },
  { word: "звезда", tags: ["природа","небо","ночь","свет"] },
  { word: "облако", tags: ["природа","небо","погода"] },
  { word: "снег", tags: ["природа","вода","погода","холод"] },
  { word: "дом", tags: ["место","здание","семья","уют"] },
  { word: "комната", tags: ["место","дом","уют"] },
  { word: "кухня", tags: ["место","дом","еда"] },
  { word: "окно", tags: ["дом","здание","свет"] },
  { word: "дверь", tags: ["дом","здание","вход"] },
  { word: "стол", tags: ["дом","мебель","работа","еда"] },
  { word: "стул", tags: ["дом","мебель"] },
  { word: "кровать", tags: ["дом","мебель","сон","уют"] },
  { word: "город", tags: ["место","здание","люди","транспорт"] },
  { word: "улица", tags: ["место","город","транспорт"] },
  { word: "машина", tags: ["транспорт","движение","город"] },
  { word: "поезд", tags: ["транспорт","движение","путешествие"] },
  { word: "самолёт", tags: ["транспорт","высота","путешествие"] },
  { word: "дорога", tags: ["место","движение","транспорт","путешествие"] },
  { word: "школа", tags: ["место","здание","учёба","дети"] },
  { word: "книга", tags: ["знание","учёба","история","текст"] },
  { word: "слово", tags: ["язык","текст","общение","знание"] },
  { word: "музыка", tags: ["искусство","звук","эмоция"] },
  { word: "песня", tags: ["искусство","звук","музыка","голос"] },
  { word: "кино", tags: ["искусство","история","экран"] },
  { word: "телефон", tags: ["техника","общение","экран"] },
  { word: "компьютер", tags: ["техника","работа","экран"] },
  { word: "игра", tags: ["развлечение","правила","друзья"] },
  { word: "мяч", tags: ["спорт","игра","движение"] },
  { word: "футбол", tags: ["спорт","игра","мяч","команда"] },
  { word: "друг", tags: ["человек","общение","эмоция","доверие"] },
  { word: "семья", tags: ["люди","дом","любовь","доверие"] },
  { word: "любовь", tags: ["эмоция","человек","тепло"] },
  { word: "радость", tags: ["эмоция","счастье","свет"] },
  { word: "мечта", tags: ["мысль","будущее","эмоция"] },
  { word: "время", tags: ["абстрактное","движение","жизнь"] },
  { word: "жизнь", tags: ["абстрактное","человек","природа","время"] },
  { word: "работа", tags: ["дело","человек","время"] },
  { word: "деньги", tags: ["общество","работа","ценность"] },
  { word: "хлеб", tags: ["еда","дом","тепло"] },
  { word: "чай", tags: ["еда","напиток","тепло","уют"] },
  { word: "кофе", tags: ["еда","напиток","тепло","работа"] },
  { word: "яблоко", tags: ["еда","растение","фрукт"] },
  { word: "собака", tags: ["животное","дом","друг"] },
  { word: "кошка", tags: ["животное","дом","уют"] },
  { word: "птица", tags: ["животное","небо","движение"] },
];

const TARGETS = ["море","лес","солнце","дом","город","книга","музыка","телефон","игра","друг","время","чай"];

const normalize = (value: string) => value.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[^а-я-]/g, "").trim();

function bigrams(word: string) {
  const result = new Set<string>();
  for (let i = 0; i < word.length - 1; i++) result.add(word.slice(i, i + 2));
  return result;
}

export function pickTarget(seed: number) {
  return TARGETS[Math.abs(seed) % TARGETS.length];
}

export function scoreGuess(rawGuess: string, rawTarget: string) {
  const guess = normalize(rawGuess);
  const target = normalize(rawTarget);
  if (!guess || guess.length < 2) return { word: guess, score: 0, rank: 9999 };
  if (guess === target) return { word: guess, score: 100, rank: 1 };

  const guessProfile = WORDS.find((item) => normalize(item.word) === guess);
  const targetProfile = WORDS.find((item) => normalize(item.word) === target);
  const sharedTags = guessProfile && targetProfile ? guessProfile.tags.filter((tag) => targetProfile.tags.includes(tag)).length : 0;
  const tagScore = targetProfile ? Math.min(78, sharedTags * 19) : 0;
  const a = bigrams(guess); const b = bigrams(target);
  const overlap = [...a].filter((part) => b.has(part)).length;
  const spellingScore = Math.round((overlap / Math.max(1, new Set([...a, ...b]).size)) * 38);
  const score = Math.min(94, Math.max(2, tagScore + spellingScore + ((guessProfile && sharedTags) ? 6 : 0)));
  return { word: guess, score, rank: Math.max(2, Math.round((100 - score) * 10) + 1) };
}
