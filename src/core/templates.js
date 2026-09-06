// Template artwork uses native editor elements so every detail remains editable.
const text = (value, x, y, w, size, color, props = {}) => {
  const style = { fontSize: size, fontFamily: 'Arial', fontWeight: 400, lineHeight: 1.15, ...props };
  return {
    type: 'text', text: value, x, y, w, color,
    h: Math.ceil(style.fontSize * style.lineHeight * value.split('\n').length + 8),
    ...style
  };
};
const label = (value, x, y, w, color, props = {}) =>
  text(value, x, y, w, 22, color, { fontWeight: 700, letterSpacing: 2, ...props });
const box = (x, y, w, h, fill, props = {}) => ({ type: 'rect', x, y, w, h, fill, ...props });
const circle = (x, y, size, fill, props = {}) => ({ type: 'ellipse', x, y, w: size, h: size, fill, ...props });
const rule = (x, y, w, color) => box(x, y, w, 2, color);
const icon = (name, x, y, size, fill, props = {}) => ({ type: 'icon', icon: name, x, y, w: size, h: size, fill, ...props });
const serif = { fontFamily: 'Georgia' };
const bold = { fontWeight: 700 };
const centered = { align: 'center' };
const template = (name, category, format, width, height, color, elements) => ({
  name, category, format,
  page: { width, height, background: { type: 'solid', color }, elements }
});

export const TEMPLATES = [
  template('Summer Social', 'Social', 'Square post', 1080, 1080, '#f5f0df', [
    box(640, 0, 440, 1080, '#f56538'),
    circle(700, 118, 280, '#f8d353'),
    ...[0, 1, 2, 3].map(i => box(690 + i * 82, 570 - i * 60, 48, 340 + i * 60, '#9c352b', { radius: 24 })),
    label('THE SUNNY EDIT', 64, 64, 540, '#243c32'),
    text('Hello,\nsummer.', 60, 210, 640, 112, '#243c32', serif),
    text('Long days.\nLittle adventures.\nGood company.', 66, 535, 520, 36, '#243c32'),
    rule(66, 820, 480, '#243c32'),
    label('MAKE ROOM FOR GOOD DAYS', 66, 852, 500, '#243c32', { fontSize: 18 }),
    icon('arrow-right', 66, 938, 54, '#243c32')
  ]),
  template('Words to Keep', 'Social', 'Quote card', 1080, 1080, '#e9e2f3', [
    box(40, 40, 1000, 1000, 'none', { stroke: '#665281', strokeWidth: 2 }),
    label('A SMALL REMINDER', 100, 105, 880, '#513f69', centered),
    text('“', 110, 200, 250, 210, '#aa90c4', serif),
    text('Make space\nfor what\nmatters.', 115, 360, 850, 100, '#332546', serif),
    rule(120, 815, 90, '#665281'),
    label('ONE THOUGHT AT A TIME', 120, 856, 800, '#513f69', { fontSize: 18 }),
    icon('star', 880, 850, 65, '#665281')
  ]),
  template('New Collection', 'Social', 'Portrait story', 1080, 1920, '#eedbc5', [
    box(54, 54, 972, 1812, 'none', { stroke: '#664637', strokeWidth: 2 }),
    label('FORM / STUDIO', 120, 130, 840, '#523c30', centered),
    text('Objects for\neveryday living.', 110, 295, 860, 94, '#523c30', { ...serif, ...centered }),
    circle(205, 680, 670, '#d6b895'),
    box(170, 1225, 740, 65, '#ac8466', { radius: 12 }),
    box(355, 925, 370, 300, '#8f4939', { radius: 140 }),
    box(455, 830, 170, 155, '#8f4939', { radius: 25 }),
    box(480, 850, 120, 25, '#5b332b', { radius: 12 }),
    box(515, 655, 14, 180, '#52604a', { rotation: -14 }),
    { type: 'ellipse', x: 412, y: 660, w: 125, h: 55, fill: '#52604a', rotation: 32 },
    { type: 'ellipse', x: 517, y: 600, w: 125, h: 55, fill: '#52604a', rotation: -35 },
    label('THE SLOW LIVING COLLECTION', 110, 1420, 860, '#523c30', centered),
    text('Considered shapes. Warm details.', 110, 1490, 860, 32, '#523c30', centered),
    box(275, 1650, 530, 100, '#523c30', { radius: 50 }),
    label('EXPLORE THE COLLECTION', 290, 1685, 500, '#fff8ef', { ...centered, fontSize: 18 })
  ]),
  template('Open Conversations', 'Social', 'Podcast cover', 1080, 1080, '#172b47', [
    circle(615, 120, 400, '#ff795e'),
    ...[110, 210, 310, 410, 310, 210, 110].map((h, i) => box(670 + i * 40, 320 - h / 2, 22, h, '#172b47', { radius: 11 })),
    label('THE INDEPENDENT PODCAST', 65, 65, 910, '#f6edda'),
    text('Open\nconversations.', 60, 555, 960, 102, '#f6edda', bold),
    rule(65, 850, 950, '#6d8098'),
    text('Ideas, people & everything in between.', 65, 890, 850, 30, '#f6edda'),
    label('LISTEN AT YOUR OWN PACE', 65, 982, 750, '#ff795e', { fontSize: 18 })
  ]),
  template('Studio Pitch', 'Business', 'Presentation', 1920, 1080, '#f2f1e9', [
    box(1200, 0, 720, 1080, '#234638'),
    circle(1310, 200, 490, '#c5dd80'),
    box(1310, 445, 490, 390, '#89aa64'),
    circle(1430, 445, 250, '#234638'),
    label('STUDIO NORTH', 100, 85, 900, '#234638', { fontSize: 27 }),
    text('A clear vision.\nA bold next step.', 95, 300, 1070, 112, '#234638', serif),
    text('Your next chapter starts here.', 100, 615, 1000, 38, '#4e6557'),
    rule(100, 825, 970, '#a3afa1'),
    label('STRATEGY / IDENTITY / EXPERIENCE', 100, 872, 1000, '#234638'),
    label('01', 1735, 930, 100, '#e5edcd', { fontSize: 32 })
  ]),
  template('Studio Business Card', 'Business', 'Business card', 1050, 600, '#f4efdf', [
    box(700, 0, 350, 600, '#243d36'),
    circle(780, 80, 190, 'none', { stroke: '#dce6b1', strokeWidth: 3 }),
    text('a.', 790, 92, 170, 125, '#dce6b1', { ...serif, ...centered }),
    label('INDEPENDENT DESIGNER', 62, 58, 600, '#536557', { fontSize: 15 }),
    text('Aisyah\nRahman', 60, 160, 610, 70, '#243d36', serif),
    rule(65, 375, 555, '#a7afa0'),
    text('hello@example.com\nwww.example.com', 65, 416, 555, 25, '#243d36', { lineHeight: 1.5, h: 90 }),
    label('LET’S MAKE\nSOMETHING GOOD.', 753, 435, 270, '#dce6b1', { fontSize: 17, h: 60 })
  ]),
  template('Project Proposal', 'Business', 'Document cover', 1240, 1754, '#e9ecf0', [
    box(0, 0, 30, 1754, '#315cef'),
    label('NORTH / CONSULTING', 95, 95, 1040, '#20334f', { fontSize: 28 }),
    rule(95, 183, 1050, '#8996a9'),
    label('PREPARED FOR YOUR NEXT CHAPTER', 95, 310, 1050, '#315cef'),
    text('Project\nproposal', 85, 410, 1060, 145, '#20334f', bold),
    text('A thoughtful plan.\nA shared ambition.', 95, 810, 900, 44, '#4e5f77'),
    box(745, 1080, 370, 370, '#315cef'),
    circle(630, 1195, 255, '#a9bef7'),
    circle(910, 965, 205, '#20334f'),
    rule(95, 1530, 1050, '#8996a9'),
    text('Prepared by: Your team\nPrepared for: Your client', 95, 1580, 920, 28, '#20334f', { lineHeight: 1.5, h: 90 })
  ]),
  template('Certificate of Completion', 'Business', 'Certificate', 1600, 1130, '#faf6eb', [
    box(35, 35, 1530, 1060, 'none', { stroke: '#263f39', strokeWidth: 5 }),
    box(55, 55, 1490, 1020, 'none', { stroke: '#b49a5a', strokeWidth: 2 }),
    label('THE LEARNING STUDIO', 180, 125, 1240, '#263f39', centered),
    text('Certificate', 170, 230, 1260, 116, '#263f39', { ...serif, ...centered }),
    label('OF COMPLETION', 170, 390, 1260, '#8b723d', centered),
    text('Presented to', 170, 490, 1260, 30, '#687069', centered),
    text('Participant Name', 170, 562, 1260, 74, '#263f39', { ...serif, ...centered }),
    rule(400, 672, 800, '#b49a5a'),
    text('For completing [Course or Workshop Name]', 170, 715, 1260, 32, '#687069', centered),
    rule(225, 925, 330, '#687069'),
    rule(1045, 925, 330, '#687069'),
    label('DATE', 225, 950, 330, '#263f39', { ...centered, fontSize: 18 }),
    label('SIGNATURE', 1045, 950, 330, '#263f39', { ...centered, fontSize: 18 }),
    circle(730, 855, 140, '#b49a5a'),
    icon('star', 763, 888, 74, '#faf6eb')
  ]),
  template('Weekend Sale', 'Events', 'Sale poster', 1080, 1350, '#f7ff78', [
    box(0, 0, 1080, 105, '#20231f'),
    label('YOUR BRAND / THE WEEKEND EDIT', 60, 35, 960, '#f7ff78', centered),
    text('GOOD\nFINDS.', 60, 155, 960, 178, '#20231f', bold),
    box(68, 645, 940, 280, '#20231f', { rotation: -4 }),
    text('ON SALE', 98, 695, 880, 145, '#f7ff78', { ...bold, ...centered, rotation: -4 }),
    text('Your favourites. A fresh reason to shop.', 65, 1010, 950, 36, '#20231f'),
    rule(65, 1135, 950, '#20231f'),
    label('ADD YOUR DATES', 65, 1180, 740, '#20231f'),
    icon('arrow-right', 920, 1180, 60, '#20231f')
  ]),
  template('After Hours', 'Events', 'Music flyer', 1080, 1350, '#291f49', [
    ...[600, 450, 300, 150].map((size, i) => circle(540 - size / 2, 450 - size / 2, size, 'none', { stroke: ['#725399', '#9873b6', '#c59bd2', '#f8ae8d'][i], strokeWidth: 22 })),
    label('AN EVENING OF LIVE SOUND', 70, 75, 940, '#f6c3a4', centered),
    text('AFTER\nHOURS', 50, 795, 980, 130, '#f6c3a4', { ...bold, ...centered }),
    rule(80, 1130, 920, '#9873b6'),
    text('FRIDAY / 8 PM\nYour venue, your city', 80, 1170, 800, 30, '#f6c3a4', { h: 90, lineHeight: 1.4 }),
    icon('star', 905, 1180, 66, '#f6c3a4')
  ]),
  template('Make Something', 'Events', 'Workshop invite', 1080, 1350, '#f6eddb', [
    label('THE CREATIVE CLUB PRESENTS', 65, 65, 950, '#24473f'),
    text('Make\nsomething\nyours.', 60, 190, 970, 132, '#24473f', serif),
    circle(735, 610, 240, '#f16e4f'),
    box(85, 780, 220, 220, '#bacd8c', { rotation: -12 }),
    { type: 'triangle', x: 340, y: 770, w: 235, h: 230, fill: '#24473f', rotation: 12 },
    icon('star', 580, 795, 180, '#e0ac36'),
    rule(65, 1080, 950, '#24473f'),
    text('A hands-on creative workshop', 65, 1125, 950, 34, '#24473f', bold),
    text('Add your date  /  Add your venue', 65, 1200, 950, 27, '#53695b')
  ]),
  template('Together Forever', 'Events', 'Wedding invitation', 1080, 1500, '#f6eee7', [
    box(65, 65, 950, 1370, 'none', { stroke: '#9e715d', strokeWidth: 2, radius: 460 }),
    circle(450, 160, 180, 'none', { stroke: '#9e715d', strokeWidth: 2 }),
    icon('heart', 505, 215, 70, '#9e715d'),
    label('TOGETHER WITH THEIR FAMILIES', 165, 420, 750, '#775849', { ...centered, fontSize: 18 }),
    text('Amelia', 140, 550, 800, 110, '#775849', { ...serif, ...centered }),
    text('&', 140, 695, 800, 76, '#ad8b74', { ...serif, ...centered }),
    text('Daniel', 140, 795, 800, 110, '#775849', { ...serif, ...centered }),
    text('invite you to celebrate their wedding', 160, 995, 760, 28, '#775849', centered),
    rule(400, 1100, 280, '#ad8b74'),
    label('DAY / MONTH / YEAR', 200, 1160, 680, '#775849', centered),
    text('Your venue\nYour city', 230, 1240, 620, 27, '#775849', { ...centered, lineHeight: 1.5, h: 90 })
  ]),
  template('Coffee & Company', 'Lifestyle', 'Café post', 1080, 1080, '#f0dfbe', [
    label('THE CORNER CAFÉ', 65, 60, 950, '#49382b', centered),
    text('Coffee &\ngood company.', 70, 145, 940, 95, '#49382b', { ...serif, ...centered }),
    { type: 'ellipse', x: 270, y: 755, w: 560, h: 95, fill: '#cda778' },
    circle(690, 545, 175, 'none', { stroke: '#a45337', strokeWidth: 42 }),
    box(320, 515, 410, 280, '#a45337', { radius: 75 }),
    { type: 'ellipse', x: 340, y: 520, w: 370, h: 60, fill: '#553728' },
    ...[0, 1, 2].map(i => box(420 + i * 85, 405, 10, 70, '#cda778', { radius: 5, rotation: 12 })),
    rule(75, 925, 930, '#a88056'),
    text('Take a seat. Stay a little longer.', 75, 965, 930, 30, '#49382b', centered)
  ]),
  template('Seasonal Table', 'Lifestyle', 'Restaurant menu', 1080, 1500, '#f8f2e4', [
    box(38, 38, 1004, 1424, 'none', { stroke: '#244c42', strokeWidth: 2 }),
    label('FRESH / SIMPLE / SEASONAL', 100, 105, 880, '#244c42', centered),
    text('At the table', 95, 205, 890, 100, '#244c42', { ...serif, ...centered }),
    rule(100, 385, 880, '#244c42'),
    label('TO START', 100, 435, 880, '#9b5b36'),
    text('Garden salad\nRoasted tomato soup', 100, 495, 880, 42, '#244c42', { ...serif, lineHeight: 1.7, h: 155 }),
    label('THE MAIN EVENT', 100, 710, 880, '#9b5b36'),
    text('Wild mushroom pasta\nHerb-roasted vegetables', 100, 775, 880, 42, '#244c42', { ...serif, lineHeight: 1.7, h: 155 }),
    label('SOMETHING SWEET', 100, 990, 880, '#9b5b36'),
    text('Lemon & almond cake', 100, 1055, 880, 42, '#244c42', serif),
    rule(100, 1190, 880, '#244c42'),
    text('Made with care. Shared with friends.', 100, 1250, 880, 28, '#244c42', centered),
    label('YOUR RESTAURANT / YOUR ADDRESS', 100, 1350, 880, '#244c42', { ...centered, fontSize: 17 })
  ]),
  template('A Moment of Calm', 'Lifestyle', 'Wellness post', 1080, 1080, '#e5e9d8', [
    circle(625, 90, 320, '#b8c39e'),
    { type: 'ellipse', x: 640, y: 615, w: 310, h: 120, fill: '#78866c' },
    { type: 'ellipse', x: 675, y: 500, w: 240, h: 120, fill: '#9daa89' },
    { type: 'ellipse', x: 715, y: 400, w: 160, h: 105, fill: '#c8cbb7' },
    label('A MOMENT FOR YOU', 65, 65, 900, '#354f44'),
    text('Pause.\nBreathe.\nBegin again.', 60, 255, 930, 100, '#354f44', serif),
    rule(65, 835, 940, '#9daa89'),
    text('A little stillness goes a long way.', 65, 890, 940, 31, '#354f44'),
    label('YOUR DAILY DOSE OF CALM', 65, 980, 940, '#354f44', { fontSize: 18 })
  ]),
  template('Take the Scenic Route', 'Lifestyle', 'Travel poster', 1080, 1350, '#f8e9c8', [
    label('LESS HURRY. MORE WONDER.', 65, 65, 950, '#284c46', centered),
    text('Take the\nscenic route.', 65, 165, 950, 106, '#284c46', { ...serif, ...centered }),
    circle(685, 530, 180, '#e68d46'),
    { type: 'triangle', x: 60, y: 655, w: 700, h: 520, fill: '#99ad91' },
    { type: 'triangle', x: 430, y: 710, w: 600, h: 465, fill: '#527a6b' },
    { type: 'triangle', x: 90, y: 905, w: 900, h: 320, fill: '#284c46' },
    box(0, 1110, 1080, 240, '#284c46'),
    text('Somewhere new is calling.', 65, 1160, 950, 38, '#f8e9c8', centered),
    label('YOUR DESTINATION / YOUR NEXT ADVENTURE', 65, 1255, 950, '#cbd9be', { ...centered, fontSize: 17 })
  ])
];
