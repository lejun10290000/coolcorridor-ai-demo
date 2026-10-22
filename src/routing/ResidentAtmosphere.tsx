/** Decorative, GPU-friendly atmosphere. It never enters the map's evidence layer. */
export function ResidentAtmosphere(){
  return <div className="ultimate-atmosphere" aria-hidden="true">
    <div className="ultimate-nebula ultimate-nebula-a"/>
    <div className="ultimate-nebula ultimate-nebula-b"/>
    <div className="ultimate-nebula ultimate-nebula-c"/>
    <div className="ultimate-starfield"/>
    <svg className="ultimate-rivers" viewBox="0 0 1600 1080" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id="ultimate-river-1" x1="0" x2="1" y1="0" y2=".6"><stop stopColor="#4829b9" stopOpacity="0"/><stop offset=".35" stopColor="#9b45f9"/><stop offset=".7" stopColor="#d370ff"/><stop offset="1" stopColor="#7336e9" stopOpacity="0"/></linearGradient>
        <linearGradient id="ultimate-river-2" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#b256ff" stopOpacity="0"/><stop offset=".44" stopColor="#9349f5"/><stop offset=".7" stopColor="#f78cff"/><stop offset="1" stopColor="#6b38df" stopOpacity="0"/></linearGradient>
      </defs>
      <g className="ultimate-river ultimate-river-a"><path className="ultimate-river-haze" d="M-130 128 C 170 -88, 361 62, 571 110 S 924 72, 1102 -95" stroke="url(#ultimate-river-1)"/><path className="ultimate-river-thread" d="M-130 128 C 170 -88, 361 62, 571 110 S 924 72, 1102 -95"/><path className="ultimate-river-traveller" d="M-130 128 C 170 -88, 361 62, 571 110 S 924 72, 1102 -95"/></g>
      <g className="ultimate-river ultimate-river-b"><path className="ultimate-river-haze" d="M902 -90 C 1030 215, 1265 70, 1510 210 S 1708 375, 1790 384" stroke="url(#ultimate-river-2)"/><path className="ultimate-river-thread" d="M902 -90 C 1030 215, 1265 70, 1510 210 S 1708 375, 1790 384"/><path className="ultimate-river-traveller" d="M902 -90 C 1030 215, 1265 70, 1510 210 S 1708 375, 1790 384"/></g>
      <g className="ultimate-river ultimate-river-c"><path className="ultimate-river-haze" d="M-160 823 C 170 567, 302 967, 629 775 S 1086 592, 1672 929" stroke="url(#ultimate-river-1)"/><path className="ultimate-river-thread" d="M-160 823 C 170 567, 302 967, 629 775 S 1086 592, 1672 929"/><path className="ultimate-river-traveller" d="M-160 823 C 170 567, 302 967, 629 775 S 1086 592, 1672 929"/></g>
    </svg>
    <div className="ultimate-orbit ultimate-orbit-a"/>
    <div className="ultimate-orbit ultimate-orbit-b"/>
  </div>
}
