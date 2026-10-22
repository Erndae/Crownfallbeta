/* Shared, hand-drawn stop emblems. Identical shapes in maps, cards and keys. */
'use strict';
const JOURNEY_STOP_LOGOS={
 fight:'M-15-17L11 9M-17-12L-12-17M5 12L12 5M10 10L17 17M-15 17L11-9M-17 12L-12 17M5-12L12-5M10-10L17-17',
 boss:'M-18-10L-10-3L0-16L10-3L18-10L14 12H-14ZM-14 18H14',
 supply:'M-17-5V17H17V-5M-20-5L-15-16H15L20-5ZM-20-5Q-15 3-10-5Q-5 3 0-5Q5 3 10-5Q15 3 20-5M-5 17V5H7V17',
 cache:'M-17-5V15H17V-5ZM-17-5V-10Q-17-17-10-17H10Q17-17 17-10V-5M-17 1H-4M4 1H17M-4-3H4V6H-4Z',
 safer:'M0-19L16-12V0Q16 11 0 20Q-16 11-16 0V-12ZM-8 0L-2 6L9-6',
 risky:'M0-19L20 16H-20ZM0-7V4M0 10V11',
 road:'M0-20V20M-16-13H12L19-7L12-1H-16ZM0 5H-11L-18 11L-11 17H0',
 entry:'M-18 18V-17H-7V18M7 18V-17H18V18M-18-9H18M-2-17V-9M2-17V-9',
 safehouse:'M-20-1L0-18L20-1M-15-4V18H15V-4M-5 18V4H5V18'
};
function journeyStopLogo(type,map=false){
 const key=JOURNEY_STOP_LOGOS[type]?type:'road';
 return `<svg xmlns="http://www.w3.org/2000/svg" class="stop-logo" data-stop-logo="${key}" viewBox="-24 -24 48 48" width="48" height="48" ${map?'x="-24" y="-24"':''} aria-hidden="true" focusable="false"><path d="${JOURNEY_STOP_LOGOS[key]}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
