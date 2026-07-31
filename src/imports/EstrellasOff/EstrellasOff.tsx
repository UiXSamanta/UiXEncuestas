import svgPaths from "./svg-t1cbbhxfxl";

function Text() {
  return (
    <div className="bg-[#f3f4f6] relative rounded-[16777200px] shrink-0 size-[28px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <p className="font-['Inter:Bold',sans-serif] font-bold leading-[18px] not-italic relative shrink-0 text-[#6a7282] text-[12px] whitespace-nowrap">13</p>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[9px] size-[12px] top-[5.25px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Icon">
          <path d={svgPaths.p2471b880} id="Vector" stroke="var(--stroke-0, #FDC700)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.5 4.5H10.5" id="Vector_2" stroke="var(--stroke-0, #FDC700)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.5 7.5H10.5" id="Vector_3" stroke="var(--stroke-0, #FDC700)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.5 1.5V10.5" id="Vector_4" stroke="var(--stroke-0, #FDC700)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 1.5V10.5" id="Vector_5" stroke="var(--stroke-0, #FDC700)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Text1() {
  return (
    <div className="bg-[rgba(253,199,0,0.1)] h-[22.5px] relative rounded-[16777200px] shrink-0 w-[105.336px]" data-name="Text">
      <div aria-hidden="true" className="absolute border border-[rgba(253,199,0,0.2)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon />
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16.5px] left-[27px] not-italic text-[#fdc700] text-[11px] top-[3.5px] tracking-[0.0645px] whitespace-nowrap">Score Matrix</p>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="flex-[640.18_0_0] h-[19.25px] min-w-px relative" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.25px] left-0 not-italic text-[#101828] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">Nueva pregunta score-matrix (Copia)</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-0 size-[14px] top-[2px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p317fdd80} id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p31c78b80} id="Vector_2" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p3625bb80} id="Vector_3" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p2ca18b80} id="Vector_4" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Text2() {
  return (
    <div className="flex-[1_0_0] h-[18px] min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon1 />
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-[18px] not-italic text-[#99a1af] text-[12px] top-px whitespace-nowrap">1 / 7 resp.</p>
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M12 10L8 6L4 10" id="Vector" stroke="var(--stroke-0, #99A1AF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[18px] relative shrink-0 w-[100.484px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[12px] items-center relative size-full">
        <Text2 />
        <Icon2 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[60px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[24px] py-[16px] relative size-full">
          <Text />
          <Text1 />
          <Heading />
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="h-[21px] relative shrink-0 w-[33.852px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-0 not-italic text-[#364153] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">Fila 1</p>
      </div>
    </div>
  );
}

function Icon3() {
  return <div className="relative shrink-0 size-[16px]" data-name="Icon" />;
}

function Container5() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[63.461px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Icon3 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex h-[21px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading1 />
      <Container5 />
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Malo</p>
      </div>
    </div>
  );
}

function Container8() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container7() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container8 />
        </div>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text3 />
      <Container7 />
      <Text4 />
      <Text5 />
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Bajo</p>
      </div>
    </div>
  );
}

function Container10() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container9() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Text7() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow1() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text6 />
      <Container9 />
      <Text7 />
      <Text8 />
    </div>
  );
}

function Text9() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Promedio</p>
      </div>
    </div>
  );
}

function Container12() {
  return <div className="bg-[#155dfc] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container11() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Container12 />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24.05px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">1</p>
      </div>
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.59px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">100%</p>
      </div>
    </div>
  );
}

function BarRow2() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text9 />
      <Container11 />
      <Text10 />
      <Text11 />
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Alto</p>
      </div>
    </div>
  );
}

function Container14() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container13() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container14 />
        </div>
      </div>
    </div>
  );
}

function Text13() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text14() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow3() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text12 />
      <Container13 />
      <Text13 />
      <Text14 />
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Buenísimo</p>
      </div>
    </div>
  );
}

function Container16() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container15() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container16 />
        </div>
      </div>
    </div>
  );
}

function Text16() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text17() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow4() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text15 />
      <Container15 />
      <Text16 />
      <Text17 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[129.5px] items-start relative shrink-0 w-full" data-name="Container">
      <BarRow />
      <BarRow1 />
      <BarRow2 />
      <BarRow3 />
      <BarRow4 />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-[179.5px] items-start min-w-px pb-px relative" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
      <Container4 />
      <Container6 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="relative size-[96px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96 96">
        <g clipPath="url(#clip0_521_8210)" id="Icon">
          <path d={svgPaths.p30d75d80} id="Vector" stroke="var(--stroke-0, #E5E7EB)" strokeWidth="8.4" />
          <path d={svgPaths.p2c6b4800} id="Ellipse 1795" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeWidth="8.4" />
        </g>
        <defs>
          <clipPath id="clip0_521_8210">
            <rect fill="white" height="96" width="96" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text18() {
  return (
    <div className="h-[28px] relative shrink-0 w-[27.742px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#101828] text-[18px] top-0 tracking-[-0.4395px] whitespace-nowrap">3.0</p>
      </div>
    </div>
  );
}

function Text19() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.398px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[#6a7282] text-[10px] top-[0.5px] tracking-[0.1172px] whitespace-nowrap">/ 5</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 py-[26.5px] size-[96px] top-0" data-name="Container">
      <Text18 />
      <Text19 />
    </div>
  );
}

function ScoreGauge() {
  return (
    <div className="absolute left-0 size-[96px] top-[12.5px]" data-name="ScoreGauge">
      <div className="absolute flex items-center justify-center left-0 size-[96px] top-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-90 flex-none">
          <Icon4 />
        </div>
      </div>
      <Container18 />
    </div>
  );
}

function Text20() {
  return (
    <div className="absolute h-[16.5px] left-[23.06px] top-[116.5px] w-[49.867px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[25px] not-italic text-[#99a1af] text-[11px] text-center top-[0.5px] tracking-[0.0645px] whitespace-nowrap">Promedio</p>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[145.5px] relative shrink-0 w-[96px]" data-name="Container">
      <ScoreGauge />
      <Text20 />
    </div>
  );
}

function Score() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="score">
      <Container3 />
      <Container17 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="h-[21px] relative shrink-0 w-[35.727px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-0 not-italic text-[#364153] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">Fila 2</p>
      </div>
    </div>
  );
}

function Icon5() {
  return <div className="relative shrink-0 size-[16px]" data-name="Icon" />;
}

function Text21() {
  return <div className="flex-[1_0_0] h-[19.5px] min-w-px relative" data-name="Text" />;
}

function Container21() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[63.492px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon5 />
        <Text21 />
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex h-[21px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading2 />
      <Container21 />
    </div>
  );
}

function Text22() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Malo</p>
      </div>
    </div>
  );
}

function Container24() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container23() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container24 />
        </div>
      </div>
    </div>
  );
}

function Text23() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text24() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow5() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text22 />
      <Container23 />
      <Text23 />
      <Text24 />
    </div>
  );
}

function Text25() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Bajo</p>
      </div>
    </div>
  );
}

function Container26() {
  return <div className="bg-[#155dfc] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container25() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Container26 />
      </div>
    </div>
  );
}

function Text26() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24.05px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">1</p>
      </div>
    </div>
  );
}

function Text27() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.59px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">100%</p>
      </div>
    </div>
  );
}

function BarRow6() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text25 />
      <Container25 />
      <Text26 />
      <Text27 />
    </div>
  );
}

function Text28() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Promedio</p>
      </div>
    </div>
  );
}

function Container28() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container27() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container28 />
        </div>
      </div>
    </div>
  );
}

function Text29() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text30() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow7() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text28 />
      <Container27 />
      <Text29 />
      <Text30 />
    </div>
  );
}

function Text31() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Alto</p>
      </div>
    </div>
  );
}

function Container30() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container29() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container30 />
        </div>
      </div>
    </div>
  );
}

function Text32() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow8() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text31 />
      <Container29 />
      <Text32 />
      <Text33 />
    </div>
  );
}

function Text34() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Buenísimo</p>
      </div>
    </div>
  );
}

function Container32() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container31() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container32 />
        </div>
      </div>
    </div>
  );
}

function Text35() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text36() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow9() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text34 />
      <Container31 />
      <Text35 />
      <Text36 />
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[129.5px] items-start relative shrink-0 w-full" data-name="Container">
      <BarRow5 />
      <BarRow6 />
      <BarRow7 />
      <BarRow8 />
      <BarRow9 />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-[179.5px] items-start min-w-px pb-px relative" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-b border-solid inset-0 pointer-events-none" />
      <Container20 />
      <Container22 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="relative size-[96px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96 96">
        <g clipPath="url(#clip0_521_8200)" id="Icon">
          <path d={svgPaths.p30d75d80} id="Vector" stroke="var(--stroke-0, #E5E7EB)" strokeWidth="8.4" />
          <path d={svgPaths.p1e703a0} id="Ellipse 1795" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeWidth="8.4" />
        </g>
        <defs>
          <clipPath id="clip0_521_8200">
            <rect fill="white" height="96" width="96" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text37() {
  return (
    <div className="h-[28px] relative shrink-0 w-[27.742px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#101828] text-[18px] top-0 tracking-[-0.4395px] whitespace-nowrap">2.0</p>
      </div>
    </div>
  );
}

function Text38() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.398px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[#6a7282] text-[10px] top-[0.5px] tracking-[0.1172px] whitespace-nowrap">/ 5</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 py-[26.5px] size-[96px] top-0" data-name="Container">
      <Text37 />
      <Text38 />
    </div>
  );
}

function ScoreGauge1() {
  return (
    <div className="absolute left-0 size-[96px] top-[12.5px]" data-name="ScoreGauge">
      <div className="absolute flex items-center justify-center left-0 size-[96px] top-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-90 flex-none">
          <Icon6 />
        </div>
      </div>
      <Container34 />
    </div>
  );
}

function Text39() {
  return (
    <div className="absolute h-[16.5px] left-[23.06px] top-[116.5px] w-[49.867px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[25px] not-italic text-[#99a1af] text-[11px] text-center top-[0.5px] tracking-[0.0645px] whitespace-nowrap">Promedio</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[145.5px] relative shrink-0 w-[96px]" data-name="Container">
      <ScoreGauge1 />
      <Text39 />
    </div>
  );
}

function Score1() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="score">
      <Container19 />
      <Container33 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="h-[21px] relative shrink-0 w-[36.078px]" data-name="Heading 4">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-0 not-italic text-[#364153] text-[14px] top-0 tracking-[-0.1504px] whitespace-nowrap">Fila 3</p>
      </div>
    </div>
  );
}

function Icon7() {
  return <div className="relative shrink-0 size-[16px]" data-name="Icon" />;
}

function Container37() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[61.539px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Icon7 />
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex h-[21px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading3 />
      <Container37 />
    </div>
  );
}

function Text40() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Malo</p>
      </div>
    </div>
  );
}

function Container40() {
  return <div className="bg-[#155dfc] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container39() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <Container40 />
      </div>
    </div>
  );
}

function Text41() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24.05px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">1</p>
      </div>
    </div>
  );
}

function Text42() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.59px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">100%</p>
      </div>
    </div>
  );
}

function BarRow10() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text40 />
      <Container39 />
      <Text41 />
      <Text42 />
    </div>
  );
}

function Text43() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Bajo</p>
      </div>
    </div>
  );
}

function Container42() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container41() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container42 />
        </div>
      </div>
    </div>
  );
}

function Text44() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text45() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow11() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text43 />
      <Container41 />
      <Text44 />
      <Text45 />
    </div>
  );
}

function Text46() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Promedio</p>
      </div>
    </div>
  );
}

function Container44() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container43() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container44 />
        </div>
      </div>
    </div>
  );
}

function Text47() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text48() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow12() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text46 />
      <Container43 />
      <Text47 />
      <Text48 />
    </div>
  );
}

function Text49() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Alto</p>
      </div>
    </div>
  );
}

function Container46() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container45() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container46 />
        </div>
      </div>
    </div>
  );
}

function Text50() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text51() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow13() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text49 />
      <Container45 />
      <Text50 />
      <Text51 />
    </div>
  );
}

function Text52() {
  return (
    <div className="h-[19.5px] relative shrink-0 w-[144px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-0 not-italic text-[#4a5565] text-[13px] top-px tracking-[-0.0762px] whitespace-nowrap">Buenísimo</p>
      </div>
    </div>
  );
}

function Container48() {
  return <div className="bg-[#fdc700] h-[10px] relative rounded-[16777200px] shrink-0 w-full" data-name="Container" />;
}

function Container47() {
  return (
    <div className="bg-[#f3f4f6] flex-[670_0_0] h-[10px] min-w-px relative rounded-[16777200px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[670px] relative size-full">
          <Container48 />
        </div>
      </div>
    </div>
  );
}

function Text53() {
  return (
    <div className="h-[18px] relative shrink-0 w-[24px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[24px] not-italic text-[#364153] text-[12px] text-right top-px whitespace-nowrap">0</p>
      </div>
    </div>
  );
}

function Text54() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[36px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-full absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[36.75px] not-italic text-[#99a1af] text-[11px] text-right top-[0.5px] tracking-[0.0645px] whitespace-nowrap">0%</p>
      </div>
    </div>
  );
}

function BarRow14() {
  return (
    <div className="content-stretch flex gap-[12px] h-[19.5px] items-center relative shrink-0 w-full" data-name="BarRow">
      <Text52 />
      <Container47 />
      <Text53 />
      <Text54 />
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[129.5px] items-start relative shrink-0 w-full" data-name="Container">
      <BarRow10 />
      <BarRow11 />
      <BarRow12 />
      <BarRow13 />
      <BarRow14 />
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[12px] h-[178.5px] items-start min-w-px relative" data-name="Container">
      <Container36 />
      <Container38 />
    </div>
  );
}

function Icon8() {
  return (
    <div className="relative size-[96px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 96 96">
        <g clipPath="url(#clip0_521_8224)" id="Icon">
          <path d={svgPaths.p30d75d80} id="Vector" stroke="var(--stroke-0, #E5E7EB)" strokeWidth="8.4" />
          <path d={svgPaths.p1861a500} id="Ellipse 1795" stroke="var(--stroke-0, #155DFC)" strokeLinecap="round" strokeWidth="8.4" />
        </g>
        <defs>
          <clipPath id="clip0_521_8224">
            <rect fill="white" height="96" width="96" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text55() {
  return (
    <div className="h-[28px] relative shrink-0 w-[27.742px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[28px] left-0 not-italic text-[#101828] text-[18px] top-0 tracking-[-0.4395px] whitespace-nowrap">1.0</p>
      </div>
    </div>
  );
}

function Text56() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.398px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[15px] left-0 not-italic text-[#6a7282] text-[10px] top-[0.5px] tracking-[0.1172px] whitespace-nowrap">/ 5</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-center left-0 py-[26.5px] size-[96px] top-0" data-name="Container">
      <Text55 />
      <Text56 />
    </div>
  );
}

function ScoreGauge2() {
  return (
    <div className="absolute left-0 size-[96px] top-[12.5px]" data-name="ScoreGauge">
      <div className="absolute flex items-center justify-center left-0 size-[96px] top-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-rotate-90 flex-none">
          <Icon8 />
        </div>
      </div>
      <Container50 />
    </div>
  );
}

function Text57() {
  return (
    <div className="absolute h-[16.5px] left-[23.06px] top-[116.5px] w-[49.867px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[16.5px] left-[25px] not-italic text-[#99a1af] text-[11px] text-center top-[0.5px] tracking-[0.0645px] whitespace-nowrap">Promedio</p>
    </div>
  );
}

function Container49() {
  return (
    <div className="h-[145.5px] relative shrink-0 w-[96px]" data-name="Container">
      <ScoreGauge2 />
      <Text57 />
    </div>
  );
}

function Score2() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-name="score">
      <Container35 />
      <Container49 />
    </div>
  );
}

function ScoreMatrixChart() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] h-[585.5px] items-start relative shrink-0 w-full" data-name="ScoreMatrixChart">
      <Score />
      <Score1 />
      <Score2 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[626.5px] relative shrink-0 w-full" data-name="Container">
      <div aria-hidden="true" className="absolute border-[#f3f4f6] border-solid border-t inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start pt-[21px] px-[24px] relative size-full">
        <ScoreMatrixChart />
      </div>
    </div>
  );
}

export default function EstrellasOff() {
  return (
    <div className="bg-white relative rounded-[12px] size-full" data-name="estrellas OFF">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <Container />
        <Container2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}