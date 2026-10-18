// Editable, self-contained six-page business collections. No remote assets.
const text = (value, x, y, w, size, color, props = {}) => ({
  type: 'text', text: value, x, y, w,
  h: Math.ceil(size * 1.25 * value.split('\n').length + 8),
  fontFamily: 'Arial', fontSize: size, fontWeight: 400, lineHeight: 1.25, color, ...props
});
const box = (x, y, w, h, fill, props = {}) => ({ type: 'rect', x, y, w, h, fill, ...props });
const circle = (x, y, size, fill) => ({ type: 'ellipse', x, y, w: size, h: size, fill });
const bold = { fontWeight: 700 };
const tag = (value, x, y, w, color) => text(value, x, y, w, 20, color, { ...bold, letterSpacing: 1.6 });
const page = (width, height, color, elements) => ({ width, height, background: { type: 'solid', color }, elements });
const palettes = {
  deck: { ink: '#13233f', accent: '#2855f9', paper: '#f5f7fc', soft: '#e3eaff', muted: '#59677f' },
  proposal: { ink: '#292722', accent: '#b76a0a', paper: '#fbf7ee', soft: '#f3e3c3', muted: '#71685b' },
  report: { ink: '#142c40', accent: '#087f8c', paper: '#ffffff', soft: '#e1f3f1', muted: '#5b6f7c' },
  profile: { ink: '#213e34', accent: '#557459', paper: '#faf8f1', soft: '#dce5d4', muted: '#647268' }
};
const footer = (p, n, width, height, dark = false) => [
  box(90, height - 104, width - 180, 1, dark ? '#66768b' : p.soft),
  text('[Company name]', 90, height - 78, width - 320, 20, dark ? p.paper : p.muted),
  text(`${String(n).padStart(2, '0')} / 06`, width - 220, height - 78, 130, 20, dark ? p.paper : p.muted, { align: 'right' })
];
const documentPage = (p, n, section, title, elements) => page(1240, 1754, p.paper, [
  tag('[COMPANY NAME]', 90, 64, 850, p.accent),
  box(90, 128, 1060, 2, p.soft),
  tag(section, 90, 169, 1060, p.accent),
  text(title, 90, 224, 1060, 64, p.ink, bold),
  ...elements, ...footer(p, n, 1240, 1754)
]);
const slide = (p, n, section, title, elements) => page(1920, 1080, p.paper, [
  tag('[COMPANY NAME]', 96, 64, 1500, p.accent),
  tag(section, 96, 143, 1600, p.muted),
  text(title, 96, 199, 1728, 76, p.ink, bold),
  ...elements, ...footer(p, n, 1920, 1080)
]);
const card = (p, x, y, w, h, number, title, copy) => [
  box(x, y, w, h, p.soft, { radius: 12 }),
  tag(number, x + 30, y + 28, w - 60, p.accent),
  text(title, x + 30, y + 80, w - 60, 36, p.ink, bold),
  text(copy, x + 30, y + 143, w - 60, 27, p.muted)
];
const chart = (p, x, y, w, h, type, title, categories, series) => ({
  type: 'chart', x, y, w, h,
  chart: { type, title, categories, series, fontSize: 24, textColor: p.ink,
    showLegend: series.length > 1, showAxes: true, showGrid: true, showValues: false }
});
const exampleNote = (p, y, width = 1060, x = 90) => text('Illustrative example data. Replace with your own results.', x, y, width, 22, p.muted);

function businessPresentation() {
  const p = palettes.deck;
  return {
    name: 'Business presentation', category: 'Business', format: 'Presentation',
    pages: [
      page(1920, 1080, p.ink, [
        tag('[COMPANY NAME]', 96, 75, 1000, '#a8bbff'),
        text('Business\nin motion.', 90, 245, 1160, 142, '#ffffff', bold),
        text('A clear direction for the next chapter.', 96, 656, 1100, 36, '#c1cee7'),
        tag('BUSINESS PRESENTATION / [YEAR]', 96, 842, 1120, '#a8bbff'),
        circle(1320, 190, 420, p.accent),
        box(1260, 615, 165, 270, '#a8bbff'), box(1450, 490, 165, 395, '#6b8bff'),
        box(1640, 340, 165, 545, p.accent),
        ...footer(p, 1, 1920, 1080, true)
      ]),
      slide(p, 2, '01 / OVERVIEW', 'The opportunity ahead', [
        text('A shared ambition.\nA practical plan.', 96, 353, 780, 66, p.ink, bold),
        text('Introduce your business, your audience,\nand the change you want to create.', 96, 570, 800, 34, p.muted),
        ...['Where we are', 'Where we are going', 'How we will get there'].flatMap((title, i) => [
          box(1050, 335 + i * 188, 750, 156, i === 0 ? p.accent : p.soft, { radius: 10 }),
          tag(`0${i + 1}`, 1080, 358 + i * 188, 100, i === 0 ? '#ffffff' : p.accent),
          text(title, 1190, 362 + i * 188, 570, 38, i === 0 ? '#ffffff' : p.ink, bold),
          text('[Add your key message]', 1190, 420 + i * 188, 570, 27, i === 0 ? '#ffffff' : p.muted)
        ])
      ]),
      slide(p, 3, '02 / THE PROBLEM', 'What is holding progress back?', [
        ...[
          ['Disconnected tools', 'Teams lose time switching\nbetween systems and sources.'],
          ['Unclear priorities', 'Competing demands make it\nhard to focus on what matters.'],
          ['Slow decisions', 'Limited visibility turns\nsimple decisions into delays.']
        ].flatMap(([title, copy], i) => card(p, 96 + i * 582, 365, 552, 370, `0${i + 1}`, title, copy)),
        box(96, 800, 1716, 112, p.ink, { radius: 10 }),
        text('The opportunity: turn complexity into a clear, repeatable way forward.', 126, 829, 1656, 34, '#ffffff', bold)
      ]),
      slide(p, 4, '03 / OUR SOLUTION', 'One clear path from idea to impact', [
        box(96, 344, 1716, 214, p.accent, { radius: 12 }),
        text('A connected approach.\nBuilt around your goals.', 134, 379, 1540, 54, '#ffffff', bold),
        ...[
          ['Discover', 'Understand the needs\nand define success.'],
          ['Design', 'Shape the approach\nand test the details.'],
          ['Deliver', 'Launch with clarity\nand shared ownership.'],
          ['Improve', 'Learn from results\nand keep moving.']
        ].flatMap(([title, copy], i) => [
          tag(`0${i + 1}`, 96 + i * 438, 635, 380, p.accent),
          text(title, 96 + i * 438, 692, 390, 40, p.ink, bold),
          text(copy, 96 + i * 438, 769, 390, 30, p.muted)
        ])
      ]),
      slide(p, 5, '04 / RESULTS', 'Progress you can see', [
        chart(p, 96, 350, 1110, 548, 'grouped-bar', 'Revenue and costs · example units', ['Q1', 'Q2', 'Q3', 'Q4'], [
          { name: 'Revenue', values: [80, 100, 125, 160], color: p.accent },
          { name: 'Costs', values: [60, 68, 82, 95], color: '#a8bbff' }
        ]),
        ...[['+28%', 'Example growth'], ['94%', 'Example satisfaction']].flatMap(([value, label], i) => [
          box(1280, 350 + i * 285, 532, 245, p.soft, { radius: 12 }),
          text(value, 1314, 380 + i * 285, 464, 82, p.accent, bold),
          text(label, 1314, 494 + i * 285, 464, 29, p.muted)
        ]),
        exampleNote(p, 925, 1716, 96)
      ]),
      slide(p, 6, '05 / NEXT STEPS', 'Let’s build what comes next.', [
        text('Clear priorities.\nShared momentum.', 96, 373, 880, 80, p.accent, bold),
        ...[['Align', 'Confirm the goals and success measures.'], ['Plan', 'Agree on owners, milestones, and timing.'], ['Begin', 'Take the first practical step together.']].flatMap(([title, copy], i) => [
          tag(`0${i + 1} / ${title.toUpperCase()}`, 1090, 365 + i * 150, 700, p.accent),
          text(copy, 1090, 415 + i * 150, 700, 30, p.muted)
        ]),
        box(96, 849, 1716, 94, p.ink, { radius: 10 }),
        text('[Contact name]  /  [Email address]  /  [Website]', 128, 874, 1652, 30, '#ffffff')
      ])
    ]
  };
}

function businessProposal() {
  const p = palettes.proposal;
  return {
    name: 'Business proposal', category: 'Business', format: 'Proposal document',
    pages: [
      page(1240, 1754, p.paper, [
        box(1150, 0, 90, 1650, p.accent), tag('[COMPANY NAME]', 90, 70, 1000, p.accent),
        tag('PROJECT PROPOSAL', 90, 259, 1000, p.muted),
        text('A clear plan.\nA stronger\npartnership.', 82, 357, 1040, 104, p.ink, bold),
        box(90, 835, 140, 12, p.accent),
        text('[Project title]', 90, 914, 1000, 42, p.muted),
        box(90, 1120, 1000, 300, p.soft, { radius: 12 }),
        tag('PREPARED FOR', 126, 1165, 430, p.accent), tag('PREPARED BY', 640, 1165, 410, p.accent),
        text('[Client name]', 126, 1225, 430, 36, p.ink, bold), text('[Your team]', 640, 1225, 410, 36, p.ink, bold),
        text('[Date]  /  [Proposal reference]', 126, 1330, 900, 25, p.muted),
        ...footer(p, 1, 1240, 1754)
      ]),
      documentPage(p, 2, '01 / EXECUTIVE SUMMARY', 'An approach built for you', [
        text('Your ambition is the starting point.\nOur role is to make the path forward\nclear, practical, and achievable.', 90, 414, 1060, 46, p.ink, bold),
        ...[
          ['The objective', '[Describe the business goal and the outcome you want to achieve.]'],
          ['Our approach', '[Summarize the work, the collaboration, and the delivery method.]'],
          ['The outcome', '[Explain what success looks like for your team and your customers.]']
        ].flatMap(([title, copy], i) => [
          box(90, 720 + i * 260, 1060, 216, p.soft, { radius: 12 }),
          text(title, 122, 750 + i * 260, 996, 36, p.ink, bold),
          text(copy, 122, 821 + i * 260, 996, 27, p.muted, { h: 90 })
        ])
      ]),
      documentPage(p, 3, '02 / SCOPE OF WORK', 'From discovery to delivery', [
        ...[
          ['Discovery', 'Workshops, research, and\na shared definition of success.'],
          ['Strategy', 'A focused direction and\na practical action plan.'],
          ['Design', 'Concepts, prototypes, and\nclear delivery specifications.'],
          ['Implementation', 'Build, review, and refine\nthe agreed deliverables.'],
          ['Handover', 'Documentation, training,\nand team enablement.'],
          ['Support', 'A defined review period\nand a plan for next steps.']
        ].flatMap(([title, copy], i) => card(p, 90 + (i % 2) * 550, 420 + Math.floor(i / 2) * 365, 510, 320, `0${i + 1}`, title, copy))
      ]),
      documentPage(p, 4, '03 / DELIVERY TIMELINE', 'A shared route to launch', [
        box(130, 462, 3, 830, p.accent),
        ...[
          ['Discover', '[Weeks 1–2]', 'Align on goals, gather inputs, and confirm the brief.'],
          ['Develop', '[Weeks 3–5]', 'Explore directions, review work, and refine the details.'],
          ['Deliver', '[Weeks 6–8]', 'Complete the work, validate quality, and prepare launch.'],
          ['Support', '[Weeks 9–10]', 'Enable the team and review the first results.']
        ].flatMap(([title, timing, copy], i) => [
          circle(112, 448 + i * 245, 40, p.accent),
          tag(timing, 192, 439 + i * 245, 900, p.accent),
          text(title, 192, 483 + i * 245, 900, 40, p.ink, bold),
          text(copy, 192, 558 + i * 245, 930, 27, p.muted, { h: 90 })
        ]),
        text('Timing is indicative. Confirm milestones and dependencies together.', 90, 1500, 1060, 25, p.muted, { h: 76 })
      ]),
      documentPage(p, 5, '04 / INVESTMENT', 'A transparent investment', [
        box(90, 420, 1060, 88, p.ink), tag('WORKSTREAM', 122, 449, 700, p.paper),
        tag('INVESTMENT', 865, 449, 250, p.paper),
        ...['Discovery & strategy', 'Design & development', 'Implementation & handover', 'Ongoing support'].flatMap((title, i) => [
          box(90, 508 + i * 134, 1060, 134, i % 2 === 0 ? p.soft : p.paper),
          text(title, 122, 550 + i * 134, 700, 30, p.ink),
          text('[Amount]', 865, 550 + i * 134, 250, 30, p.ink, { align: 'right' })
        ]),
        box(90, 1110, 1060, 170, p.accent, { radius: 10 }),
        text('Total investment', 122, 1164, 700, 36, '#ffffff', bold),
        text('[Total]', 865, 1164, 250, 36, '#ffffff', { ...bold, align: 'right' }),
        tag('PAYMENT & TERMS', 90, 1370, 1060, p.accent),
        text('[Add payment schedule, currency, tax treatment,\nand any assumptions or exclusions.]', 90, 1430, 1060, 28, p.muted)
      ]),
      documentPage(p, 6, '05 / NEXT STEPS', 'Ready when you are.', [
        text('Let’s turn this proposal\ninto a shared plan.', 90, 415, 1060, 58, p.ink, bold),
        ...[['Review', 'Walk through the scope and resolve open questions.'], ['Agree', 'Confirm deliverables, timing, and commercial terms.'], ['Start', 'Schedule the kickoff and bring the right people together.']].flatMap(([title, copy], i) => [
          tag(`0${i + 1}`, 90, 715 + i * 173, 90, p.accent),
          text(title, 200, 706 + i * 173, 950, 36, p.ink, bold),
          text(copy, 200, 766 + i * 173, 950, 27, p.muted, { h: 80 })
        ]),
        box(90, 1315, 1060, 245, p.soft, { radius: 12 }),
        text('[Contact name] / [Role]', 126, 1355, 988, 34, p.ink, bold),
        text('[Email address]\n[Phone number] / [Website]', 126, 1424, 988, 27, p.muted)
      ])
    ]
  };
}

function quarterlyReport() {
  const p = palettes.report;
  return {
    name: 'Quarterly report', category: 'Business', format: 'Performance report',
    pages: [
      page(1240, 1754, p.paper, [
        box(0, 0, 24, 1754, p.accent), tag('[COMPANY NAME]', 90, 70, 1060, p.accent),
        tag('QUARTERLY REPORT', 90, 267, 1060, p.muted),
        text('Quarterly\nperspective.', 82, 365, 1070, 112, p.ink, bold),
        text('Progress, performance, and the road ahead.', 90, 715, 1060, 34, p.muted),
        ...[160, 260, 370, 485, 615].map((h, i) => box(570 + i * 115, 1460 - h, 85, h, i === 4 ? p.accent : p.soft)),
        text('Q[X]\n[Year]', 90, 1090, 440, 84, p.accent, bold),
        text('Prepared for [Audience]\n[Publication date]', 90, 1479, 1060, 26, p.muted),
        ...footer(p, 1, 1240, 1754)
      ]),
      documentPage(p, 2, '01 / HIGHLIGHTS', 'The quarter at a glance', [
        ...[
          ['[Revenue]', 'REVENUE', '[Add the period total\nand a short comparison.]'],
          ['[Growth]', 'GROWTH', '[Add the growth measure\nand its business context.]'],
          ['[Customers]', 'CUSTOMERS', '[Add the customer count\nand a useful trend.]'],
          ['[Margin]', 'MARGIN', '[Add the margin measure\nand a brief explanation.]']
        ].flatMap(([value, label, copy], i) => {
          const x = 90 + (i % 2) * 550;
          const y = 420 + Math.floor(i / 2) * 390;
          return [box(x, y, 510, 350, p.soft, { radius: 12 }), tag(label, x + 30, y + 32, 450, p.accent),
            text(value, x + 30, y + 108, 450, 50, p.ink, bold), text(copy, x + 30, y + 211, 450, 27, p.muted)];
        }),
        tag('THE KEY TAKEAWAY', 90, 1285, 1060, p.accent),
        text('[Summarize the most important result,\nwhat drove it, and what it means next.]', 90, 1350, 1060, 38, p.ink)
      ]),
      documentPage(p, 3, '02 / FINANCIAL RESULTS', 'A clearer view of performance', [
        chart(p, 90, 420, 1060, 680, 'grouped-bar', 'Revenue and costs · example units', ['Jan', 'Feb', 'Mar'], [
          { name: 'Revenue', values: [120, 138, 160], color: p.accent },
          { name: 'Costs', values: [80, 88, 95], color: '#8fcac8' }
        ]),
        ...[['Revenue', '[Period total]'], ['Costs', '[Period total]'], ['Result', '[Net result]']].flatMap(([title, value], i) => [
          box(90 + i * 363, 1170, 334, 205, p.soft, { radius: 10 }),
          tag(title.toUpperCase(), 114 + i * 363, 1203, 286, p.accent),
          text(value, 114 + i * 363, 1270, 286, 32, p.ink, bold)
        ]),
        exampleNote(p, 1450),
        text('[Add commentary on the main drivers and variances.]', 90, 1510, 1060, 27, p.muted)
      ]),
      documentPage(p, 4, '03 / OPERATIONAL PERFORMANCE', 'Momentum that compounds', [
        chart(p, 90, 420, 1060, 620, 'line', 'Delivery index · example units', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [
          { name: 'Delivery index', values: [42, 48, 51, 65, 72, 84], color: p.accent }
        ]),
        exampleNote(p, 1070),
        ...[['What improved', '[Describe the strongest operational improvement.]'], ['What needs attention', '[Identify the constraint and the action being taken.]']].flatMap(([title, copy], i) => [
          box(90, 1160 + i * 205, 8, 155, p.accent),
          text(title, 130, 1167 + i * 205, 1020, 36, p.ink, bold),
          text(copy, 130, 1233 + i * 205, 1020, 27, p.muted, { h: 78 })
        ])
      ]),
      documentPage(p, 5, '04 / PRIORITIES', 'Focus for the next quarter', [
        ...[
          ['Strengthen the core', '[Describe the improvement that protects\nquality, reliability, or the customer experience.]'],
          ['Unlock growth', '[Describe the opportunity and the practical\nsteps needed to make progress.]'],
          ['Build capability', '[Describe the people, process, or technology\ninvestment that supports the next stage.]']
        ].flatMap(([title, copy], i) => [
          box(90, 420 + i * 375, 1060, 330, p.soft, { radius: 12 }),
          tag(`PRIORITY 0${i + 1}`, 124, 450 + i * 375, 992, p.accent),
          text(title, 124, 505 + i * 375, 992, 42, p.ink, bold),
          text(copy, 124, 586 + i * 375, 992, 28, p.muted),
          text('[Owner]  /  [Target date]  /  [Success measure]', 124, 688 + i * 375, 992, 23, p.accent)
        ])
      ]),
      documentPage(p, 6, '05 / OUTLOOK', 'Looking forward with purpose', [
        box(90, 420, 1060, 450, p.ink, { radius: 12 }),
        text('Focused on\nwhat comes next.', 132, 481, 976, 68, '#ffffff', bold),
        text('[Add a concise statement about the next quarter.]', 132, 735, 976, 28, '#c4dddd', { h: 90 }),
        ...[['Opportunity', '[Where we see the greatest potential.]'], ['Watchpoint', '[What we are monitoring closely.]'], ['Next review', '[Date, audience, and review milestone.]']].flatMap(([title, copy], i) => [
          tag(title.toUpperCase(), 90, 972 + i * 183, 1060, p.accent),
          text(copy, 90, 1025 + i * 183, 1060, 30, p.muted)
        ]),
        text('Questions: [Contact name] / [Email address]', 90, 1540, 1060, 26, p.ink)
      ])
    ]
  };
}

function companyProfile() {
  const p = palettes.profile;
  return {
    name: 'Company profile', category: 'Business', format: 'Company document',
    pages: [
      page(1240, 1754, p.ink, [
        tag('[COMPANY NAME]', 90, 70, 1060, '#c8d7bc'),
        tag('COMPANY PROFILE', 90, 268, 1060, '#c8d7bc'),
        text('Good people.\nClear purpose.\nLasting impact.', 82, 365, 1070, 98, p.paper, bold),
        text('[A short description of what your company does.]', 90, 849, 1060, 30, '#c8d7bc', { h: 90 }),
        circle(704, 1050, 410, '#557459'), circle(514, 1235, 225, '#c8d7bc'),
        box(909, 1255, 205, 205, p.ink),
        text('[Website]\n[Year / Edition]', 90, 1430, 900, 26, p.paper),
        ...footer(p, 1, 1240, 1754, true)
      ]),
      documentPage(p, 2, '01 / OUR STORY', 'Built on a clear purpose', [
        text('We believe good work starts\nwith understanding people\nand the world around them.', 90, 420, 1060, 52, p.ink, bold),
        text('[Introduce your company, the people you serve,\nand the principles that guide your work.]', 90, 675, 1060, 30, p.muted),
        ...[['[Founded]', 'Where it began', '[Describe the idea that started the company.]'], ['[Milestone]', 'How we have grown', '[Describe a defining moment in your journey.]'], ['[Today]', 'What drives us now', '[Describe your focus and ambition for the future.]']].flatMap(([year, title, copy], i) => [
          box(90, 893 + i * 224, 1060, 2, p.soft),
          tag(year, 90, 936 + i * 224, 220, p.accent),
          text(title, 340, 929 + i * 224, 810, 36, p.ink, bold),
          text(copy, 340, 996 + i * 224, 810, 27, p.muted, { h: 82 })
        ])
      ]),
      documentPage(p, 3, '02 / OUR SERVICES', 'Expertise that works together', [
        ...[
          ['Advisory', 'Clear thinking, useful insight,\nand a practical direction\nfor your next decision.'],
          ['Design', 'Thoughtful experiences,\nclear communication, and\ncarefully considered details.'],
          ['Delivery', 'The people and processes\nto turn shared plans into\nwork that makes a difference.'],
          ['Support', 'Ongoing partnership,\ncontinuous improvement,\nand help when it matters.']
        ].flatMap(([title, copy], i) => card(p, 90 + (i % 2) * 550, 420 + Math.floor(i / 2) * 490, 510, 440, `0${i + 1}`, title, copy)),
        text('[Add your sector focus, specialty, or service promise.]', 90, 1470, 1060, 28, p.muted)
      ]),
      documentPage(p, 4, '03 / OUR PEOPLE', 'Meet the team behind the work', [
        ...['AB', 'CD', 'EF', 'GH'].flatMap((initials, i) => {
          const x = 90 + (i % 2) * 550;
          const y = 420 + Math.floor(i / 2) * 545;
          return [box(x, y, 510, 490, p.soft, { radius: 12 }), circle(x + 165, y + 40, 180, p.accent),
            text(initials, x + 165, y + 82, 180, 64, p.paper, { ...bold, align: 'center' }),
            text('[Team member]', x + 30, y + 267, 450, 36, p.ink, bold),
            tag('[ROLE]', x + 30, y + 330, 450, p.accent),
            text('[Add a short introduction\nand area of expertise.]', x + 30, y + 384, 450, 26, p.muted)];
        })
      ]),
      documentPage(p, 5, '04 / CASE STUDY', 'A partnership in practice', [
        tag('[CLIENT NAME] / [PROJECT]', 90, 409, 1060, p.accent),
        ...[
          ['The challenge', '[Describe the context, the client’s needs,\nand the problem your team was asked to solve.]'],
          ['Our approach', '[Explain the thinking, the collaboration,\nand the work delivered by your team.]'],
          ['The outcome', '[Describe the result and what changed.\nUse a measurable outcome where available.]']
        ].flatMap(([title, copy], i) => [
          box(90, 505 + i * 326, 1060, 280, i === 2 ? p.ink : p.soft, { radius: 12 }),
          text(title, 126, 543 + i * 326, 988, 40, i === 2 ? p.paper : p.ink, bold),
          text(copy, 126, 631 + i * 326, 988, 29, i === 2 ? '#c8d7bc' : p.muted)
        ]),
        text('[Replace this case study with your own verified project story.]', 90, 1520, 1060, 25, p.muted)
      ]),
      documentPage(p, 6, '05 / GET IN TOUCH', 'Let’s start a conversation.', [
        box(90, 420, 1060, 510, p.ink, { radius: 12 }),
        text('Good work\nstarts together.', 132, 487, 976, 76, p.paper, bold),
        text('Tell us what you have in mind.\nWe would love to explore what is possible.', 132, 740, 976, 30, '#c8d7bc'),
        ...[['EMAIL', '[Email address]'], ['PHONE', '[Phone number]'], ['VISIT', '[Website / Office address]']].flatMap(([label, value], i) => [
          tag(label, 90, 1040 + i * 165, 230, p.accent),
          text(value, 340, 1030 + i * 165, 810, 34, p.ink),
          box(90, 1127 + i * 165, 1060, 1, p.soft)
        ])
      ])
    ]
  };
}

export const BUSINESS_TEMPLATES = [businessPresentation(), businessProposal(), quarterlyReport(), companyProfile()];
