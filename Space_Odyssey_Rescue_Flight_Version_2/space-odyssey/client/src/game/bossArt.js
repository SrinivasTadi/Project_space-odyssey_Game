const shadow = 0x111825;
const darkMetal = 0x263142;

function plate(art, fill, edge, corners) {
  const [first, ...rest] = corners;
  art.fillStyle(fill).lineStyle(2, edge, 0.9).beginPath();
  art.moveTo(...first);
  for (const corner of rest) art.lineTo(...corner);
  art.closePath().fillPath().strokePath();
}

export const bossArt = {
  jupiter(art, { armor, highlight }) {
    // A broad-winged storm raptor with a hooked beak and feathered lightning conductors.
    plate(art, armor, highlight, [[-76, -40],[-48, -29],[-24, -17],[0, -21],[24, -17],[48, -29],
      [76, -40],[63, -12],[50, 2],[61, -2],[44, 25],[25, 30],[13, 45],[0, 36],[-13, 45],[-25, 30],
      [-44, 25],[-61, -2],[-50, 2],[-63, -12]]);
    art.lineStyle(3, 0xb5adff, 0.88);
    art.lineBetween(-60, -24, -32, 7).lineBetween(-53, -7, -28, 17)
      .lineBetween(60, -24, 32, 7).lineBetween(53, -7, 28, 17);
    plate(art, 0x34275e, highlight, [[-23, -20],[0, -37],[23, -20],[22, 6],[10, 20],[-10, 20],[-22, 6]]);
    art.fillStyle(highlight).fillTriangle(-16, -11, -5, -7, -16, -2).fillTriangle(16, -11, 5, -7, 16, -2);
    art.fillStyle(0xf7d58e).fillTriangle(-8, 3, 8, 3, 0, 19);
  },

  saturn(art, { armor, highlight }) {
    // A plated scarab with pincers and a wide ring cast around its shell.
    art.lineStyle(8, 0x795334, 0.85).strokeEllipse(0, 7, 151, 47);
    art.lineStyle(2, highlight, 0.95).strokeEllipse(0, 7, 151, 47);
    art.fillStyle(0x593a26).fillEllipse(0, -2, 91, 99);
    art.fillStyle(armor).fillEllipse(0, -7, 80, 89);
    art.lineStyle(2, highlight, 0.9).strokeEllipse(0, -7, 80, 89);
    art.lineStyle(3, 0x704728).lineBetween(0, -48, 0, 17);
    art.lineBetween(-34, -14, -4, 1).lineBetween(34, -14, 4, 1);
    plate(art, armor, highlight, [[-32, 20],[-40, 40],[-34, 51],[-20, 58],[-14, 50],[-25, 46],[-19, 30]]);
    plate(art, armor, highlight, [[32, 20],[40, 40],[34, 51],[20, 58],[14, 50],[25, 46],[19, 30]]);
    art.fillStyle(shadow).fillRoundedRect(-22, 13, 44, 25, 8);
    art.fillStyle(highlight).fillCircle(-10, 24, 4).fillCircle(10, 24, 4);
  },

  uranus(art, { armor, highlight }) {
    // An ice golem with asymmetric facets and detached, heavy gauntlets.
    plate(art, 0x2c617e, highlight, [[-47, -9],[-28, -38],[-13, -30],[7, -54],[36, -36],[50, -9],
      [38, 33],[21, 48],[-21, 48],[-40, 28]]);
    plate(art, armor, highlight, [[-62, -2],[-44, 3],[-37, 24],[-44, 45],[-65, 39],[-76, 21]]);
    plate(art, armor, highlight, [[62, -2],[44, 3],[37, 24],[44, 45],[65, 39],[76, 21]]);
    art.fillStyle(0x88dae7).fillTriangle(-30, -28, 7, -50, -4, -11);
    art.fillStyle(0x3f8ea5).fillTriangle(8, -50, 41, -8, 8, -11);
    art.fillStyle(0x76c6dd).fillTriangle(-31, 8, -3, -8, -16, 38);
    art.fillStyle(0x182943).fillRoundedRect(-24, -6, 48, 19, 5);
    art.fillStyle(highlight).fillRect(-18, 0, 12, 5).fillRect(6, 0, 12, 5);
  },

  neptune(art, { armor, highlight }) {
    // A deep-sea leviathan with a long tail, sweep fins and a bioluminescent jaw.
    plate(art, 0x293681, highlight, [[-77, -43],[-57, -22],[-36, -28],[-29, -43],[-11, -23],
      [22, -28],[47, -20],[67, -6],[73, 9],[59, 27],[39, 35],[17, 30],[-9, 53],[-20, 46],
      [-19, 21],[-41, 10],[-63, 23],[-58, -2]]);
    plate(art, armor, highlight, [[-38, -12],[-5, -24],[23, -21],[55, -10],[68, 8],[49, 24],
      [14, 23],[-4, 43],[-9, 16],[-30, 7]]);
    art.lineStyle(3, 0x7fdcff).lineBetween(-27, -4, 5, 4).lineBetween(5, 4, 24, 1);
    art.fillStyle(shadow).fillRoundedRect(29, 10, 33, 9, 4);
    art.fillStyle(highlight).fillEllipse(46, -5, 14, 7);
    art.fillTriangle(37, 13, 43, 13, 40, 20).fillTriangle(48, 13, 54, 13, 51, 20);
  },

  venus(art, { armor, highlight }) {
    // A refinery crawler with six jointed legs, reagent tanks and a respirator.
    for (const side of [-1, 1]) {
      art.lineStyle(10, 0x74783b).lineBetween(20 * side, -19, 51 * side, -39)
        .lineBetween(51 * side, -39, 69 * side, -30)
        .lineBetween(24 * side, 0, 57 * side, -2)
        .lineBetween(57 * side, -2, 74 * side, 14)
        .lineBetween(22 * side, 20, 51 * side, 29)
        .lineBetween(51 * side, 29, 60 * side, 49);
      art.fillStyle(highlight).fillCircle(51 * side,-39, 4).fillCircle(57 * side,-2, 4).fillCircle(51 * side,29, 4);
    }
    art.fillStyle(armor).fillRoundedRect(-34, -44, 68, 82, 20);
    art.lineStyle(2, highlight, 0.9).strokeRoundedRect(-34, -44, 68, 82, 20);
    art.fillStyle(0xdce96c).fillRoundedRect(-24, -34, 16, 43, 7).fillRoundedRect(8, -34, 16, 43, 7);
    art.fillStyle(shadow).fillRoundedRect(-27, 11, 54, 36, 11);
    art.fillStyle(highlight).fillCircle(-10, 20, 4).fillCircle(10, 20, 4);
    art.fillStyle(0x979a67).fillRoundedRect(-12, 31, 24, 8, 3);
  },

  mercury(art, { armor, highlight }) {
    // A lance-shaped solar interceptor with folded blade fins and hot engine vents.
    plate(art, armor, highlight, [[0, -57],[16, -34],[24, -8],[51, 4],[57, 43],[36, 32],[20, 44],
      [10, 34],[0, 52],[-10, 34],[-20, 44],[-36, 32],[-57, 43],[-51, 4],[-24, -8],[-16, -34]]);
    plate(art, 0x6e2632, highlight, [[0, -40],[15, -16],[13, 9],[0, 24],[-13, 9],[-15, -16]]);
    art.fillStyle(0xffe3a0).fillTriangle(-8, -15, 8, -15, 0, -29);
    art.lineStyle(3, highlight).lineBetween(-42, 11, -31, 28).lineBetween(42, 11, 31, 28);
    art.fillStyle(highlight).fillTriangle(-11, 35, 11, 35, 0, 56);
  },

  earthDefense(art, { armor, highlight }) {
    // The Architect wears a hooded mantle with a visor and two remote sentries.
    plate(art, shadow, armor, [[-31, -22],[0, -53],[31, -22],[37, -4],[59, 15],[45, 39],[26, 47],
      [12, 55],[-10, 51],[-35, 55],[-55, 24],[-39, -3]]);
    plate(art, darkMetal, armor, [[-31, -24],[0, -46],[31, -24],[24, 4],[12, 20],[-12, 20],[-24, 4]]);
    plate(art, 0x0c1018, armor, [[-17, -19],[17, -19],[19, -1],[11, 11],[-11, 11],[-19, -1]]);
    art.fillStyle(highlight).fillRoundedRect(-14, -12, 28, 5, 2);
    art.lineStyle(2, highlight, 0.9).lineBetween(0, 21, 0, 47);
    for (const side of [-1, 1]) {
      art.fillStyle(armor).fillRoundedRect(62 * side - 7, -23, 14, 26, 5);
      art.fillStyle(highlight).fillRoundedRect(62 * side - 3, -17, 6, 14, 2);
    }
  }
};
