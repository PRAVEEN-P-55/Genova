export interface AbundanceItem {
  species: string;
  count: number;
}

export function computeShannonIndex(abundances: AbundanceItem[]): number {
  const total = abundances.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return 0;

  let h = 0;
  for (const item of abundances) {
    if (item.count > 0) {
      const p = item.count / total;
      h -= p * Math.log(p);
    }
  }
  return Number(h.toFixed(3));
}

export function computeSimpsonIndex(abundances: AbundanceItem[]): number {
  const total = abundances.reduce((sum, item) => sum + item.count, 0);
  if (total <= 1) return 0;

  let d = 0;
  for (const item of abundances) {
    const n = item.count;
    d += (n * (n - 1)) / (total * (total - 1));
  }
  // Gini-Simpson index (1 - D): higher = more diverse
  return Number((1 - d).toFixed(3));
}

export function computeChao1(abundances: AbundanceItem[], singletons: number = 24, doubletons: number = 8): number {
  const sObs = abundances.length;
  if (doubletons === 0) {
    return Number((sObs + (singletons * (singletons - 1)) / 2).toFixed(1));
  }
  const chao1 = sObs + (singletons * singletons) / (2 * doubletons);
  return Number(chao1.toFixed(1));
}

export function computePielouEvenness(shannon: number, speciesCount: number): number {
  if (speciesCount <= 1) return 1.0;
  const maxH = Math.log(speciesCount);
  return Number(Math.min(1.0, shannon / maxH).toFixed(3));
}

export function computeEcosystemHealthScore(params: {
  shannon: number;
  chao1: number;
  evenness: number;
  invasiveProportion: number;
  waterQualityIndex?: number;
}): { score: number; grade: string } {
  // Normalized components (0 to 100)
  const normShannon = Math.min(100, (params.shannon / 4.5) * 100);
  const normChao1 = Math.min(100, (params.chao1 / 200) * 100);
  const normEvenness = params.evenness * 100;
  const normInvasive = Math.max(0, (1 - params.invasiveProportion) * 100);

  const rawScore = 0.35 * normShannon + 0.25 * normChao1 + 0.20 * normEvenness + 0.20 * normInvasive;
  const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));

  let grade = 'C - Moderate';
  if (score >= 90) grade = 'A+ - Pristine';
  else if (score >= 80) grade = 'A - Stable & Diverse';
  else if (score >= 70) grade = 'B+ - Good';
  else if (score >= 60) grade = 'B - Fair';
  else if (score >= 50) grade = 'C+ - Vulnerable';
  else grade = 'D - Critical Degradation';

  return { score, grade };
}
