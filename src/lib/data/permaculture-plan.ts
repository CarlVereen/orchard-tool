export interface PermacultureTask {
  year: number
  quarter: number
  title: string
  description: string
  phase: string
}

export const PERMACULTURE_PHASES = [
  'Observe & Plan',
  'Soil & Water Infrastructure',
  'Guild Planting & Understory',
  'Expansion & Refinement',
  'Maturation & Integration',
] as const

export function getPhaseNameForNumber(phaseNumber: number): string {
  return PERMACULTURE_PHASES[phaseNumber - 1] ?? `Phase ${phaseNumber}`
}

export function getTotalPhases(): number {
  return PERMACULTURE_PHASES.length
}

export const PERMACULTURE_PLAN: PermacultureTask[] = [
  // ── Phase 1: Observe & Plan (Year 1) ──────────────────────────────────────

  {
    year: 1,
    quarter: 1,
    title: 'Begin site observation journal',
    description: 'Start recording sun patterns, prevailing winds, frost pockets, and wildlife activity across the property. Note where water pools after rain.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 1,
    title: 'Conduct comprehensive soil tests',
    description: 'Sample soil from multiple zones (under trees, open areas, low spots, slopes). Test for pH, organic matter, macro/micronutrients, and texture.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 2,
    title: 'Map existing features and resources',
    description: 'Create a base map showing all existing trees, structures, fences, water sources, roads, and utilities. Include slopes and approximate contour lines.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 2,
    title: 'Identify microclimates and sun/shade patterns',
    description: 'Document areas that warm early in spring, stay cool in summer, get reflected heat from structures, or sit in wind corridors. These drive plant placement.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 3,
    title: 'Research guild designs for your fruit species',
    description: 'Study companion planting guilds suited to your existing fruit trees. Identify nitrogen fixers, dynamic accumulators, pest confusers, and ground covers for each species.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 3,
    title: 'Assess water harvesting potential',
    description: 'Calculate roof catchment area, measure slope runoff patterns, and identify natural water collection points. Estimate annual rainfall volume available for capture.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 4,
    title: 'Create sector analysis and zone map',
    description: 'Map permaculture zones (0-5) based on visit frequency. Overlay sector analysis: sun arc, prevailing winds, water flow, fire risk, noise, views to preserve.',
    phase: 'Observe & Plan',
  },
  {
    year: 1,
    quarter: 4,
    title: 'Draft preliminary design concept',
    description: 'Synthesize a year of observations into an initial design. Prioritize water management, access paths, and the first planting areas. This is a living document.',
    phase: 'Observe & Plan',
  },

  // ── Phase 2: Soil & Water Infrastructure (Year 2) ─────────────────────────

  {
    year: 2,
    quarter: 1,
    title: 'Design water harvesting features',
    description: 'Plan swale locations on contour, rain garden placement, and any berms or water-spreading features. Design for your average and peak rainfall events.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 1,
    title: 'Source and order cover crop seed',
    description: 'Select a diverse cover crop mix: nitrogen fixers (crimson clover, hairy vetch), dynamic accumulators (daikon radish, comfrey), and biomass producers (rye, oats).',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 2,
    title: 'Build first swales on contour',
    description: 'Start with one section of the property. Dig swales on contour (use an A-frame level) with berms on the downhill side. Plant berm tops with pioneer species.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 2,
    title: 'Plant initial cover crops',
    description: 'Seed cover crop mix into bare areas between tree rows. Focus on areas with poor soil test results first. Mow or chop-and-drop before seed set.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 3,
    title: 'Install first rain garden or catchment',
    description: 'Build a rain garden at a natural low point to capture roof or path runoff. Plant with native sedges, irises, and rain-tolerant perennials.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 3,
    title: 'Sheet mulch first guild planting areas',
    description: 'Lay cardboard overlapped 6 inches, topped with 8-12 inches of wood chips or leaves around selected fruit trees. This builds soil biology and suppresses weeds.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 4,
    title: 'Plant nitrogen-fixing support species',
    description: 'Install nitrogen-fixing shrubs and trees: autumn olive, Siberian pea shrub, or native leguminous shrubs. Place at guild edges where they won\'t shade fruit trees.',
    phase: 'Soil & Water Infrastructure',
  },
  {
    year: 2,
    quarter: 4,
    title: 'Assess Year 1 observations and refine design',
    description: 'Review what worked: Did swales capture water effectively? Did cover crops establish? Update the design based on real results before proceeding.',
    phase: 'Soil & Water Infrastructure',
  },

  // ── Phase 3: Guild Planting & Understory (Year 3) ─────────────────────────

  {
    year: 3,
    quarter: 1,
    title: 'Design specific guilds for each fruit tree zone',
    description: 'Plan multi-layer guilds: overstory (fruit tree), understory (berry bush), herbaceous (comfrey, yarrow), ground cover (clover, creeping thyme), root (garlic, bulbs), vine (if appropriate).',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 1,
    title: 'Source guild plants',
    description: 'Order comfrey root cuttings, yarrow divisions, clover seed, herb starts, and bulbs. Source locally when possible for climate adaptation.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 2,
    title: 'Plant understory guild layers',
    description: 'Install guild plants around established fruit trees. Start with comfrey (nutrient accumulator) at the drip line, herbs closer in, ground covers throughout.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 2,
    title: 'Establish perennial herb and pollinator borders',
    description: 'Plant pollinator strips along rows or field edges: bee balm, echinacea, lavender, fennel, dill. These attract beneficial insects for pest management.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 3,
    title: 'Monitor guild establishment',
    description: 'Check survival rates of guild plantings. Replace failures. Note which species are thriving — these indicate good placement. Water new plantings through first summer.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 3,
    title: 'Build first hugelkultur or soil-building feature',
    description: 'Use logs, branches, and organic matter to build a hugelkultur bed in a low-productivity area. This slowly releases nutrients and retains water for years.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 4,
    title: 'Plant fall cover crops in remaining bare areas',
    description: 'Seed winter cover crops (rye, crimson clover, Austrian winter peas) in any remaining bare ground. Goal: no bare soil entering winter.',
    phase: 'Guild Planting & Understory',
  },
  {
    year: 3,
    quarter: 4,
    title: 'Assess guild health and adjust',
    description: 'Review first year of guild plantings. Which combinations work well? Any competition issues? Any unexpected pest or disease changes? Document findings.',
    phase: 'Guild Planting & Understory',
  },

  // ── Phase 4: Expansion & Refinement (Year 4) ─────────────────────────────

  {
    year: 4,
    quarter: 1,
    title: 'Expand guild plantings to remaining tree zones',
    description: 'Apply lessons from Phase 3 to plant guilds around the remaining fruit trees. Adjust species selection based on what worked in the first round.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 1,
    title: 'Add next layer of support species',
    description: 'Plant additional nitrogen fixers, insectary plants, and biomass producers in gaps. Focus on creating continuous ground cover throughout the orchard.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 2,
    title: 'Create wildlife habitat features',
    description: 'Install bird boxes for insectivorous species, build brush piles for beneficial predators, create a small pond or water feature for frogs and beneficial insects.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 2,
    title: 'Plant additional perennial food crops',
    description: 'Add perennial herbs (oregano, thyme, chives), asparagus, rhubarb, or other perennial vegetables in guild understories or borders.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 3,
    title: 'Evaluate water systems and expand',
    description: 'Assess swale and rain garden performance after 2+ years. Expand successful systems. Repair or redesign anything that isn\'t working.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 3,
    title: 'Integrate perennial vegetables if desired',
    description: 'Trial perennial kale, walking onions, sorrel, or other perennial edibles in protected guild areas. These add food diversity with minimal maintenance.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 4,
    title: 'Year-end assessment and design refinement',
    description: 'Comprehensive review: soil health improvement, water infiltration changes, pest/beneficial insect balance, yield impacts. Update the master design.',
    phase: 'Expansion & Refinement',
  },
  {
    year: 4,
    quarter: 4,
    title: 'Plan Year 5 integration priorities',
    description: 'Identify remaining gaps in the system. Prioritize final plantings and any infrastructure adjustments needed to complete the conversion.',
    phase: 'Expansion & Refinement',
  },

  // ── Phase 5: Maturation & Integration (Year 5) ───────────────────────────

  {
    year: 5,
    quarter: 1,
    title: 'Fine-tune guild compositions',
    description: 'Based on 2+ years of guild data, make final adjustments. Remove underperformers, add more of what\'s thriving. This is the polishing phase.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 1,
    title: 'Add final ground covers and living mulches',
    description: 'Fill any remaining bare spots with permanent living mulches: white clover, creeping thyme, or self-seeding annuals like calendula.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 2,
    title: 'Document what works — create your site guide',
    description: 'Write up your findings: which guilds work for each fruit species, water management results, pest management observations. This becomes your site-specific manual.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 2,
    title: 'Create a maintenance calendar for the established system',
    description: 'Build a simplified annual maintenance schedule now that the system is established. Many tasks shift from "install" to "maintain" — document the new rhythm.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 3,
    title: 'Celebrate establishment milestone',
    description: 'Major earthworks and primary plantings are complete. The system is transitioning from establishment to maturation. Take stock of how far the site has come.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 3,
    title: 'Transition to maintenance mode',
    description: 'Shift focus from "building the system" to "managing the system." Key ongoing tasks: chop-and-drop, compost applications, succession planting, and observation.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 4,
    title: 'Full system assessment',
    description: 'Compare current soil tests to baseline. Measure biodiversity changes. Evaluate yield trends. Quantify the transformation.',
    phase: 'Maturation & Integration',
  },
  {
    year: 5,
    quarter: 4,
    title: 'Long-term management plan',
    description: 'Create a 10-year vision: succession planting schedule, infrastructure lifecycle (swale maintenance, trellis replacement), and goals for continued system evolution.',
    phase: 'Maturation & Integration',
  },
]
