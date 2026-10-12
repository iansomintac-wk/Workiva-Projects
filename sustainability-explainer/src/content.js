/* All copy for the customer-facing Sustainability explainer. Edit here; the
   sections only handle layout and interaction. */

export const nav = [
  { href: '#what', label: '01 what', hover: 'var(--color-link-blue)' },
  { href: '#capabilities', label: '02 capabilities', hover: 'var(--color-purple-mountain)' },
  { href: '#use-cases', label: '03 use cases', hover: 'var(--color-mr-toad)' },
  { href: '#demo', label: '04 walkthrough', hover: 'var(--color-cheetah)' },
  { href: '#talk-tracks', label: '05 questions', hover: 'var(--color-storm-cloud)' },
  { href: '#roadmap', label: '06 roadmap', hover: 'var(--color-poseidon)' }
];

export const outcomes = [
  { num: '01', color: 'var(--color-link-blue)', text: 'Know what Workiva AI is, where it lives in the platform, and how your data is protected.' },
  { num: '02', color: 'var(--color-purple-mountain)', text: 'Pick the right capability for the job: chat, companion, selected data, file reference, or the ESRS / ISSB knowledge base.' },
  { num: '03', color: 'var(--color-mr-toad)', text: 'Get three Sustainability quick wins with prompts you can copy today.' },
  { num: '04', color: 'var(--color-cheetah)', text: 'Run a ten-minute walkthrough inside your own sustainability report.' },
  { num: '05', color: 'var(--color-five-alarm-chili)', text: 'Get straight answers to the six questions sustainability teams ask most.' }
];

export const places = [
  { icon: 'SparkleSizeMedium', title: 'Global chat',
    body: 'Available anywhere in the platform, including mobile. Ask questions, brainstorm, attach reference files (PDF, DOCX) for analysis, and iterate turn by turn.',
    best: 'Best for: questions, first drafts, working through a problem.' },
  { icon: 'FinanceReportSizeMedium', title: 'File companions',
    body: 'A panel inside Documents and Spreadsheets that reads the current file. Select a table or paragraph, then edit inline, generate content, or use pre-built quick edits.',
    best: 'Best for: tightening narrative, summarizing metric tables, checking consistency.' },
  { icon: 'GlobeSizeMedium', title: 'ESRS / ISSB Intelligence',
    body: 'A knowledge base grounded in the ESRS and ISSB standards. Ask what a requirement demands, who should own the evidence, and what to retain, with cited sources.',
    best: 'Best for: framework questions, requirement-to-workflow translation, evidence planning.' }
];

export const facts = [
  'Built into the Workiva platform; no customer data leaves the environment.',
  'Encrypted in transit and never used to train on proprietary data.',
  'An Org Admin enables it by signing the Workiva AI Terms of Use.',
  'Companions read only the file you have open; existing permissions still apply.'
];

export const layers = [
  { name: 'Global chat', think: 'a blank-ish canvas', best: 'Questions, brainstorming, first drafts, iterative follow-up. Available anywhere in the platform, including mobile.', dot: '#B2B2B2', avail: 'included' },
  { name: 'Prompt Advisor', think: 'a starting-point library', best: 'Ready-to-use prompts organized by industry and task. Search, fill in the brackets, customize. Kills the blank page for new users.', dot: '#7CBEFF', avail: 'included' },
  { name: 'Knowledge bases', think: 'domain-grounded Q&A', best: 'Switch from the general KB to ESRS / ISSB Intelligence for framework questions with cited sources, or Workiva Support Intelligence for product questions.', dot: '#8C4CBD', avail: 'included' },
  { name: 'File reference', think: '"use this as your evidence"', best: 'Attach reports, supplier documents, prior-year disclosures, or data files and ask questions against them.', dot: '#0074E8', avail: 'included' },
  { name: 'Document companion', think: 'an assistant inside the report', best: 'Reads the open sustainability report. Tighten narrative, draft sections, check consistency; preserves styles and formatting.', dot: '#66CC66', avail: 'included' },
  { name: 'Spreadsheet companion', think: 'object-level analysis', best: 'Select emissions tables or metric rows and ask it to summarize, explain variances, flag anomalies, or troubleshoot formulas.', dot: '#FBAD17', avail: 'included' },
  { name: 'Wdata companion', think: 'natural-language data assistant', best: 'Build, understand, change, and fix queries in plain English. No SQL needed. Ideal for facility-level or supplier-level analysis.', dot: '#F89119', avail: 'included' },
  { name: 'Sustainability Disclosure Agent', think: 'a specialized disclosure workflow', best: 'Drafts or evaluates a disclosure against selected ESRS or IFRS requirements; returns a gap scorecard, action items, and a proposed narrative. Advanced package.', dot: '#333333', avail: 'advanced / planned' }
];

export const promptStages = [
  { label: 'Weak', prompt: 'Analyze our emissions data.', verdictLabel: 'why it fails',
    verdict: 'No period, no scope, no definition of "analyze." The AI has to guess whether you want a sentence or a page, and which numbers matter.' },
  { label: 'Better', prompt: 'Analyze the selected emissions data and identify the largest year-over-year changes.', verdictLabel: 'what improved',
    verdict: 'Now it has a source (the selected data) and a job (find the biggest YoY changes). Still missing: scope, format, and a rule about invented causes.' },
  { label: 'Strong', prompt: 'You are a sustainability reporting analyst. Using only the selected FY2025 and FY2026 emissions data, identify the three largest year-over-year changes across Scope 1, Scope 2, and Scope 3. Quantify each in absolute and percentage terms. Return a table: metric, both values, change, likely data-quality vs operational explanation phrased as a hypothesis. Do not speculate beyond the data; list open questions for the data owner separately.', verdictLabel: 'why it works',
    verdict: 'Role, source, task, format, and a factuality rule. This mirrors Workiva’s own guidance: be clear and specific, provide context, ask one thing at a time.' }
];

export const practices = [
  { kind: 'be specific', text: 'State the task, topic, audience, and desired length or style.' },
  { kind: 'give context', text: 'Reference the file, select the cells, or explain the scenario. A role prefix helps.' },
  { kind: 'one question', text: 'Ask a single, focused question. Follow up rather than stacking asks.' },
  { kind: 'iterate', text: 'If the answer is off, adjust and try again. Use the response to guide the next prompt.' }
];

export const scopeLetters = ['S', 'C', 'O', 'P', 'E'];
export const scopeParts = {
  S: { word: 'Source', q: 'What should the AI work from?', color: 'var(--color-link-blue)', frag: 'Using only the selected FY2025 and FY2026 emissions data, ' },
  C: { word: 'Context', q: 'What does it need to know?', color: 'var(--color-purple-mountain)', frag: 'for the climate section of our CSRD report, ' },
  O: { word: 'Objective', q: 'What single job should it do?', color: 'var(--color-mr-toad)', frag: 'identify the three largest year-over-year changes across Scope 1, 2, and 3. ' },
  P: { word: 'Parameters', q: 'What makes the result useful?', color: 'var(--color-cheetah)', frag: 'Quantify each in absolute and percentage terms and return a table: metric, both values, change, hypothesis. ' },
  E: { word: 'Evaluate', q: 'How will we check it?', color: 'var(--color-five-alarm-chili)', frag: 'Do not speculate beyond the data; phrase explanations as hypotheses and list open questions for the data owner separately.' }
};
export const scopeHints = [
  'With nothing on, you’re back to “Analyze this” — the AI has to guess everything.',
  'One element helps, but the AI is still guessing at most of the job.',
  'Getting somewhere — but notice what the AI still has to invent.',
  'Solid. One or two more elements remove the last of the guesswork.',
  'Almost there — the Evaluate step is what keeps the human in the loop.',
  'All five: source, situation, one job, useful constraints, and a check. This is the 30-second version of prompt engineering.'
];

export const quickWins = [
  { title: 'tighten existing narrative', motion: 'Select text → quick edit or companion', effort: 'very low', where: 'companion', stage: 'first AI experience',
    prompt: 'Rewrite this for a senior executive audience. Reduce the length by about 30%. Preserve every number, date, target, reporting period, and factual claim. Do not introduce new facts.',
    why: 'The safest first win: the AI transforms content you already trust, and you can compare before and after in seconds. Use it first as an editor for text you’ve already approved.' },
  { title: 'explain year-over-year variance', motion: 'Select current + prior data → structured prompt', effort: 'low', where: 'spreadsheet companion', stage: 'first AI experience',
    prompt: 'Compare the two periods and identify variances greater than 15%. Rank them by magnitude. Separate observed changes from possible explanations and give me three follow-up questions for the data owner.',
    why: 'The value isn’t the prose, it’s telling your reviewer where to look. One of the most common ways sustainability teams use Workiva AI.' },
  { title: 'catch anomalies before assurance', motion: 'Factbook or table → threshold-based analysis', effort: 'low', where: 'spreadsheet companion', stage: 'review stage',
    prompt: 'Compare the selected FY2026 data with FY2025. Identify missing values, unusual values, duplicate-looking entries, and variances greater than ±20%. Return a table: metric, periods, values, issue type, suggested check.',
    why: 'Instead of scanning every value by hand before assurance, let the AI tell you where to look first. Follow up by asking for data-quality vs operational hypotheses.' },
  { title: 'check report consistency', motion: 'Reference the report → cross-reference review', effort: 'low–med', where: 'document companion', stage: 'review stage',
    prompt: 'Review this report for internal consistency. Identify any number that conflicts with another table, chart, or narrative statement. For each, identify both locations and explain the conflict. Do not decide which value is correct.',
    why: 'Reframes AI from writer to reviewer. Run it again for qualitative claims (targets, commitments, boundaries) once the numbers pass.' },
  { title: 'turn a requirement into a workflow', motion: 'ESRS / ISSB Intelligence knowledge base', effort: 'low', where: 'chat + knowledge base', stage: 'standards work',
    prompt: 'Using the framework knowledge base, explain [requirement] for the person collecting the evidence: what must be disclosed, quantitative data needed, qualitative information needed, likely internal owner, evidence to retain, open questions. Cite the sources.',
    why: 'Far more actionable than "summarize ESRS E1." It converts regulation into a to-do list, and the Sources section keeps it verifiable.' },
  { title: 'prepare assurance questions', motion: 'Disclosure → reviewer-role prompt', effort: 'low', where: 'document companion', stage: 'pre-assurance',
    prompt: 'Act as a sustainability assurance reviewer. Based only on the selected disclosure, give me ten questions covering data quality, methodology, controls, assumptions, evidence, ownership, and consistency. Rank by priority.',
    why: 'Find the review questions before your reviewer does. Straight from Workiva’s Sustainability prompt guidance.' }
];

export const stageColors = {
  'first AI experience': ['var(--color-morning-dew)', 'var(--color-forest)'],
  'review stage': ['var(--color-foggy)', 'var(--color-poseidon)'],
  'standards work': ['var(--color-lavendery)', 'var(--color-california-raisins)'],
  'pre-assurance': ['var(--color-cool-ranch)', 'var(--color-steel)']
};

export const cycle = [
  { stage: 'Scope', q: 'Which requirements apply, and who owns the evidence?' },
  { stage: 'Collect', q: 'Where are values missing or unusual?' },
  { stage: 'Analyze', q: 'What changed year over year, and why?' },
  { stage: 'Draft', q: 'Turn this table into narrative.' },
  { stage: 'Review', q: 'Where does the report contradict itself?' },
  { stage: 'Assure', q: 'What will the reviewer ask?' }
];

export const demoSteps = [
  { title: 'Open the sustainability report', sub: 'Document · Climate section', screen: 'FY2026 Sustainability Report — Document',
    action: 'Open your working draft and scroll to the GHG emissions table. Open the Workiva AI companion panel.',
    say: 'Everything happens inside the document you already work in. Nothing gets exported or pasted anywhere.',
    prompt: '— companion open, reading the current document —',
    watch: 'the panel already knows what document it’s in; you don’t need to describe it.' },
  { title: 'Select the emissions table', sub: 'Selection = source context', screen: 'FY2026 Sustainability Report — Document',
    action: 'Click-drag to select the Scope 1, 2, and 3 rows for both periods.',
    say: 'Selecting is how you tell the AI what to read. The closer it is to the source, the less you have to explain.',
    prompt: '— selection: 6 rows × 3 columns —',
    watch: 'you don’t need to retype the numbers. Selection is the context.' },
  { title: 'Ask for the variance analysis', sub: 'The first prompt', screen: 'Workiva AI companion',
    action: 'Type the prompt and run it. Then compare two numbers against the table.',
    say: 'Notice the numbers match the table exactly. It’s a review aid, not the disclosure.',
    prompt: '"Compare the two periods and identify variances greater than 15%. Rank by magnitude. Separate observed changes from possible explanations and give me three follow-up questions for the data owner."',
    watch: 'read it critically. Check two numbers against the table before you trust the rest.' },
  { title: 'Refine once', sub: 'Iteration is conversation', screen: 'Workiva AI companion',
    action: 'Ask a follow-up in the same thread instead of rewriting the prompt.',
    say: 'If the first answer isn’t right, you don’t start over. You tell it what to change.',
    prompt: '"Good. Now separate data-quality explanations from operational ones, and phrase each as a hypothesis to test."',
    watch: 'follow-ups keep the context of the thread, so short instructions work.' },
  { title: 'Tighten a narrative paragraph', sub: 'AI as editor', screen: 'FY2026 Sustainability Report — Document',
    action: 'Highlight the climate transition paragraph. Use the quick edit to rewrite for an executive audience, preserving every number and target.',
    say: 'Same panel, different job. Now it’s an editor, not an analyst.',
    prompt: '"Rewrite this for a senior executive audience, about 30% shorter. Preserve every number, date, target, and factual claim. Do not introduce new facts."',
    watch: 'editing text you wrote is usually the easiest place to trust the output first.' },
  { title: 'Ask the framework a question', sub: 'Then save the prompt', screen: 'Workiva AI — ESRS / ISSB Intelligence',
    action: 'Switch the knowledge base to ESRS / ISSB Intelligence, ask one requirement question, then type the second one yourself.',
    say: 'You’ll need this again next cycle. Save the prompt.',
    prompt: '"Explain ESRS E1-6 for the person collecting the evidence: what must be disclosed, data needed, likely owner, evidence to retain. Cite sources."',
    watch: 'type this one yourself, then change one thing about it and run it again.' }
];

export const questions = [
  { say: 'Where does our data go?', answer: 'It stays inside the Workiva platform. Data is encrypted in transit and isn’t used to train models. Your Org Admin enables Workiva AI by accepting the AI Terms of Use, and your existing permissions still apply.' },
  { say: 'Will it hallucinate a disclosure?', answer: 'Ground it in the actual file or selected data, inspect sources for framework questions, and treat the output as a draft or review aid rather than final authority. Start with tasks where verification is easy.' },
  { say: 'Won’t checking it take as long as doing it?', answer: 'Start with review tasks: variance flags, anomaly checks, consistency review. Verification is where the value is.' },
  { say: 'Do we need to learn prompt engineering?', answer: 'No. Say what to read, what to do, and what a good answer looks like. Or start from the Prompt Advisor and change the brackets.' },
  { say: 'We already have Copilot or ChatGPT. Why this?', answer: 'Keep using them for general work. The difference here is that Workiva AI can read your report, your emissions data, and the ESRS / ISSB knowledge base, and the output lands back in the document, inside your controls.' },
  { say: 'Can we rely on its regulatory answer?', answer: 'Use it to accelerate research and interpretation, then verify the cited requirement and the current version of the standard before relying on it. The Sources section exists for exactly that.' }
];

export const compare = [
  { axis: 'What the AI can see', them: 'Only what you paste in.', us: 'The open report or spreadsheet, referenced files, and the ESRS / ISSB knowledge base.' },
  { axis: 'Where the output lands', them: 'In a chat window; you copy it back.', us: 'Inline in the report, with styles and links preserved.' },
  { axis: 'Governance', them: 'Depends on the vendor plan and who pasted what.', us: 'Inside Workiva permissions; data not used for training; admin-enabled.' },
  { axis: 'Domain grounding', them: 'General web knowledge.', us: 'ESRS / ISSB Intelligence with cited sources, plus your connected data.' },
  { axis: 'Repeatability', them: 'Re-paste next cycle.', us: 'Saved prompts and quick edits inside the same workflow, every reporting cycle.' }
];

export const roadmap = [
  { label: 'core ai · included', title: 'Workiva AI', bg: 'var(--color-zesty-neue)', ink: 'var(--color-steel)', items: [
    { name: 'Global chat + file attachments', desc: 'Anywhere in the platform, including mobile. Attach reports, supplier documents, or data files.' },
    { name: 'Document & Spreadsheet companions', desc: 'Read the open file; inline edits, quick edits, table analysis, formula troubleshooting.' },
    { name: 'Prompt Advisor + knowledge bases', desc: 'Sample prompts to adapt; ESRS / ISSB Intelligence for framework questions with sources.' },
    { name: 'Wdata companion', desc: 'Build and fix queries in natural language. No SQL required.' }
  ] },
  { label: 'premium ai tiers', title: 'Agents', bg: 'var(--color-presentation)', ink: 'var(--color-steel)', items: [
    { name: 'Sustainability Disclosure Agent', desc: 'Evaluates or drafts a disclosure against selected ESRS or IFRS requirements. Ask your account team whether it’s in your package.' }
  ] },
  { label: 'planned', title: 'Coming', bg: 'var(--color-steel)', ink: 'var(--color-paper)', items: [
    { name: 'Guided AI workflows', desc: 'AI operating inside specific sustainability jobs rather than as a generic chat. Direction of travel; timing not yet announced.' }
  ] }
];

export const fourStages = [
  { num: '01', numColor: 'var(--color-forest)', tag: 'live', tagBg: 'var(--color-morning-dew)', tagInk: 'var(--color-forest)', title: 'Fit-for-purpose agents',
    body: 'AI acting inside workflows you already run: flagging anomalies, drafting disclosures against ESRS, checking consistency. Early adopters are cutting time on these tasks in half.' },
  { num: '02', numColor: 'var(--color-cheetah)', tag: 'announced', tagBg: 'var(--color-plastic-cheese)', tagInk: 'var(--color-steel)', title: 'Agent Studio',
    body: 'Build your own agents in plain language, no code. Workiva’s own sustainability team built three working agents in one day, including one that replaced months of vendor back-and-forth.' },
  { num: '03', numColor: 'var(--color-purple-mountain)', tag: 'next', tagBg: 'var(--color-lavendery)', tagInk: 'var(--color-california-raisins)', title: 'Agent orchestration',
    body: 'Multiple agents running an end-to-end process together, like a full CSRD report, with people stepping in only at the decision points that matter.' },
  { num: '04', numColor: 'var(--color-steel)', tag: 'vision', tagBg: 'var(--color-silver-diva)', tagInk: 'var(--color-steel)', title: 'Agentic applications',
    body: 'The platform anticipates obligations before anyone asks, flagging a new disclosure obligation the moment a subsidiary crosses a reporting threshold. Reporting platform becomes the platform for regulatory work.' }
];

export const startSteps = [
  { title: 'Enable it', body: 'Your Org Admin accepts the Workiva AI Terms of Use in admin settings. Chat and the companions switch on for permitted users.' },
  { title: 'Pick one task', body: 'A metric table you summarize every cycle, a variance review before assurance, a requirement you keep re-reading. Pick the one that takes longest.' },
  { title: 'Run the walkthrough', body: 'Chapter four, in your own file. Compare the output against the source before you trust the rest of it.' },
  { title: 'Save what works', body: 'Keep the prompts that gave you a good answer and reuse them next cycle. The library below is a starting point.' }
];

export const library = [
  { kind: 'variance', text: 'Compare the two periods and identify variances greater than 15%. Rank by magnitude. Separate observed changes from possible explanations and give me three follow-up questions for the data owner.' },
  { kind: 'anomalies', text: 'Compare the selected FY2026 data with FY2025. Identify missing, unusual, or duplicate-looking values and variances over ±20%. Return a table: metric, periods, values, issue type, suggested check.' },
  { kind: 'consistency', text: 'Review this report for internal consistency. Identify any number that conflicts with another table, chart, or narrative statement. Show both locations. Do not decide which is correct.' },
  { kind: 'framework', text: 'Using the framework knowledge base, explain [requirement] for the person collecting the evidence: what must be disclosed, data needed, likely owner, evidence to retain, open questions. Cite sources.' },
  { kind: 'assurance', text: 'Act as a sustainability assurance reviewer. Based only on the selected disclosure, give me ten questions covering data quality, methodology, controls, assumptions, evidence, ownership, and consistency. Rank by priority.' },
  { kind: 'executive summary', text: 'Using only the selected data, write a concise executive summary of year-over-year sustainability performance. Highlight progress against stated goals and areas needing attention. Preserve exact values. Max 150 words.' }
];

export const donts = [
  { no: 'don’t start with the ai.', yes: 'start with a task in your reporting cycle.' },
  { no: 'don’t make it guess.', yes: 'select the table, reference the file.' },
  { no: 'don’t chase the perfect prompt.', yes: 'be specific, then iterate.' },
  { no: 'don’t treat the output as final.', yes: 'a person still signs the report.' },
  { no: 'don’t wait for the roadmap.', yes: 'start with what’s enabled today.' }
];
