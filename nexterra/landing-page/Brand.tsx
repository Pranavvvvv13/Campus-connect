/** Vector reconstruction of the supplied NexTerra brand artwork. */
export function BrandMark(){
 return <svg className="nt-brand-mark" viewBox="0 0 100 108" aria-hidden="true">
  <path className="nt-brand-ink" d="M5 101V22Q5 17 10 20L75 69Q79 72 79 67V31H91Q97 31 97 37V103Q97 108 93 105L29 55Q23 51 23 58V85Z"/>
  <path className="nt-brand-green" d="M9 107L45 78L61 96L66 92L84 107L66 98L63 103L45 88L26 107Z"/>
  <g className="nt-brand-radio" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M78 12Q85 6 92 12"/><path d="M74 7Q85-2 96 7"/></g>
  <circle className="nt-brand-green" cx="85" cy="19" r="3.5"/>
 </svg>;
}
export function BrandWordmark(){
 return <svg className="nt-brand-wordmark" viewBox="0 0 660 60" role="img" aria-label="NexTerra">
  <g fill="none" strokeWidth="6.5" strokeLinecap="square" strokeLinejoin="miter">
   <g className="nt-word-ink"><path d="M5 53V7L57 53V7"/><path d="M100 7H145M100 30H145M100 53H145"/><path d="M190 7L235 53M235 7L190 53"/></g>
   <g className="nt-word-green"><path d="M276 7H322M299 7V53"/><path d="M361 7H407M361 30H405M361 30V53H407"/><path d="M448 7H479Q493 7 493 19Q493 31 479 31H448V53M467 31L493 53"/><path d="M533 7H564Q578 7 578 19Q578 31 564 31H533V53M552 31L578 53"/><path d="M615 53L635 7H638L659 53"/></g>
  </g>
 </svg>;
}
export default function Brand(){return <><BrandMark/><BrandWordmark/></>;}
