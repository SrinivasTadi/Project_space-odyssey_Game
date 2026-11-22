export function drawPilot(art, phase, facing, dodge, firing) {
  const stride = Math.sin(phase) * 8;
  const bob = Math.abs(stride) * 0.25 - Math.sin(phase * 0.23) * 1.1;
  const lean = dodge ? facing * 12 : facing * Math.abs(stride) * 0.42;

  art.clear();
  art.fillStyle(0x010918, 0.55).fillEllipse(0, 27, 55, 15);
  art.lineStyle(14, 0x132739);
  art.lineBetween(lean - 8, 6 + bob, -12 + stride, 22);
  art.lineBetween(lean + 8, 6 + bob, 12 - stride, 22);
  art.fillStyle(0x88cace).fillRoundedRect(-18 + stride, 20, 13, 7, 3);
  art.fillRoundedRect(6 - stride, 20, 13, 7, 3);
  art.fillStyle(0x205059).fillRoundedRect(lean - 17, -14 + bob, 34, 29, 8);
  art.fillStyle(0x77d6c8).fillRoundedRect(lean - 12, -10 + bob, 24, 12, 4);
  art.fillStyle(0x26414a).fillRoundedRect(lean - 17, 5 + bob, 34, 5, 2);
  art.fillStyle(0x122233).fillRoundedRect(lean - 13, -35 + bob, 26, 26, 10);
  art.fillStyle(0xb88058).fillRoundedRect(lean - 9, -29 + bob, 18, 16, 6);
  art.fillStyle(0x171822).fillRoundedRect(lean - 10, -33 + bob, 20, 9, 4);
  art.fillStyle(0x8debf2).fillRoundedRect(lean - 10, -25 + bob, 20, 4, 2);
  art.lineStyle(9, 0x417987).lineBetween(lean - 15, -9 + bob, lean - 19, 4 + bob - stride * 0.25);
  art.lineBetween(lean + 14, -9 + bob, lean + 20, 3 + bob + stride * 0.25);
  art.fillStyle(0x15263a).fillRoundedRect(lean + facing * 19 - 5, -11 + bob, 11, 21, 3);
  if (firing) art.fillStyle(0xd2ffbd, 0.85).fillCircle(lean + facing * 19, -14 + bob, 5);
}
