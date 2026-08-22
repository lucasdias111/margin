/**
 * margin's motion system.
 *
 *  - `motion`      — duration/easing tokens and reduced-motion helpers
 *  - `transitions` — `svelte/transition` functions for mount & unmount
 *  - `actions`     — `use:` actions for input-driven motion
 *
 * The matching CSS custom properties and helper classes live in `motion.css`,
 * imported once from `app.css`.
 */

export {
  BEZIER,
  CSS_EASING,
  DURATION,
  EASING,
  cubicBezier,
  motionDistance,
  motionDuration,
  onReducedMotionChange,
  prefersReducedMotion,
  resolveDuration,
  type BezierToken,
  type DurationToken
} from './motion'

export {
  backdrop,
  listItemIn,
  listItemOut,
  modalIn,
  popIn,
  riseIn,
  scaleFade,
  slide,
  stepIn,
  toastIn,
  toastOut,
  viewIn,
  viewOut,
  type RiseInParams,
  type ScaleFadeParams,
  type SlideParams
} from './transitions'

export {
  autoHeight,
  hoverLift,
  pressable,
  slidingIndicator,
  stagger,
  type AutoHeightParams,
  type HoverLiftParams,
  type PressableParams,
  type SlidingIndicatorParams,
  type StaggerParams
} from './actions'
