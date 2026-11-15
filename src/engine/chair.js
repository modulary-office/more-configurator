/* A task chair shown next to tables and counters for scale only (it is never part of the order).
   Ribbed sling seat and back, chrome side frame and arm loops, chrome five-star base on castors.
   The chair faces −z (its back is at +z), so at the +z side of a table it needs no rotation.
   Colour: black, white or camel – picked to suit the table (see chairTone). */
const TONES = { black: 0x1a1a1b, white: 0xf1efea, camel: 0xb9824f };
const lum = hex => { let n = parseInt(String(hex || '').replace('#', ''), 16); if (Number.isNaN(n)) n = 0x888888; return (.299 * (n >> 16 & 255) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255; };
/* dark top → camel; light top → black, or camel when the frame is light too; mid tones (wood) → black, or white on a white frame */
export function chairTone(topHex, frameHex) {
  const t = lum(topHex), f = lum(frameHex);
  if (t < .4) return 'camel';
  if (t > .74) return f > .7 ? 'camel' : 'black';
  return f > .7 ? 'white' : 'black';
}
let mats = null;
export function makeChair(THREE, tone = 'black') {
  if (!mats) mats = {
    chrome: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: .22, metalness: .95, envMapIntensity: 1.1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151516, roughness: .6, metalness: .2 }),
    pad: {}
  };
  const pad = mats.pad[tone] || (mats.pad[tone] = new THREE.MeshStandardMaterial({ color: TONES[tone] || TONES.black, roughness: .62, metalness: .02 }));
  const g = new THREE.Group(), mk = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const SH = .47, W = .5;
  /* base: five spokes, castors, gas column */
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + .3, sp = mk(new THREE.BoxGeometry(.045, .022, .3), mats.chrome, Math.sin(a) * .15, .085, Math.cos(a) * .15); sp.rotation.y = a;
    const c = mk(new THREE.CylinderGeometry(.027, .027, .03, 12), mats.dark, Math.sin(a) * .29, .028, Math.cos(a) * .29); c.rotation.z = Math.PI / 2; c.rotation.y = a;
  }
  mk(new THREE.CylinderGeometry(.03, .04, .05, 16), mats.chrome, 0, .1, 0);
  mk(new THREE.CylinderGeometry(.022, .022, SH - .16, 14), mats.chrome, 0, .1 + (SH - .16) / 2, 0);
  mk(new THREE.BoxGeometry(.2, .035, .22), mats.dark, 0, SH - .055, .02);
  /* seat and back: thin ribbed slings between two chrome rails */
  const rib = (w, h, d, x, y, z, rx) => { const m = mk(new THREE.BoxGeometry(w, h, d), pad, x, y, z); m.rotation.x = rx; return m; };
  const seatD = .46, seatZ = -.01;
  for (let i = 0; i < 6; i++) rib(W - .03, .028, seatD / 6 - .004, 0, SH - .012 + (i / 5) * .012, seatZ - seatD / 2 + (i + .5) * seatD / 6, -.03);
  const backH = .5, by0 = SH + .03, tilt = .16, bz0 = seatZ + seatD / 2 - .02;
  for (let i = 0; i < 9; i++) { const t = (i + .5) / 9, y = by0 + t * backH * Math.cos(tilt), z = bz0 + t * backH * Math.sin(tilt); rib(W - .03, backH / 9 - .004, .03, 0, y, z, tilt); }
  /* side rails: seat rail + back rail on each side, and an arm loop */
  [-1, 1].forEach(s => {
    const x = s * (W / 2 - .008);
    const sr = mk(new THREE.BoxGeometry(.016, .016, seatD), mats.chrome, x, SH - .008, seatZ); sr.rotation.x = -.03;
    const br = mk(new THREE.BoxGeometry(.016, backH + .03, .016), mats.chrome, x, by0 + backH / 2 * Math.cos(tilt), bz0 + backH / 2 * Math.sin(tilt)); br.rotation.x = tilt;
    /* arm: up from the seat rail, forward, with a pad on top */
    const ax = s * (W / 2 + .02), ay = SH + .2;
    mk(new THREE.BoxGeometry(.014, .2, .02), mats.chrome, ax, SH + .1, seatZ + .16);
    mk(new THREE.BoxGeometry(.014, .02, .3), mats.chrome, ax, ay, seatZ + .02);
    mk(new THREE.BoxGeometry(.014, .11, .02), mats.chrome, ax, SH + .15, seatZ - .12).rotation.x = .5;
    mk(new THREE.BoxGeometry(.04, .014, .22), pad, ax, ay + .016, seatZ + .03);
    mk(new THREE.BoxGeometry(.05, .014, .02), mats.chrome, s * (W / 2 + .004), SH + .01, seatZ + .16);
  });
  g.userData.scaleOnly = true;
  return g;
}
