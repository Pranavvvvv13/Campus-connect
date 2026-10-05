# NexTerra landing page

Source: `nexterra/landing-page/NexTerra.tsx` and `landing.css`.
Route: `/landing-page` (the existing CampusConnect home page is preserved).

Run `node node_modules/next/dist/bin/next dev --port 5186`, then open `http://localhost:5186/landing-page`. Port 5173 is used by a separate ConnecTerra app on this machine.

The procedural Three.js scene uses terrain geometry, cinematic lighting, soft shadows, fog, sensor markers, capped pixel density, and frame-rate-independent scroll interpolation. IntersectionObserver triggers the brand and delayed tagline reveal. Mobile navigation, native accessible dialogs, reduced motion, and a WebGL fallback are included.

Sensor readings and coordinates are illustrative. Contact buttons currently open an informational dialog; connect an actual inquiry destination before launch. No external model assets or API credentials are needed. Actual frame rate depends on the device; 60 fps is a design target, not a measured guarantee.


Interface motion includes a looping telemetry strip, waveform and AI signal diagrams, radar animation, a brand light sweep, and mission-section orbits. The footer pause control pauses decorative CSS animation; reduced-motion preferences disable it automatically.

Brand identity: Brand.tsx contains a scalable vector reconstruction of the supplied logo and geometric wordmark, rather than an identified font file. Light theme uses charcoal #293239 and forest green #426638; dark theme uses accessible lighter counterparts. Original brand tagline: Predicting Nature. Protecting Lives.
