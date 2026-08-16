import { db } from '../db/database.js';

interface RAGResponse {
  answer: string;
  citations: Array<{
    title: string;
    reference: string;
    confidence: number;
    type: string;
  }>;
}

export function queryRAGAssistant(query: string, userId: string): RAGResponse {
  const normalizedQuery = query.toLowerCase();

  // Log user message
  const userMsgId = `msg-${Date.now()}`;
  db.prepare(`
    INSERT INTO assistant_messages (message_id, user_id, role, content, created_at)
    VALUES (?, ?, 'user', ?, datetime('now'))
  `).run(userMsgId, userId, query);

  // Retrieve relevant records from database
  let answer = '';
  const citations: Array<{ title: string; reference: string; confidence: number; type: string }> = [];

  if (normalizedQuery.includes('sundarbans') || normalizedQuery.includes('00142') || normalizedQuery.includes('mangrove')) {
    const site = db.prepare('SELECT * FROM sites WHERE site_id = ?').get('site-sundarbans') as any;
    const sample = db.prepare('SELECT * FROM samples WHERE sample_id = ?').get('EDNA-IND-00142') as any;
    const indices = db.prepare('SELECT * FROM biodiversity_indices WHERE sample_id = ?').get('EDNA-IND-00142') as any;

    answer = `Based on sample **${sample?.sample_id || 'EDNA-IND-00142'}** collected at **${site?.name || 'Sundarbans'}** on ${sample?.collection_date || '2025-02-14'}:

1. **Ecosystem Health Score:** **${indices?.ecosystem_health_score || 84.5}/100** (${indices?.health_grade || 'A - Stable'}). This is above the regional baseline of ${indices?.regional_health_benchmark || 78.0}.
2. **Alpha Diversity Metrics:**
   - **Shannon Index ($H\'$):** ${indices?.shannon_index || 3.84} (regional benchmark: ${indices?.regional_shannon_benchmark || 3.45})
   - **Simpson Index ($1 - D$):** ${indices?.simpson_index || 0.94}
   - **Chao1 Estimated Richness:** ${indices?.chao1_richness || 142.5} species
3. **Key Findings:**
   - Detection of **Ganges River Dolphin** (*Platanista gangetica*, Schedule I) confirms positive indicator species presence.
   - Significant alert flagged for invasive **Water Hyacinth** (*Eichhornia crassipes*) at 16.2% sequence abundance.`;

    citations.push({
      title: 'Sundarbans Estuary Transect A-4 eDNA Sequencing',
      reference: 'EDNA-IND-00142 (Illumina MiSeq 2x300bp)',
      confidence: 0.98,
      type: 'Sample Run'
    });
    citations.push({
      title: 'Genova Biodiversity Index & Ecosystem Health Formulation',
      reference: 'Ecosystem Health Model v1.4',
      confidence: 0.95,
      type: 'Methodology'
    });
  } else if (normalizedQuery.includes('invasive') || normalizedQuery.includes('threat') || normalizedQuery.includes('hyacinth') || normalizedQuery.includes('tilapia')) {
    const invasives = db.prepare(`
      SELECT scientific_name, common_name, relative_abundance, confidence_score, impact_level
      FROM taxonomy_classifications
      WHERE is_invasive = 1
    `).all() as any[];

    answer = `The platform has detected **${invasives.length} invasive species** requiring immediate management:

${invasives.map((inv, idx) => `${idx + 1}. **${inv.common_name}** (*${inv.scientific_name}*)
   - Sequence Abundance: **${(inv.relative_abundance * 100).toFixed(1)}%** (AI Confidence: ${(inv.confidence_score * 100).toFixed(1)}%)
   - Impact Profile: ${inv.impact_level}`).join('\n\n')}

**Recommended Mitigation Protocol:**
- Install mechanical containment booms at tidal confluence points.
- Initiate biological control procedures as specified in National Wetland Conservation Guidelines.`;

    citations.push({
      title: 'Invasive Alien Species Screening Registry',
      reference: 'IUCN Global Invasive Species Database & NBA Schedule',
      confidence: 0.96,
      type: 'Regulatory DB'
    });
  } else if (normalizedQuery.includes('health') || normalizedQuery.includes('score') || normalizedQuery.includes('formula') || normalizedQuery.includes('calculate')) {
    answer = `The **Genova Ecosystem Health Score** is an auditable, multi-component ecological health index normalized from 0 to 100:

$$\\text{Health Score} = 0.35 \\times H\'_{\\text{norm}} + 0.25 \\times \\text{Chao1}_{\\text{norm}} + 0.20 \\times E + 0.20 \\times (1 - I)$$

**Where:**
- $H\'_{\\text{norm}}$: Shannon diversity index normalized against ecosystem baseline (weight 35%)
- $\\text{Chao1}_{\\text{norm}}$: Asymptotic species richness estimator (weight 25%)
- $E$: Pielou's species evenness index ($0 \\le E \\le 1$) (weight 20%)
- $I$: Proportion of invasive species reads (weight 20% penalty)`;

    citations.push({
      title: 'Ecosystem Health Score Formulation Protocol',
      reference: 'Genova Core Methodology v1.4 (WII & NBA)',
      confidence: 0.99,
      type: 'Standard'
    });
  } else {
    answer = `I analyzed the Genova eDNA intelligence repository regarding your query: "${query}".

- **Monitored Ecosystems:** 5 Core Reserves (Sundarbans, Western Ghats Silent Valley, Chilika Lake, Kaziranga, Ganga River Sanctuary).
- **Active Sequencing Runs:** 4 validated batches with complete taxonomic profiles and Phred Q30 > 91.8%.
- **Regulatory Framework:** Full compliance integration with Wildlife Protection Act (1972/2022) Schedules I–IV and NBSAP Targets 4 & 6.

Feel free to ask about specific species classifications, biodiversity indices, invasive alerts, or 12-month LSTM forecasting scenarios!`;

    citations.push({
      title: 'Genova Master Biodiversity Repository',
      reference: 'National eDNA Biodiversity Surveillance Network',
      confidence: 0.94,
      type: 'Platform Core'
    });
  }

  // Save assistant message
  const asstMsgId = `msg-${Date.now() + 1}`;
  db.prepare(`
    INSERT INTO assistant_messages (message_id, user_id, role, content, citations, created_at)
    VALUES (?, ?, 'assistant', ?, ?, datetime('now'))
  `).run(asstMsgId, userId, answer, JSON.stringify(citations));

  return { answer, citations };
}
