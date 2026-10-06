# Lahore Food Street 3D — V5 Camera + Character Pass

React + Vite + React Three Fiber + Three.js scroll-driven 3D experience through Fort Road Food Street, Roshnai Gate, Hazuri Bagh, Iqbal Tomb, Badshahi Mosque and Lahore Fort.

## V5 changes

- replaced the visible box-built protagonist with a **skinned humanoid GLB pipeline**
- added compatible idle / walk animation handling
- added camera collision / obstruction resolution
- rebuilt the Iqbal camera composition so the tomb roof no longer blocks the screen
- moved the rooftop reveal camera out of large roof geometry
- added a **C-key camera debug mode** and `window.__LAHORE_CAMERA_DEBUG__`
- made the Rangeela rickshaw scroll-driven with wheel rotation and a dedicated lane
- added shot-specific UI safe areas
- added subtle aged-plaster variation to Food Street façades
- retained the “Lahore! Lahore aey!” loader, real staircase route and branch to Badshahi Mosque / Shahi Qila

## Character asset note

The V5 controller loads the Three.js example `Michelle.glb` as a temporary skinned civilian woman and uses compatible Xbot walking/idle animation clips. This removes the primitive cube-person immediately while keeping the code ready for a custom Gen-Z Pakistani woman GLB later.

The final custom character should preserve the same controller contract and Mixamo-style rig naming if possible.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Camera debug

Press **C** while the 3D scene is focused.

Red sphere: requested camera position  
Green sphere: collision-corrected camera position  
Blue sphere: look-at target  
White line: final target-to-camera ray

For text diagnostics in DevTools:

```js
window.__LAHORE_CAMERA_DEBUG__
```

See `AUDIT.md` for the issues fixed and remaining production-grade upgrades.
