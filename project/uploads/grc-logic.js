class Component extends DCLogic {
  state = { progress: 0, sel: 4, stage: 0, i: 0, step: 0, open: -1, answers: {}, copied: -1 };
  componentDidMount() {
    this._onScroll = () => {
      const d = document.documentElement, max = d.scrollHeight - d.clientHeight;
      this.setState({ progress: max > 0 ? Math.min(100, (d.scrollTop / max) * 100) : 0 });
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
  }
  componentWillUnmount() { window.removeEventListener('scroll', this._onScroll); }
  renderVals() {
    const S = this.state;
    const layerData = [
      { name: 'Global chat', think: 'a blank-ish canvas', best: 'General GRC questions, brainstorming, first drafts, iterative follow-up. Load your regulatory framework and ask "what regulations impact our [industry] controls?"', dot: '#B2B2B2', avail: 'included' },
      { name: 'Prompt Library', think: 'a starting-point library', best: 'Sample prompts to adapt for controls, risks, and remediation. Kills the blank page for auditors new to AI.', dot: '#7CBEFF', avail: 'included' },
      { name: 'Knowledge bases', think: 'domain-grounded Q&A', best: 'Switch from the general KB to Workiva Support Intelligence for product and standards questions pulled from trusted documentation.', dot: '#8C4CBD', avail: 'included' },
      { name: 'File reference', think: '"use this as your evidence"', best: 'Attach PDFs or DOCX (policies, prior audit reports, control failure write-ups) and ask questions against them, including "does file X contain evidence for control Y?"', dot: '#0074E8', avail: 'included' },
      { name: 'Document companion', think: 'an assistant inside the narrative', best: 'Reads the open process narrative or control description. Rewrite in compliance-friendly language, list audit steps, draft remediation strategies.', dot: '#66CC66', avail: 'included' },
      { name: 'Spreadsheet companion', think: 'object-level analysis', best: 'Select the risk and control matrix and ask it to flag duplicates, overlaps, or missing mappings, then suggest consolidation.', dot: '#FBAD17', avail: 'included' },
      { name: 'Flowchart visualizer', think: 'narrative \u2192 diagram', best: 'AI-powered: turns a textual process narrative into a process flow diagram in the GRC solution, with interactive linking of risks to steps.', dot: '#F89119', avail: 'included' },
      { name: 'Evidence Analyzer', think: 'automated evidence review', best: 'Planned: scans attached audit evidence and confirms whether the requested information is present. Today, ask the AI the same question after referencing the file.', dot: '#333333', avail: 'planned' }
    ];
    const sel = S.sel, L = layerData[sel];
    const stageData = [
      { label: 'Weak', prompt: 'Write remediation steps.', verdictLabel: 'why it fails', verdict: 'For which failure? From what evidence? For whom? The AI has to guess the control, the root cause, and how detailed to be.' },
      { label: 'Better', prompt: 'Write remediation steps for the accounts payable control failure described in the attached document.', verdictLabel: 'what improved', verdict: 'Now it has a source (the attached document) and a specific control. Still missing: role, output structure, and a rule about what it can assume.' },
      { label: 'Strong', prompt: 'You are a GRC analyst. Using only the evidence in [Control Failure Document], write a detailed remediation strategy for the accounts payable control failure outlined. Structure it as root cause, immediate fix, preventive control, owner, and evidence to retain. Formal tone, under 250 words. Where the evidence is silent, list the open question instead of assuming.', verdictLabel: 'why it works', verdict: 'Role, source, task, structure, tone, length, and a rule for missing information. This is the example shape Workiva\u2019s own documentation recommends.' }
    ];
    const st = stageData[S.stage];
    const wins = [
      { title: 'rewrite a control description', motion: 'Select the control text \u2192 companion quick edit', effort: 'very low', where: 'companion', stage: 'first AI experience',
        prompt: 'Rewrite the selected control description in clear, compliance-friendly language. Keep the control owner, frequency, and system names exactly as written. Then list the audit steps you would perform to test it.',
        why: 'The safest first win: the AI edits something the customer already owns, and they can compare before and after in seconds. Say: "let\u2019s first use it as an editor for a control you\u2019ve already approved."' },
      { title: 'find duplicate or overlapping controls', motion: 'Load the risk and control matrix \u2192 ask', effort: 'low', where: 'spreadsheet + chat', stage: 'first AI experience',
        prompt: 'Review my control matrix for duplicate or overlapping controls. For each pair, explain the overlap and suggest consolidation steps. Do not remove any control that is the only one covering a risk.',
        why: 'In an internal demo the AI flagged duplicates and proposed consolidation from the matrix alone. It uses data the customer already has in Workiva.' },
      { title: 'check framework coverage', motion: 'Reference controls + framework \u2192 gap analysis', effort: 'low', where: 'chat + file reference', stage: 'early repeatable',
        prompt: 'Compare the referenced control set against [framework]. List requirements with no mapped control, requirements covered by more than three controls, and any control mapped to no requirement.',
        why: 'The "did we cover everything?" question every audit team asks. The output is a review list, not a decision, which is exactly the level of trust to build first.' },
      { title: 'draft a remediation strategy', motion: 'Attach the failure write-up \u2192 role prompt', effort: 'low', where: 'chat + file reference', stage: 'early repeatable',
        prompt: 'You are a GRC analyst. Using the evidence in the attached control failure document, write a remediation strategy: root cause, immediate fix, preventive control, owner, evidence to retain. Flag anything the evidence doesn\u2019t support.',
        why: 'Straight from Workiva\u2019s prompting guidance. Structured output makes it fast to verify, and the "flag what\u2019s unsupported" rule keeps the auditor in charge.' },
      { title: 'generate a process flowchart', motion: 'Paste the narrative \u2192 flowchart visualizer', effort: 'low', where: 'grc solution', stage: 'documentation',
        prompt: 'Generate a process flow for the accounts payable workflow described below. Show the approval steps and where the three-way match occurs, so I can link the related controls.',
        why: 'The visual "oh" moment. Audit teams document processes in prose and then redraw them by hand; the visualizer turns the narrative into a diagram and lets them link risks to steps.' },
      { title: 'draft or validate a risk factor', motion: 'Reference the annual report \u2192 draft', effort: 'low', where: 'document companion', stage: 'disclosure',
        prompt: 'Draft a material risk factor based on the referenced annual report text, focused on market volatility. Match the tone of the existing risk factors and flag any claim that needs a source.',
        why: 'Bridges GRC and reporting teams. The AI drafts from the customer\u2019s own text, so validation is a read-through rather than research.' }
    ];
    const n = wins.length, i = S.i, w = wins[i];
    const stageColors = {
      'first AI experience': ['var(--color-morning-dew)', 'var(--color-forest)'],
      'early repeatable': ['var(--color-tertiary-sky)', 'var(--color-poseidon)'],
      'documentation': ['var(--color-lavendery)', 'var(--color-california-raisins)'],
      'disclosure': ['var(--color-cool-ranch)', 'var(--color-steel)']
    };
    const sc = stageColors[w.stage] || ['var(--color-silver-diva)', 'var(--color-steel)'];
    const demoData = [
      { title: 'Open the control matrix', sub: 'Spreadsheet \u00b7 SOX RCM', screen: 'FY2026 Risk & Control Matrix \u2014 Spreadsheet', action: 'Open the customer\u2019s risk and control matrix (or the demo RCM) and open the Workiva AI companion panel.', say: 'Everything we\u2019re about to do happens inside the matrix you already maintain. Nothing gets exported or pasted anywhere.', prompt: '\u2014 companion open, reading the current spreadsheet \u2014', watch: 'the "aha" that the panel already knows which file it\u2019s in.' },
      { title: 'Select the AP controls', sub: 'Selection = source context', screen: 'FY2026 Risk & Control Matrix \u2014 Spreadsheet', action: 'Filter to the accounts payable process and select the control rows, including owner, frequency, and mapped risks.', say: 'Selecting is how we tell the AI what to read. The closer it is to the source, the less we have to explain.', prompt: '\u2014 selection: 14 controls \u00d7 8 columns \u2014', watch: 'people assume they have to retype the controls. They don\u2019t.' },
      { title: 'Ask for overlaps', sub: 'The first prompt', screen: 'Workiva AI companion', action: 'Type the prompt and run it. Read the response aloud, then open two of the flagged controls side by side.', say: 'Notice it cites the control IDs from your matrix. It\u2019s a review list, not a decision.', prompt: '"Review the selected controls for duplicates or overlaps. For each pair, cite the control IDs, explain the overlap, and suggest a consolidation step. Don\u2019t drop any control that is the sole coverage for a risk."', watch: 'whether the customer starts checking the pairs critically. That\u2019s the behavior you want.' },
      { title: 'Refine once', sub: 'Iteration is conversation', screen: 'Workiva AI companion', action: 'Ask a follow-up in the same thread instead of rewriting the prompt.', say: 'If the first answer isn\u2019t right, you don\u2019t start over. You tell it what to change.', prompt: '"Good. Now only show pairs where both controls are key controls, and add which framework requirement each maps to."', watch: 'the shift from "AI isn\u2019t good at this" to "oh, I can just tell it."' },
      { title: 'Rewrite one control description', sub: 'AI as editor', screen: 'Control C-AP-07 \u2014 Document', action: 'Open a control with clunky wording. Select the description and ask for compliance-friendly language plus test steps.', say: 'Same panel, different job. Now it\u2019s an editor and a test planner, not an analyst.', prompt: '"Rewrite this control description in clear, compliance-friendly language. Keep owner, frequency, and system names exact. Then list the audit steps to test it."', watch: 'auditors relax when the AI improves text they wrote rather than inventing new controls.' },
      { title: 'Generate the process flowchart', sub: 'Then save the prompt', screen: 'GRC \u2014 Flowchart visualizer', action: 'Paste the AP process narrative into the flowchart visualizer. Link one flagged control to a step. Then have the customer type the next prompt.', say: 'Will you need this again next cycle? Let\u2019s keep the prompt.', prompt: '"Generate a process flow for the accounts payable workflow below. Show approvals and where the three-way match occurs so I can link controls."', watch: 'the moment they type. Give them the first sentence; ask "what would you change?"' }
    ];
    const D = demoData[S.step];
    const objections = [
      { say: 'Audit evidence can\u2019t leave the building.', answer: '"It doesn\u2019t. Workiva AI runs inside the Workiva platform, data is encrypted in transit, and it isn\u2019t used to train models. Your Org Admin enables it by accepting the AI Terms of Use, and your existing permissions still apply."' },
      { say: 'An auditor can\u2019t rely on AI conclusions.', answer: '"Agreed, and it doesn\u2019t ask you to. Use it to produce review lists, drafts, and diagrams from your own controls and evidence. The auditor still tests, concludes, and signs."' },
      { say: 'Checking it takes as long as doing it.', answer: '"Then start with review tasks: overlap detection in the matrix, framework coverage gaps, whether an evidence file answers the request. Verification is the value, not the cost."' },
      { say: 'I\u2019m not good at prompting.', answer: '"You don\u2019t need special language. Say what to read, what to do, and what a good answer looks like. Or start from the Prompt Library and change the brackets."' },
      { say: 'We already have Copilot / ChatGPT.', answer: '"Great for general work. The difference here is that the AI can read your control matrix, narratives, and evidence files where they live, and the output lands back in the GRC solution, inside your controls."' },
      { say: 'Can it review our evidence automatically?', answer: '"The Evidence Analyzer is planned, not shipped. Today you can reference an evidence file and ask whether it contains what control Y requires. Let\u2019s not demo what we can\u2019t turn on."' }
    ];
    const quizData = [
      { text: 'A customer asks, "Where does my data go when I use Workiva AI?" Best answer:', options: ['It\u2019s sent to a third-party model and deleted after 30 days.', 'It stays within the Workiva platform, encrypted in transit, and isn\u2019t used to train models.', 'Nothing is stored or processed anywhere.'], correct: 1, explain: 'Match Workiva\u2019s own language: integrated, encrypted in transit, not trained on customer data. Avoid "nothing is processed," which overstates it.' },
      { text: 'The fastest way to improve a mediocre answer to "write remediation steps" is to:', options: ['Rewrite the prompt several times with more adjectives.', 'Give it a role, reference the control failure document, and specify the structure.', 'Switch to a different knowledge base.'], correct: 1, explain: 'Source context first: reference the evidence, then be specific about role, task, and format. Knowledge bases help with product and standards questions.' },
      { text: 'Which capability turns a written process narrative into a diagram?', options: ['Spreadsheet companion', 'Flowchart visualizer', 'Prompt Library'], correct: 1, explain: 'The GRC solution\u2019s AI-powered flowchart visualizer generates a process flow from narrative text and lets you link risks to steps.' },
      { text: 'A customer wants AI to confirm automatically that every evidence file contains what was requested. You should say:', options: ['That\u2019s the Evidence Analyzer; it\u2019s planned. Today, reference the file and ask whether it contains evidence for a specific control.', 'That\u2019s fully available in every subscription right now.', 'AI can\u2019t help with evidence.'], correct: 0, explain: 'Be precise about availability. The Evidence Analyzer was demoed as coming soon; targeted questions against referenced files work today.' },
      { text: 'The best first demo for a skeptical internal auditor is:', options: ['Generate a complete audit program from scratch.', 'Find overlapping controls in a matrix they already own and check two pairs live.', 'Show a long list of every AI feature.'], correct: 1, explain: 'Start where the truth is visible next to the output. Small, verifiable, in their own matrix.' }
    ];
    const answered = Object.keys(S.answers).length;
    const correct = quizData.filter((q, k) => S.answers[k] === q.correct).length;
    const verdicts = ['Answer the five questions to see how ready you are.', 'Reread chapter one before the next customer call.', 'Solid on the basics; rehearse the demo script once more.', 'You could run the ten-minute demo tomorrow.'];
    const verdict = answered < quizData.length ? verdicts[0] : correct <= 2 ? verdicts[1] : correct <= 4 ? verdicts[2] : verdicts[3];
    const libraryData = [
      { kind: 'controls', text: 'Review my control matrix for duplicate or overlapping controls and suggest consolidation steps. Cite control IDs.' },
      { kind: 'coverage', text: 'Compare the referenced control set against [framework]. List unmapped requirements, over-covered requirements, and orphan controls.' },
      { kind: 'remediation', text: 'You are a GRC analyst. Using the evidence in [Control Failure Document], write a detailed remediation strategy for the accounts payable control failure outlined.' },
      { kind: 'evidence', text: 'Does the referenced file contain evidence for control [Y]? Quote the relevant passage or state clearly what is missing.' },
      { kind: 'risk', text: 'As a risk manager, summarize the top 5 emerging risks from our [Control Registry] document, with the controls that address each.' },
      { kind: 'regulatory', text: 'Using the loaded regulatory framework, what regulations impact our [industry] controls? Group by process and cite the source.' }
    ];
    const copy = (k, text) => { try { navigator.clipboard.writeText(text); } catch (e) { /* ignore */ } this.setState({ copied: k }); clearTimeout(this._ct); this._ct = setTimeout(() => this.setState({ copied: -1 }), 1400); };
    return {
      progressW: S.progress.toFixed(1) + '%',
      n16: 16, n20: 20, n24: 24, n40: 40,
      outcomes: [
        { num: '01', color: 'var(--color-link-blue)', text: 'Explain what Workiva AI is, where it lives in the platform, and how its governance works, in two sentences.' },
        { num: '02', color: 'var(--color-purple-mountain)', text: 'Pick the right capability for the job: chat, companion, selected matrix, file reference, or flowchart visualizer.' },
        { num: '03', color: 'var(--color-mr-toad)', text: 'Demonstrate three GRC quick wins with prompts you\u2019ve rehearsed.' },
        { num: '04', color: 'var(--color-cheetah)', text: 'Run a ten-minute demo inside a customer\u2019s own control matrix.' },
        { num: '05', color: 'var(--color-five-alarm-chili)', text: 'Handle the six common objections and position against general chatbots without overpromising.' }
      ],
      facts: [
        'Built into the Workiva platform; no customer data leaves the environment.',
        'Encrypted in transit and never used to train on proprietary data.',
        'An Org Admin enables it by signing the Workiva AI Terms of Use.',
        'Companions read only the file you have open; existing permissions still apply.'
      ],
      selLayer: String(sel),
      onLayerSelect: (e) => this.setState({ sel: e.detail.index }),
      layers: layerData.map((d, k) => ({
        name: d.name, think: d.think, dot: d.dot,
        bg: k === sel ? 'var(--color-paper)' : 'transparent',
        border: k === sel ? 'var(--color-purple-mountain)' : 'var(--color-ethereal)',
        select: () => this.setState({ sel: k })
      })),
      selName: L.name, selThink: L.think, selBest: L.best, selDot: L.dot, selNum: String(sel + 1).padStart(2, '0'),
      selAvail: L.avail,
      selAvailBg: L.avail === 'included' ? 'var(--color-morning-dew)' : 'var(--color-plastic-cheese)',
      selAvailInk: L.avail === 'included' ? 'var(--color-forest)' : 'var(--color-steel)',
      stages: stageData.map((sd, k) => ({
        label: sd.label, select: () => this.setState({ stage: k }),
        bg: k === S.stage ? 'var(--color-purple-mountain)' : 'transparent',
        ink: k === S.stage ? 'var(--color-paper)' : 'var(--color-steel)',
        border: k === S.stage ? 'var(--color-purple-mountain)' : 'var(--color-stainless)'
      })),
      stagePrompt: '\u201c' + st.prompt + '\u201d', stageVerdictLabel: st.verdictLabel, stageVerdict: st.verdict,
      practices: [
        { kind: 'be specific', text: 'State the task, topic, audience, and desired length or style.' },
        { kind: 'give context', text: 'Reference the file, select the cells, or explain the scenario. A role prefix helps.' },
        { kind: 'one question', text: 'Ask a single, focused question. Follow up rather than stacking asks.' },
        { kind: 'iterate', text: 'If the answer is off, adjust and try again. Use the response to guide the next prompt.' }
      ],
      card: { title: w.title, motion: w.motion, effort: w.effort, where: w.where, stage: w.stage, stageBg: sc[0], stageInk: sc[1], prompt: '\u201c' + w.prompt + '\u201d', why: w.why },
      cardCounter: String(i + 1).padStart(2, '0') + ' / ' + n,
      prevCard: () => this.setState((s) => ({ i: (s.i - 1 + n) % n })),
      nextCard: () => this.setState((s) => ({ i: (s.i + 1) % n })),
      dots: wins.map((_, k) => ({ go: () => this.setState({ i: k }), bg: k === i ? 'var(--color-mr-toad)' : 'var(--color-stainless)', w: k === i ? '30px' : '10px' })),
      cycle: [
        { stage: 'Scope', q: 'Which regulations touch these controls?' },
        { stage: 'Map', q: 'Where are controls duplicated or missing?' },
        { stage: 'Document', q: 'Turn this narrative into a flowchart.' },
        { stage: 'Test', q: 'List the audit steps for this control.' },
        { stage: 'Evidence', q: 'Does this file answer the request?' },
        { stage: 'Remediate', q: 'Draft the fix from the failure write-up.' }
      ],
      demoSteps: demoData.map((d, k) => ({
        num: String(k + 1).padStart(2, '0'), title: d.title, sub: d.sub, select: () => this.setState({ step: k }),
        bg: k === S.step ? 'var(--color-paper)' : 'transparent',
        border: k === S.step ? 'var(--color-cheetah)' : 'var(--color-ethereal)',
        numBg: k === S.step ? 'var(--color-cheetah)' : 'var(--color-silver-diva)',
        numInk: k === S.step ? 'var(--color-paper)' : 'var(--color-steel)'
      })),
      demo: D,
      objections: objections.map((o, k) => ({
        say: o.say, answer: o.answer, open: S.open === k, cta: S.open === k ? 'close' : 'the response',
        bg: S.open === k ? 'var(--color-paper)' : 'transparent',
        border: S.open === k ? 'var(--color-cheetah)' : 'var(--color-ethereal)',
        toggle: () => this.setState((s) => ({ open: s.open === k ? -1 : k }))
      })),
      compare: [
        { axis: 'What the AI can see', them: 'Only what you paste in.', us: 'The open matrix or narrative, referenced evidence files, and your loaded frameworks.' },
        { axis: 'Where the output lands', them: 'In a chat window; you copy it back.', us: 'Inline in the control, narrative, or flowchart, linked to risks.' },
        { axis: 'Governance', them: 'Depends on the vendor plan and who pasted what.', us: 'Inside Workiva permissions; data not used for training; admin-enabled.' },
        { axis: 'Domain grounding', them: 'General web knowledge.', us: 'Knowledge bases such as Workiva Support Intelligence, plus your own frameworks and registries.' },
        { axis: 'Repeatability', them: 'Re-paste next cycle.', us: 'Saved prompts and quick edits inside the same workflow, every audit cycle.' }
      ],
      roadmap: [
        { label: 'available now', title: 'Core Workiva AI', bg: 'var(--color-zesty-neue)', ink: 'var(--color-steel)', items: [
          { name: 'Global chat + file attachments', desc: 'Anywhere in the platform, including mobile. Attach policies, reports, and evidence as PDF or DOCX.' },
          { name: 'Document & Spreadsheet companions', desc: 'Read the open file; rewrite controls, list test steps, analyze the risk and control matrix.' },
          { name: 'Prompt Library + knowledge bases', desc: 'Sample prompts to adapt; switch KBs for trusted product and standards answers.' },
          { name: 'Flowchart visualizer', desc: 'Generate process flows from narrative text in the GRC solution; link risks to steps.' }
        ] },
        { label: 'advanced packages', title: 'Agents', bg: 'var(--color-presentation)', ink: 'var(--color-steel)', items: [
          { name: 'Specialized agents', desc: 'Multi-step AI jobs are packaged separately across Workiva solutions. Confirm what the customer\u2019s subscription includes before demoing any agent.' }
        ] },
        { label: 'planned', title: 'Coming', bg: 'var(--color-steel)', ink: 'var(--color-paper)', items: [
          { name: 'Evidence Analyzer', desc: 'Scans attached audit evidence and confirms whether the requested information is present. Demoed as coming soon; don\u2019t date it.' },
          { name: 'Guided workflows', desc: 'AI operating inside specific audit and risk jobs rather than as a generic chat. Direction of travel.' }
        ] }
      ],
      quiz: quizData.map((q, k) => {
        const a = S.answers[k], done = a !== undefined;
        return {
          num: String(k + 1), text: q.text, answered: done, explain: q.explain,
          resultLabel: done ? (a === q.correct ? 'Correct.' : 'Not quite.') : '',
          resultColor: a === q.correct ? 'var(--color-mr-toad)' : 'var(--color-five-alarm-chili)',
          options: q.options.map((t, j) => ({
            text: t, pick: () => { if (!done) this.setState((s) => ({ answers: { ...s.answers, [k]: j } })); },
            bg: done && j === q.correct ? 'var(--color-morning-dew)' : done && j === a ? 'var(--color-tertiary-salmon)' : 'transparent',
            border: done && j === q.correct ? 'var(--color-mr-toad)' : done && j === a ? 'var(--color-five-alarm-chili)' : 'var(--color-ethereal)'
          }))
        };
      }),
      quizScore: answered + ' / ' + quizData.length + ' answered \u00b7 ' + correct + ' correct',
      quizVerdict: verdict,
      resetQuiz: () => this.setState({ answers: {} }),
      library: libraryData.map((p, k) => ({ kind: p.kind, text: p.text, copied: S.copied === k ? 'copied' : 'copy', copy: () => copy(k, p.text) })),
      donts: [
        { no: 'don\u2019t sell the ai.', yes: 'remove a task from the audit cycle.' },
        { no: 'don\u2019t make it guess.', yes: 'select the matrix, reference the evidence.' },
        { no: 'don\u2019t chase the perfect prompt.', yes: 'be specific, then iterate.' },
        { no: 'don\u2019t treat the output as final.', yes: 'the auditor still concludes.' },
        { no: 'don\u2019t promise the roadmap.', yes: 'demo what\u2019s enabled today.' }
      ]
    };
  }
}