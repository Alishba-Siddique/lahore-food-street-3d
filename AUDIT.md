# V5 Visual / Technical Audit

This audit was created from the V4 source and the supplied screenshots before the V5 fixes.

## P0 camera failures

- **Iqbal Tomb composition:** the camera was positioned behind / above the tomb mass at the Iqbal section, allowing the roof and nearby geometry to dominate the frame.
- **Full-screen orange polygon:** the camera path could interpolate directly through large rooftop / architectural meshes because it used raw Vector3 keyframes without obstruction handling.
- **No camera collision:** there was no safe-distance or obstruction resolver between the intended focal target and desired camera position.
- **UI overlap:** chapter cards were positioned by generic odd/even layout rather than shot-specific safe areas.

### V5 fix

- New `src/camera/CameraDirector.jsx`.
- New `src/camera/collision.js` with conservative architectural AABB blockers.
- Camera positions are resolved against blockers every frame.
- Iqbal shot is moved to the front of the tomb.
- Rooftop reveal camera is moved above/outside the roof mass.
- Press **C** to toggle camera debug markers. Runtime diagnostic data is also exposed at `window.__LAHORE_CAMERA_DEBUG__`.

## P0 protagonist quality

V4 protagonist was built from visible `BoxGeometry` / `SphereGeometry` body parts and therefore always read as a blockout.

### V5 fix

- Removed the primitive visible body.
- New `src/character/Protagonist.jsx` loads a skinned humanoid GLB (`Michelle.glb`) and uses compatible Mixamo-style `Xbot.glb` idle/walk clips.
- Root translation is stripped so the scroll path controls world movement.
- Scroll path lives in `src/character/path.js` and includes the real rooftop elevation changes.
- The final project is now ready for replacing this temporary rig with a custom Pakistani Gen-Z woman GLB without rewriting the controller.

## P0 traffic overlap

V4 rickshaw used clock time independent of scroll, so it could arrive at the staircase / protagonist at arbitrary times.

### V5 fix

- Rickshaw position is driven by scroll progress.
- It stays in the right lane.
- It leaves the active street sequence before the staircase section.
- Wheel rotation now follows distance travelled.

## P1 material quality

V4 Food Street buildings used large flat-color meshes.

### V5 fix

- Hero Food Street plaster now receives generated aged-plaster variation including subtle dust, repaired patches, hairline cracks and base grime.
- This is still a procedural browser material, not the final photogrammetry/PBR texture set. Hero landmark GLBs and authored PBR materials remain the next fidelity tier.

## Remaining high-value upgrades

1. Replace temporary Michelle rig with a bespoke realistic Pakistani Gen-Z woman GLB.
2. Replace the procedural rickshaw shell with a modeled Pakistani rickshaw GLB.
3. Author PBR hero assets for Badshahi Mosque, Alamgiri Gate, Roshnai Gate and Iqbal Tomb in Blender.
4. Add baked AO/lightmaps or SSAO/contact shadows for stronger grounding.
5. Add authored Urdu signage and scanned / photographed Lahore surface references.
6. Run screenshot regression at 0/10/20/.../100% after the full dependency install is available.
