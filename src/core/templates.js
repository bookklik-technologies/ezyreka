// Native artwork and system fonts keep every template editable and self-contained.
const text = (value, x, y, w, size, color, props = {}) => {
  const style = { fontSize: size, fontFamily: 'Arial', fontWeight: 400, lineHeight: 1.15, ...props };
  return {
    type: 'text', text: value, x, y, w, color,
    h: Math.ceil(style.fontSize * style.lineHeight * value.split('\n').length + 8),
    ...style
  };
};
const label = (value, x, y, w, color, props = {}) =>
  text(value, x, y, w, 20, color, { fontWeight: 700, letterSpacing: 2, ...props });
const box = (x, y, w, h, fill, props = {}) => ({ type: 'rect', x, y, w, h, fill, ...props });
const circle = (x, y, size, fill, props = {}) => ({ type: 'ellipse', x, y, w: size, h: size, fill, ...props });
const oval = (x, y, w, h, fill, props = {}) => ({ type: 'ellipse', x, y, w, h, fill, ...props });
const rule = (x, y, w, color) => box(x, y, w, 2, color);
const icon = (name, x, y, size, fill, props = {}) => ({ type: 'icon', icon: name, x, y, w: size, h: size, fill, ...props });
const gradient = (from, to, angle = 135) => ({ type: 'gradient', from, to, angle });
const serif = { fontFamily: 'Georgia' };
const bold = { fontWeight: 700 };
const display = { fontFamily: 'Impact' };
const mono = { fontFamily: 'Courier New' };
const centered = { align: 'center' };
const right = { align: 'right' };
const template = (name, category, format, width, height, background, elements) => ({
  name, category, format,
  page: { width, height, background: typeof background === 'string' ? { type: 'solid', color: background } : background, elements }
});

export const TEMPLATES = [
  template('Summer Social', 'Social', 'Square post', 1080, 1080, '#ff7048', [
    box(36, 36, 1008, 1008, 'none', { stroke: '#43251e', strokeWidth: 2 }),
    label('[YOUR BRAND] / SUMMER EDIT', 70, 72, 890, '#43251e'),
    rule(70, 123, 940, '#43251e'),
    text('SUNNY', 60, 166, 950, 220, '#fff7cc', display),
    text('SIDE UP.', 65, 392, 950, 180, '#43251e', display),
    circle(718, 630, 250, '#ffde58'),
    icon('sun', 749, 661, 188, '#43251e'),
    text('Long days.\nLittle adventures.', 75, 690, 590, 48, '#43251e', serif),
    box(75, 887, 505, 74, '#43251e', { radius: 37 }),
    label('MAKE A LITTLE SUNSHINE', 98, 912, 460, '#fff7cc', { ...centered, fontSize: 18 }),
    text('01 / THE GOOD DAYS', 730, 978, 280, 18, '#43251e', mono)
  ]),
  template('Words to Keep', 'Social', 'Quote card', 1080, 1080, '#f7f5ef', [
    box(0, 0, 28, 1080, '#7460b0'),
    label('WORDS TO KEEP', 85, 70, 700, '#53466f'),
    text('“', 65, 162, 280, 240, '#bcaed7', serif),
    text('Make space\nfor what\nmatters.', 190, 306, 785, 108, '#30293c', { ...serif, lineHeight: 1.1 }),
    box(192, 708, 280, 12, '#cbbfeb'),
    text('A small reminder for a full life.', 195, 785, 740, 30, '#655e70'),
    rule(85, 933, 910, '#c9c3d1'),
    label('[AUTHOR / YOUR NAME]', 85, 969, 760, '#53466f', { fontSize: 17 }),
    icon('star', 932, 960, 40, '#7460b0')
  ]),
  template('New Collection', 'Social', 'Portrait story', 1080, 1920, '#efe9df', [
    label('[YOUR STUDIO]', 75, 84, 700, '#373a31'),
    label('VOL. 01', 805, 84, 200, '#373a31', right),
    text('Everyday\nobjects.', 72, 208, 936, 144, '#373a31', { ...serif, lineHeight: 1.05 }),
    box(75, 565, 930, 795, '#b8c3aa', { radius: 430 }),
    circle(623, 634, 235, '#e5d3a2'),
    oval(220, 1170, 660, 100, '#8c9d80'),
    box(305, 939, 270, 272, '#a5513e', { radius: 55 }),
    oval(305, 905, 270, 90, '#bd7054'),
    oval(329, 923, 222, 48, '#613f32'),
    box(659, 865, 100, 334, '#f4e7c9', { radius: 40 }),
    oval(629, 820, 160, 125, '#f4e7c9'),
    box(703, 746, 10, 118, '#465941', { rotation: 12 }),
    oval(712, 751, 105, 42, '#465941', { rotation: -25 }),
    label('THE NEW COLLECTION', 78, 1443, 920, '#675b4b'),
    text('Considered shapes.\nMade for your everyday.', 75, 1510, 930, 46, '#373a31', serif),
    rule(75, 1690, 930, '#a7aa98'),
    text('[Launch date]  /  [Your website]', 75, 1730, 830, 27, '#373a31'),
    icon('arrow-right', 930, 1725, 58, '#373a31'),
    label('EXPLORE THE COLLECTION', 75, 1830, 900, '#675b4b', { fontSize: 18 })
  ]),
  template('Open Conversations', 'Social', 'Podcast cover', 1080, 1080, '#102d36', [
    box(48, 48, 984, 984, 'none', { stroke: '#5e7b80', strokeWidth: 2 }),
    label('[YOUR PODCAST NETWORK]', 85, 85, 890, '#baf2d1'),
    text('OPEN', 75, 180, 910, 220, '#baf2d1', display),
    text('conversations', 83, 420, 930, 84, '#fff3de', serif),
    ...[70, 145, 220, 110, 270, 170, 95, 210, 140, 60].map((h, i) =>
      box(95 + i * 52, 705 - h / 2, 26, h, '#baf2d1', { radius: 13 })),
    circle(725, 580, 220, '#f18a65'),
    icon('chat', 780, 635, 110, '#102d36'),
    rule(85, 892, 910, '#5e7b80'),
    text('Ideas worth listening to.', 85, 932, 680, 30, '#fff3de'),
    label('[HOST NAME]', 735, 936, 245, '#baf2d1', { ...right, fontSize: 18 })
  ]),
  template('Studio Pitch', 'Business', 'Presentation', 1920, 1080, '#f4f2ec', [
    box(1250, 0, 670, 1080, '#203fba'),
    box(1345, 130, 475, 475, 'none', { stroke: '#c8d1ff', strokeWidth: 3 }),
    circle(1345, 130, 475, '#c8d1ff'),
    box(1582, 368, 238, 237, '#203fba'),
    box(1345, 650, 475, 210, '#b6e9c0'),
    text('N', 1390, 661, 390, 155, '#203fba', { ...display, ...centered }),
    label('[YOUR STUDIO]', 95, 88, 1030, '#203fba', { fontSize: 26 }),
    text('Ideas into\nimpact.', 88, 250, 1110, 164, '#202633', { ...serif, lineHeight: 1.05 }),
    text('A clear vision for your next chapter.', 98, 650, 1030, 39, '#5c626d'),
    rule(98, 839, 1040, '#b8bcc4'),
    label('STRATEGY / IDENTITY / EXPERIENCE', 98, 885, 1060, '#203fba'),
    text('[Client name]  /  [Presentation date]', 98, 961, 1060, 25, '#5c626d'),
    label('01', 1700, 945, 115, '#ffffff', { ...right, fontSize: 32 })
  ]),
  template('Studio Business Card', 'Business', 'Business card', 1050, 600, '#202b27', [
    box(32, 32, 986, 536, 'none', { stroke: '#728b77', strokeWidth: 2 }),
    circle(68, 65, 92, '#d6eea6'),
    icon('star', 90, 87, 48, '#202b27'),
    label('[YOUR STUDIO]', 195, 97, 760, '#d6eea6', { fontSize: 17 }),
    text('[Your Name]', 65, 222, 920, 74, '#f8f4e9', serif),
    text('[Your role / specialty]', 70, 328, 880, 26, '#a8b9aa'),
    rule(70, 420, 910, '#728b77'),
    text('[Email address]\n[Your website]', 70, 455, 560, 23, '#f8f4e9', { lineHeight: 1.5 }),
    text('[Phone number]', 650, 485, 330, 23, '#d6eea6', right)
  ]),
  template('Project Proposal', 'Business', 'Document cover', 1240, 1754, '#f1f3f6', [
    box(0, 0, 1240, 250, '#172c49'),
    label('[YOUR COMPANY]', 90, 100, 900, '#ffffff', { fontSize: 28 }),
    label('PROPOSAL / [YEAR]', 90, 333, 1060, '#345fea'),
    text('A plan for\nwhat’s next.', 82, 449, 1080, 132, '#172c49', { ...serif, lineHeight: 1.07 }),
    text('[Project title]', 90, 795, 1060, 42, '#52617a'),
    box(90, 953, 1060, 309, '#345fea'),
    box(125, 988, 240, 239, '#9fb7ff'),
    box(385, 1080, 300, 147, '#dce5ff'),
    box(705, 1160, 410, 67, '#ffffff'),
    label('PROJECT PROPOSAL', 90, 1365, 1060, '#345fea'),
    rule(90, 1430, 1060, '#aab4c4'),
    label('PREPARED FOR', 90, 1480, 510, '#52617a', { fontSize: 17 }),
    label('PREPARED BY', 660, 1480, 490, '#52617a', { fontSize: 17 }),
    text('[Client name]', 90, 1530, 510, 32, '#172c49'),
    text('[Team name]', 660, 1530, 490, 32, '#172c49'),
    text('[Date]  /  [Contact email]', 90, 1650, 1060, 25, '#52617a')
  ]),
  template('Certificate of Completion', 'Business', 'Certificate', 1600, 1130, '#faf7ed', [
    box(0, 0, 215, 1130, '#233c36'),
    rule(275, 65, 1250, '#b69a57'),
    box(275, 1020, 1250, 3, '#b69a57'),
    circle(44, 390, 128, '#b69a57'),
    icon('star', 77, 423, 62, '#faf7ed'),
    box(74, 510, 27, 145, '#b69a57'),
    box(118, 510, 27, 145, '#b69a57'),
    label('[ISSUING ORGANIZATION]', 300, 125, 1190, '#233c36', { ...centered, fontSize: 23 }),
    text('Certificate', 290, 237, 1220, 120, '#233c36', { ...serif, ...centered }),
    label('OF COMPLETION', 300, 397, 1190, '#8a713a', { ...centered, fontSize: 23 }),
    text('This certificate is presented to', 300, 500, 1190, 29, '#63726a', centered),
    text('[Participant Name]', 305, 578, 1180, 68, '#233c36', { ...serif, ...centered }),
    rule(430, 686, 930, '#b69a57'),
    text('For completing [Course or Workshop Name]', 310, 741, 1180, 30, '#63726a', centered),
    rule(360, 917, 370, '#63726a'),
    rule(1060, 917, 370, '#63726a'),
    text('[Date]', 360, 940, 370, 24, '#233c36', centered),
    text('[Signature / Name]', 1060, 940, 370, 24, '#233c36', centered)
  ]),
  template('Weekend Sale', 'Events', 'Sale poster', 1080, 1350, '#efefdf', [
    label('[YOUR BRAND] / LIMITED-TIME OFFERS', 65, 65, 950, '#252525', { fontSize: 19 }),
    rule(65, 116, 950, '#252525'),
    text('WEEKEND', 55, 182, 980, 163, '#252525', display),
    text('SALE', 52, 354, 976, 325, '#e14432', display),
    box(65, 745, 950, 216, '#e14432'),
    label('YOUR OFFER', 95, 779, 700, '#fff8e4'),
    text('[Discount / deal]', 94, 827, 880, 69, '#fff8e4', bold),
    text('Good finds. A fresh reason to shop.', 65, 1020, 950, 34, '#252525', serif),
    rule(65, 1125, 950, '#252525'),
    text('[Start date] — [End date]\n[Store address / website]', 65, 1171, 820, 28, '#252525', { lineHeight: 1.5 }),
    icon('arrow-right', 935, 1195, 60, '#e14432')
  ]),
  template('After Hours', 'Events', 'Music flyer', 1080, 1350, '#151320', [
    label('[PROMOTER] PRESENTS', 65, 65, 800, '#f9b7dc'),
    ...[0, 1, 2, 3, 4].map(i => oval(130 + i * 67, 185 + i * 50, 700 - i * 90, 480 - i * 52, 'none', { stroke: ['#6254ed', '#8577ff', '#c298ff', '#edabec', '#ffd5b4'][i], strokeWidth: 22, rotation: -22 })),
    text('AFTER', 62, 732, 950, 176, '#fcebd9', display),
    text('HOURS', 63, 905, 950, 176, '#f9b7dc', display),
    rule(65, 1133, 950, '#8577ff'),
    text('[Artist / lineup]\n[Date] / [Time] / [Venue]', 65, 1170, 810, 29, '#fcebd9', { lineHeight: 1.5 }),
    icon('star', 927, 1178, 72, '#f9b7dc')
  ]),
  template('Make Something', 'Events', 'Workshop invite', 1080, 1350, '#f7eecf', [
    box(0, 0, 1080, 105, '#2b4791'),
    label('[YOUR CREATIVE CLUB] PRESENTS', 65, 37, 950, '#f7eecf'),
    text('MAKE', 63, 174, 950, 202, '#2b4791', display),
    text('something', 65, 414, 950, 116, '#d95137', { ...serif, italic: true }),
    text('YOUR OWN.', 65, 564, 950, 137, '#2b4791', display),
    box(80, 778, 200, 200, '#e7b730', { rotation: -8 }),
    icon('star', 369, 770, 230, '#d95137'),
    circle(715, 786, 195, '#2b4791'),
    circle(775, 846, 75, '#f7eecf'),
    rule(65, 1065, 950, '#2b4791'),
    text('[Workshop title]', 65, 1102, 950, 37, '#2b4791', bold),
    text('[Date & time]  /  [Venue]\nReserve your spot: [Website / email]', 65, 1175, 950, 27, '#2b4791', { lineHeight: 1.5 })
  ]),
  template('Together Forever', 'Events', 'Wedding invitation', 1080, 1500, '#ede8df', [
    box(65, 65, 950, 1370, '#f9f6ee', { radius: 440 }),
    oval(470, 140, 140, 190, 'none', { stroke: '#8a7756', strokeWidth: 3 }),
    icon('heart', 510, 205, 60, '#8a7756'),
    label('TOGETHER WITH THEIR FAMILIES', 160, 402, 760, '#675e4d', { ...centered, fontSize: 17 }),
    text('[Name]', 140, 527, 800, 113, '#465443', { ...serif, ...centered }),
    text('&', 140, 688, 800, 80, '#8a7756', { ...serif, ...centered, italic: true }),
    text('[Name]', 140, 810, 800, 113, '#465443', { ...serif, ...centered }),
    text('invite you to celebrate their wedding', 150, 984, 780, 27, '#675e4d', centered),
    rule(407, 1076, 266, '#a99b80'),
    label('[DAY / MONTH / YEAR]', 180, 1130, 720, '#465443', { ...centered, fontSize: 21 }),
    text('[Time]  /  [Venue]\n[City]', 200, 1203, 680, 27, '#675e4d', { ...centered, lineHeight: 1.5 }),
    text('RSVP: [Contact]', 240, 1330, 600, 22, '#675e4d', centered)
  ]),
  template('Coffee & Company', 'Lifestyle', 'Café post', 1080, 1080, '#f3dfb7', [
    box(35, 35, 1010, 1010, 'none', { stroke: '#743c29', strokeWidth: 3 }),
    label('[YOUR CAFÉ]', 75, 73, 930, '#743c29', centered),
    text('Coffee first.', 68, 180, 940, 125, '#743c29', { ...serif, ...centered }),
    text('Good company always.', 85, 344, 910, 38, '#743c29', { ...serif, ...centered, italic: true }),
    oval(239, 760, 600, 90, '#d2ad7c'),
    circle(683, 550, 180, 'none', { stroke: '#466056', strokeWidth: 38 }),
    box(292, 530, 438, 261, '#466056', { radius: 90 }),
    oval(292, 504, 438, 92, '#658073'),
    oval(318, 521, 386, 54, '#382d24'),
    text('c.', 430, 612, 180, 104, '#f3dfb7', { ...serif, ...centered, italic: true }),
    rule(85, 903, 910, '#b1845f'),
    text('[Opening hours]  /  [Your address]', 85, 949, 910, 27, '#743c29', centered)
  ]),
  template('Seasonal Table', 'Lifestyle', 'Restaurant menu', 1080, 1500, '#f9f3e5', [
    box(35, 35, 1010, 1430, 'none', { stroke: '#354e3c', strokeWidth: 2 }),
    label('[YOUR RESTAURANT]', 85, 84, 910, '#354e3c', centered),
    text('Seasonal\ntable', 85, 173, 910, 107, '#354e3c', { ...serif, ...centered, lineHeight: 1.03 }),
    rule(85, 455, 910, '#354e3c'),
    ...[
      ['TO START', 'Garden salad', 'Roasted tomato soup'],
      ['THE MAIN EVENT', 'Wild mushroom pasta', 'Herb-roasted vegetables'],
      ['SOMETHING SWEET', 'Lemon & almond cake', 'Seasonal fruit bowl']
    ].flatMap(([heading, first, second], i) => {
      const y = 500 + i * 245;
      return [label(heading, 85, y, 910, '#a05b3e'), text(first, 85, y + 58, 715, 34, '#354e3c', serif),
        text('[Price]', 810, y + 63, 185, 25, '#354e3c', right), text(second, 85, y + 124, 715, 34, '#354e3c', serif),
        text('[Price]', 810, y + 129, 185, 25, '#354e3c', right)];
    }),
    rule(85, 1265, 910, '#354e3c'),
    text('Fresh ingredients. Thoughtfully prepared.', 85, 1310, 910, 28, '#354e3c', { ...serif, ...centered, italic: true }),
    text('[Address]  /  [Contact]', 85, 1389, 910, 22, '#68745e', centered)
  ]),
  template('A Moment of Calm', 'Lifestyle', 'Wellness post', 1080, 1080, '#dce5dd', [
    box(580, 45, 455, 990, '#a9bdac', { radius: 225 }),
    circle(657, 161, 300, '#f1e6c9'),
    oval(640, 790, 335, 118, '#45665d'),
    oval(683, 688, 250, 117, '#739080'),
    oval(729, 601, 159, 100, '#cad2b9'),
    label('[YOUR WELLNESS STUDIO]', 65, 73, 930, '#304e46', { fontSize: 18 }),
    text('A softer\nstart.', 62, 281, 640, 111, '#304e46', { ...serif, lineHeight: 1.08 }),
    text('Pause. Breathe.\nCome back to yourself.', 67, 596, 480, 33, '#304e46', { lineHeight: 1.4 }),
    rule(67, 813, 405, '#839b87'),
    text('[Class / session]\n[Date & time]', 67, 853, 465, 27, '#304e46', { lineHeight: 1.5 }),
    label('FIND YOUR MOMENT', 67, 986, 450, '#304e46', { fontSize: 17 })
  ]),
  template('Take the Scenic Route', 'Lifestyle', 'Travel poster', 1080, 1350, '#f6e3bb', [
    label('[DESTINATION / TRAVEL BRAND]', 65, 65, 950, '#284c46', centered),
    text('THE SCENIC', 62, 171, 956, 136, '#284c46', { ...display, ...centered }),
    text('ROUTE', 65, 309, 950, 216, '#284c46', { ...display, ...centered }),
    box(65, 590, 950, 470, '#b2c9bb'),
    circle(717, 630, 155, '#ec8c46'),
    { type: 'triangle', x: 75, y: 670, w: 640, h: 390, fill: '#668876' },
    { type: 'triangle', x: 425, y: 756, w: 570, h: 304, fill: '#284c46' },
    box(65, 990, 950, 70, '#284c46'),
    text('Less hurry. More wonder.', 65, 1115, 950, 42, '#284c46', { ...serif, ...centered, italic: true }),
    rule(65, 1210, 950, '#9ca784'),
    text('[Travel dates]  /  [Booking website]', 65, 1252, 950, 27, '#284c46', centered)
  ]),

  // New purposes: each composition is designed for its content and canvas format.
  template('Product Launch', 'Social', 'Product launch announcement', 1080, 1080, gradient('#4134b6', '#ba4b9b'), [
    label('[YOUR BRAND]', 70, 65, 760, '#ffffff'),
    box(778, 60, 232, 52, '#d7ff85', { radius: 26 }),
    label('JUST DROPPED', 788, 77, 212, '#28254b', { ...centered, fontSize: 15 }),
    text('Meet your\nnext favourite.', 65, 204, 940, 104, '#ffffff', { ...bold, lineHeight: 1.08 }),
    circle(665, 565, 300, 'none', { stroke: '#d7ff85', strokeWidth: 3 }),
    circle(715, 615, 200, '#d7ff85'),
    icon('star', 759, 659, 112, '#4134b6'),
    label('INTRODUCING', 70, 603, 555, '#e7d8ff'),
    text('[Product\nname]', 65, 656, 590, 75, '#ffffff', serif),
    rule(70, 905, 940, '#d1a7df'),
    text('[Launch date]  /  [Website]', 70, 957, 855, 28, '#ffffff'),
    icon('arrow-right', 943, 945, 60, '#d7ff85')
  ]),
  template('Customer Spotlight', 'Social', 'Customer testimonial', 1080, 1080, '#f8f7f2', [
    label('[YOUR BRAND]', 80, 70, 920, '#353b37'),
    rule(80, 132, 920, '#c4cbc3'),
    label('CUSTOMER SPOTLIGHT', 80, 204, 920, '#527961'),
    text('“', 65, 278, 250, 194, '#adc7ae', serif),
    text('[Share a short\ncustomer quote\nhere.]', 85, 435, 910, 72, '#353b37', { ...serif, lineHeight: 1.16 }),
    box(80, 808, 8, 120, '#527961'),
    text('[Customer name]', 120, 815, 850, 33, '#353b37', bold),
    text('[Role / company]', 120, 872, 850, 27, '#687269'),
    text('[Your website]', 80, 990, 920, 22, '#687269')
  ]),
  template('We’re Hiring', 'Business', 'Recruitment poster', 1080, 1350, '#e5edff', [
    label('[YOUR COMPANY]', 65, 67, 760, '#17316b'),
    icon('arrow-right', 904, 60, 100, '#335ee8', { rotation: -45 }),
    text('GOOD PEOPLE.\nBIG IDEAS.', 60, 222, 960, 109, '#17316b', display),
    box(65, 540, 950, 142, '#335ee8'),
    text('WE’RE HIRING', 90, 563, 900, 82, '#ffffff', display),
    label('OPEN POSITION', 65, 754, 950, '#335ee8'),
    text('[Job title]', 65, 807, 950, 64, '#17316b', bold),
    text('[Location]  /  [Work arrangement]', 65, 909, 950, 29, '#4c6189'),
    rule(65, 1030, 950, '#a5b5d8'),
    label('LET’S BUILD SOMETHING TOGETHER', 65, 1077, 950, '#17316b', { fontSize: 19 }),
    text('Apply: [Email / careers URL]\nApplications close: [Date]', 65, 1142, 950, 28, '#17316b', { lineHeight: 1.6 })
  ]),
  template('Services & Pricing', 'Business', 'Service pricing sheet', 1080, 1500, '#f3eee6', [
    label('[YOUR BUSINESS]', 75, 74, 930, '#443b33'),
    text('Good work.\nClear pricing.', 70, 195, 940, 97, '#443b33', { ...serif, lineHeight: 1.06 }),
    text('[A short introduction to your services]', 75, 462, 930, 28, '#75695c'),
    ...['01', '02', '03'].flatMap((n, i) => {
      const y = 570 + i * 232;
      return [rule(75, y, 930, '#baad9b'), label(n, 75, y + 42, 90, '#9a6546'),
        text('[Service name]', 195, y + 34, 555, 39, '#443b33', serif),
        text('[Price]', 780, y + 43, 225, 31, '#443b33', right),
        text('[What’s included in this service]', 195, y + 111, 790, 27, '#75695c')];
    }),
    box(75, 1280, 930, 145, '#443b33'),
    label('LET’S FIND THE RIGHT FIT', 105, 1312, 870, '#f3eee6', { fontSize: 18 }),
    text('[Contact email]  /  [Website]', 105, 1363, 870, 27, '#f3eee6')
  ]),
  template('Simple Invoice', 'Business', 'Invoice document', 1240, 1754, '#ffffff', [
    box(75, 75, 60, 60, '#242424'),
    label('[YOUR BUSINESS]', 165, 95, 940, '#242424', { fontSize: 26 }),
    text('INVOICE', 75, 235, 1090, 112, '#242424', bold),
    rule(75, 403, 1090, '#242424'),
    label('BILL TO', 75, 454, 510, '#686868', { fontSize: 18 }),
    text('[Client name]\n[Client address]\n[Client email]', 75, 502, 530, 28, '#242424', { lineHeight: 1.6 }),
    text('Invoice: [Number]\nIssued: [Date]\nDue: [Date]', 735, 502, 430, 28, '#242424', { ...right, lineHeight: 1.6 }),
    box(75, 718, 1090, 72, '#242424'),
    label('DESCRIPTION', 100, 743, 540, '#ffffff', { fontSize: 18 }),
    label('QTY', 660, 743, 100, '#ffffff', { ...right, fontSize: 18 }),
    label('RATE', 800, 743, 145, '#ffffff', { ...right, fontSize: 18 }),
    label('AMOUNT', 975, 743, 165, '#ffffff', { ...right, fontSize: 18 }),
    ...[0, 1, 2].flatMap(i => {
      const y = 832 + i * 100;
      return [text('[Service / item]', 100, y, 530, 28, '#242424'), text('[Qty]', 655, y, 105, 25, '#242424', right),
        text('[Rate]', 800, y, 145, 25, '#242424', right), text('[Amount]', 975, y, 165, 25, '#242424', right), rule(75, y + 65, 1090, '#dedede')];
    }),
    text('Subtotal\nTax', 735, 1160, 190, 26, '#686868', { lineHeight: 1.8 }),
    text('[Amount]\n[Amount]', 955, 1160, 185, 26, '#242424', { ...right, lineHeight: 1.8 }),
    box(715, 1282, 450, 84, '#f0f0ee'),
    label('TOTAL', 738, 1312, 185, '#242424'),
    text('[Amount]', 945, 1309, 195, 28, '#242424', { ...bold, ...right }),
    label('PAYMENT DETAILS', 75, 1440, 1090, '#686868', { fontSize: 18 }),
    text('[Payment instructions]\n[Currency / payment terms]', 75, 1487, 1090, 27, '#242424', { lineHeight: 1.5 }),
    rule(75, 1635, 1090, '#dedede'),
    text('[Business email]  /  [Phone number]', 75, 1665, 1090, 24, '#686868')
  ]),
  template('Birthday Celebration', 'Events', 'Birthday invitation', 1080, 1500, '#f8c8d5', [
    ...[[95, 145, -20], [900, 228, 23], [90, 1050, 15], [923, 956, -15]].map(([x, y, rotation]) => box(x, y, 22, 72, '#bb443d', { rotation })),
    circle(845, 520, 65, '#f4a92f'), circle(138, 660, 40, '#6d4aa1'),
    icon('star', 825, 750, 96, '#6d4aa1', { rotation: 18 }),
    label('YOU’RE INVITED', 155, 90, 770, '#65394e', centered),
    text('Let’s\ncelebrate!', 135, 213, 810, 110, '#65394e', { ...serif, ...centered, lineHeight: 1.06 }),
    text('[Age]', 195, 530, 690, 244, '#bb443d', { ...display, ...centered }),
    text('[Name]’s birthday', 145, 870, 790, 55, '#65394e', { ...serif, ...centered }),
    box(170, 1010, 740, 350, '#fff2d5', { radius: 32 }),
    label('[DAY / MONTH / YEAR]', 205, 1060, 670, '#65394e', { ...centered, fontSize: 23 }),
    text('[Time]  /  [Venue]\n[Address]', 205, 1130, 670, 29, '#65394e', { ...centered, lineHeight: 1.6 }),
    text('RSVP: [Contact]', 205, 1270, 670, 26, '#65394e', centered),
    label('BRING YOUR PARTY SPIRIT', 150, 1420, 780, '#65394e', { ...centered, fontSize: 17 })
  ]),
  template('Live Webinar', 'Events', 'Webinar invitation', 1080, 1500, '#121d31', [
    ...[0, 1, 2, 3, 4].map(i => box(700 + i * 63, 0, 1, 495, '#2c3b55')),
    ...[0, 1, 2, 3, 4].map(i => rule(700, 65 + i * 82, 315, '#2c3b55')),
    box(65, 65, 257, 60, '#b7f28f', { radius: 30 }),
    label('LIVE WEBINAR', 82, 86, 223, '#121d31', { ...centered, fontSize: 17 }),
    text('[Webinar\ntitle]', 60, 235, 940, 122, '#f0f4fc', { ...bold, lineHeight: 1.08 }),
    text('Fresh perspectives. Practical ideas.', 65, 565, 950, 34, '#aebed7'),
    rule(65, 673, 950, '#41516b'),
    label('YOUR SPEAKER', 65, 730, 740, '#b7f28f'),
    text('[Speaker name]', 65, 785, 760, 54, '#f0f4fc', serif),
    text('[Role / organization]', 65, 865, 760, 29, '#aebed7'),
    icon('chat', 869, 776, 116, '#b7f28f', { iconStyle: 'outline' }),
    label('ON THE AGENDA', 65, 993, 950, '#b7f28f'),
    text('[Topic one]  /  [Topic two]  /  Q&A', 65, 1048, 950, 29, '#f0f4fc'),
    text('[Date]  /  [Time & timezone]', 65, 1166, 950, 32, '#f0f4fc'),
    box(65, 1290, 950, 135, '#b7f28f', { radius: 12 }),
    label('SAVE YOUR SEAT', 100, 1320, 760, '#121d31'),
    text('[Registration URL]', 100, 1366, 760, 27, '#121d31'),
    icon('arrow-right', 898, 1330, 70, '#121d31')
  ]),
  template('Recipe Card', 'Lifestyle', 'Recipe card', 1080, 1500, '#f9f0de', [
    label('FROM THE KITCHEN OF [NAME]', 70, 70, 940, '#6f492f', { fontSize: 18 }),
    text('[Recipe\nname]', 65, 175, 930, 110, '#6f492f', { ...serif, lineHeight: 1.06 }),
    rule(70, 476, 940, '#b99b76'),
    text('Prep: [Time]   /   Cook: [Time]   /   Serves: [#]', 70, 515, 940, 25, '#6f492f'),
    box(70, 619, 352, 594, '#ebdfbf', { radius: 12 }),
    label('INGREDIENTS', 97, 656, 295, '#6f492f', { fontSize: 17 }),
    ...[0, 1, 2, 3, 4].flatMap(i => [circle(99, 735 + i * 82, 8, '#8c703c'), text('[Qty / ingredient]', 122, 723 + i * 82, 273, 24, '#6f492f')]),
    label('THE METHOD', 480, 656, 530, '#6f492f'),
    ...[0, 1, 2].flatMap(i => [label(`0${i + 1}`, 480, 732 + i * 158, 60, '#a7613f'), text('[Add a short\ninstruction here.]', 555, 725 + i * 158, 455, 28, '#6f492f', { lineHeight: 1.4 })]),
    rule(70, 1290, 940, '#b99b76'),
    text('Kitchen notes', 70, 1327, 940, 34, '#6f492f', { ...serif, italic: true }),
    text('[A serving suggestion or useful tip]', 70, 1390, 940, 25, '#8c7359')
  ]),
  template('Weekly Planner', 'Lifestyle', 'Weekly planner', 1600, 1130, '#f5f3ed', [
    text('A little room for everything.', 60, 60, 1480, 71, '#3d514d', serif),
    label('WEEK OF [DATE]', 65, 181, 1465, '#73847a', { fontSize: 22 }),
    ...['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].flatMap((day, i) => {
      const x = 65 + i * 211;
      return [box(x, 275, 195, 535, '#ffffff', { radius: 10 }), box(x, 275, 195, 64, i > 4 ? '#d8dfca' : '#dbe7e1', { radius: 10 }),
        label(day, x + 16, 297, 163, '#3d514d', { ...centered, fontSize: 17 }), text('[Plans]', x + 16, 370, 163, 24, '#73847a'),
        ...[0, 1, 2, 3, 4].map(j => rule(x + 16, 447 + j * 69, 163, '#e1e6df'))];
    }),
    label('THIS WEEK’S PRIORITY', 65, 879, 640, '#3d514d'),
    text('[One thing to focus on]', 65, 935, 640, 29, '#73847a'),
    label('NOTES & LITTLE REMINDERS', 820, 879, 715, '#3d514d'),
    text('[Your notes]', 820, 935, 715, 29, '#73847a'),
    rule(65, 1035, 650, '#c9d2c8'), rule(820, 1035, 715, '#c9d2c8')
  ]),
  template('Fitness Tracker', 'Lifestyle', 'Weekly fitness tracker', 1600, 1130, '#edf1e8', [
    box(0, 0, 1600, 250, '#253e36'),
    text('SHOW UP FOR YOU.', 60, 48, 1480, 99, '#d5f589', display),
    label('WEEK OF [DATE] / YOUR PACE. YOUR PROGRESS.', 65, 183, 1470, '#edf1e8', { fontSize: 21 }),
    box(65, 314, 1470, 62, '#d5f589'),
    label('ACTIVITY', 90, 335, 450, '#253e36', { fontSize: 18 }),
    ...['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => label(day, 580 + i * 132, 335, 110, '#253e36', { ...centered, fontSize: 18 })),
    ...['[Activity one]', '[Activity two]', '[Activity three]', '[Activity four]'].flatMap((activity, row) => {
      const y = 412 + row * 112;
      return [text(activity, 90, y + 9, 450, 32, '#253e36'), ...[0, 1, 2, 3, 4, 5, 6].map(i => box(613 + i * 132, y, 44, 44, 'none', { stroke: '#8da395', strokeWidth: 2, radius: 7 })), rule(65, y + 78, 1470, '#c9d3c7')];
    }),
    label('MY WEEKLY GOAL', 65, 915, 660, '#253e36'),
    text('[A goal that works for you]', 65, 972, 660, 31, '#61776c'),
    label('HOW I FEEL', 875, 915, 660, '#253e36'),
    text('[Energy, wins & reflections]', 875, 972, 660, 31, '#61776c')
  ]),
  template('Lesson Plan', 'Education', 'Lesson plan worksheet', 1240, 1754, '#fbfaf6', [
    box(0, 0, 1240, 245, '#294c68'),
    label('[SCHOOL / TEACHER]', 75, 62, 1090, '#d8ebeb', { fontSize: 22 }),
    text('Lesson plan', 70, 117, 1100, 80, '#ffffff', serif),
    text('Subject: [Subject]   /   Grade: [Grade]', 75, 304, 1090, 29, '#294c68'),
    text('Date: [Date]   /   Duration: [Time]', 75, 365, 1090, 29, '#294c68'),
    ...[
      ['01', 'LEARNING OBJECTIVES', '[What will students know or be able to do?]', 470, 240],
      ['02', 'MATERIALS & PREPARATION', '[Resources, equipment, and setup]', 745, 225],
      ['03', 'ACTIVITIES & TIMING', '[Warm-up]  /  [Main activity]  /  [Wrap-up]', 1005, 300],
      ['04', 'ASSESSMENT & REFLECTION', '[How will you check understanding?]', 1340, 285]
    ].flatMap(([n, title, prompt, y, h]) => [box(75, y, 1090, h, '#eef2ef', { radius: 8 }),
      label(n, 102, y + 30, 65, '#668b8b'), label(title, 182, y + 30, 945, '#294c68', { fontSize: 21 }),
      text(prompt, 105, y + 91, 1030, 27, '#617a83'), rule(105, y + h - 42, 1030, '#c8d7d5')]),
    text('[Additional notes / follow-up]', 75, 1672, 1090, 24, '#617a83')
  ]),
  template('Study Planner', 'Education', 'Study schedule planner', 1240, 1754, '#efedf6', [
    label('ONE SESSION AT A TIME', 75, 70, 1090, '#75628e', { fontSize: 22 }),
    text('Make room\nto learn.', 70, 174, 1090, 115, '#40334f', { ...serif, lineHeight: 1.05 }),
    text('Week of [Date]  /  [Subject or course]', 75, 486, 1090, 30, '#75628e'),
    box(75, 584, 1090, 186, '#dcd4ed', { radius: 16 }),
    label('MY TOP PRIORITY', 110, 622, 1020, '#40334f'),
    text('[What do you want to understand?]', 110, 682, 1020, 33, '#40334f'),
    label('WHEN', 95, 843, 255, '#75628e'),
    label('SUBJECT / TASK', 382, 843, 575, '#75628e'),
    label('DONE', 1022, 843, 125, '#75628e', centered),
    ...[0, 1, 2, 3, 4].flatMap(i => {
      const y = 903 + i * 109;
      return [rule(75, y, 1090, '#c4b9d5'), text('[Day / time]', 95, y + 35, 265, 27, '#40334f'),
        text('[Topic to study]', 382, y + 35, 580, 29, '#40334f'), box(1067, y + 34, 34, 34, 'none', { stroke: '#9585ac', strokeWidth: 2, radius: 5 })];
    }),
    rule(75, 1448, 1090, '#c4b9d5'),
    label('WHAT I LEARNED', 75, 1514, 1090, '#75628e'),
    text('[Key takeaways / questions to revisit]', 75, 1579, 1090, 30, '#40334f'),
    rule(75, 1675, 1090, '#c4b9d5')
  ]),
  template('Classroom Rules', 'Education', 'Classroom rules poster', 1080, 1350, '#fff7df', [
    label('[CLASS / SCHOOL NAME]', 65, 65, 950, '#243d68', centered),
    text('OUR CLASS,\nOUR KIND OF COOL.', 65, 159, 950, 90, '#243d68', { ...display, ...centered, lineHeight: 1.1 }),
    ...[
      ['Listen with care', 'Let others finish their thoughts.', 'chat', '#f6d776'],
      ['Be kind', 'Use words that help and include.', 'heart', '#f2b9b0'],
      ['Stay curious', 'Ask questions. Try new things.', 'star', '#bfccec'],
      ['Look after our space', 'Leave it ready for the next person.', 'home', '#c2dabb'],
      ['Give it a go', 'Progress starts with trying.', 'check', '#f0cd9d']
    ].flatMap(([title, detail, symbol, color], i) => {
      const y = 455 + i * 150;
      return [box(65, y, 950, 128, color, { radius: 16 }), text(`0${i + 1}`, 89, y + 38, 90, 38, '#243d68', bold),
        text(title, 208, y + 25, 675, 33, '#243d68', bold), text(detail, 208, y + 78, 675, 23, '#243d68'), icon(symbol, 923, y + 45, 43, '#243d68')];
    }),
    label('WE LEARN BETTER TOGETHER', 65, 1270, 950, '#243d68', { ...centered, fontSize: 19 })
  ]),
  template('Volunteer Call', 'Community', 'Volunteer recruitment poster', 1080, 1350, '#f2efdf', [
    label('[ORGANIZATION / COMMUNITY GROUP]', 65, 65, 950, '#31584c', { fontSize: 18 }),
    text('A little time.\nA lot of good.', 60, 168, 960, 109, '#31584c', { ...serif, lineHeight: 1.05 }),
    circle(115, 525, 150, '#d6906d'), circle(465, 500, 150, '#caab75'), circle(815, 525, 150, '#9e725b'),
    box(75, 691, 230, 163, '#e1b14f', { radius: 70 }),
    box(425, 666, 230, 188, '#89ab94', { radius: 70 }),
    box(775, 691, 230, 163, '#d88c6e', { radius: 70 }),
    icon('heart', 492, 710, 95, '#31584c'),
    box(65, 910, 950, 85, '#31584c'),
    label('VOLUNTEERS WELCOME', 90, 940, 900, '#f2efdf', { ...centered, fontSize: 23 }),
    text('[Activity / cause]', 65, 1036, 950, 41, '#31584c', serif),
    text('[Date & time]  /  [Location]', 65, 1114, 950, 29, '#617266'),
    rule(65, 1200, 950, '#acb6a6'),
    text('Join us: [Signup URL / contact]', 65, 1240, 950, 28, '#31584c', bold)
  ]),
  template('Fundraiser', 'Community', 'Fundraiser announcement', 1080, 1350, '#922f3f', [
    label('[ORGANIZATION NAME]', 65, 65, 950, '#ffe9d3'),
    text('TOGETHER,\nWE CAN.', 60, 176, 960, 158, '#ffe9d3', display),
    text('Help support [cause].', 65, 572, 950, 48, '#ffe9d3', serif),
    box(65, 704, 950, 213, '#ffe9d3', { radius: 16 }),
    label('OUR FUNDRAISING GOAL', 100, 742, 800, '#922f3f', { fontSize: 19 }),
    text('[Goal amount]', 100, 793, 715, 64, '#922f3f', bold),
    icon('heart', 859, 788, 90, '#922f3f'),
    text('[How contributions will be used]', 65, 976, 950, 30, '#ffe9d3'),
    text('[Event date / campaign deadline]', 65, 1050, 950, 28, '#f0b7ac'),
    rule(65, 1150, 950, '#c7797d'),
    label('TAKE PART', 65, 1192, 950, '#ffe9d3'),
    text('[Donation URL / contact]', 65, 1245, 950, 32, '#ffe9d3')
  ]),
  template('Neighborhood Meetup', 'Community', 'Neighborhood meetup notice', 1080, 1350, '#d4dfed', [
    box(53, 66, 974, 1218, '#b4c2d3', { rotation: -2 }),
    box(65, 65, 950, 1218, '#fff8e7'),
    box(400, 43, 280, 55, '#e2b168', { rotation: -3 }),
    label('[NEIGHBORHOOD NAME]', 110, 155, 860, '#354d69', centered),
    text('Hello,\nneighbour!', 110, 267, 860, 112, '#354d69', { ...serif, ...centered, lineHeight: 1.06 }),
    ...[0, 1, 2].flatMap(i => [box(273 + i * 180, 693, 130, 140, ['#d98668', '#83a38f', '#e1b168'][i]),
      { type: 'triangle', x: 258 + i * 180, y: 606, w: 160, h: 100, fill: '#354d69' }, box(320 + i * 180, 760, 36, 73, '#fff8e7')]),
    text('Good company starts close to home.', 120, 889, 840, 32, '#354d69', { ...serif, ...centered }),
    rule(125, 979, 830, '#c3c9c7'),
    label('[MEETUP / ACTIVITY]', 125, 1020, 830, '#354d69', { ...centered, fontSize: 24 }),
    text('[Date & time]  /  [Meeting place]', 125, 1088, 830, 27, '#354d69', centered),
    text('Say hello: [Contact]', 125, 1170, 830, 26, '#354d69', centered)
  ])
];
