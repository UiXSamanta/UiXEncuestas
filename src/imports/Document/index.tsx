import svgPaths from "./svg-byneg3wnhf";

function Paragraph() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-[560px]" data-name="Paragraph">
      <div className="flex flex-col items-center size-full">
        <div className="relative size-full" />
      </div>
    </div>
  );
}

function Col() {
  return (
    <div className="bg-[#c1c1c1] flex-[1_0_0] min-w-px relative rounded-[20px] self-stretch" data-name="col 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Paragraph />
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Italic',sans-serif] font-normal italic leading-[29.25px] left-[157.5px] text-[#6a7282] text-[18px] text-center top-[118px] tracking-[-0.4395px] whitespace-nowrap" style={{ fontVariationSettings: '"slnt" -14' }}>
          IMG
        </p>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 1">
      <p className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[60px] not-italic relative shrink-0 text-[#101828] text-[48px] text-center tracking-[0.3516px] w-full">Testing NPS y Lógica</p>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="content-stretch flex flex-col h-[90px] items-center pb-[40px] pt-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="[word-break:break-word] font-['Inter:Italic',sans-serif] font-normal italic leading-[29.25px] relative shrink-0 text-[#6a7282] text-[18px] text-center tracking-[-0.4395px] whitespace-nowrap" style={{ fontVariationSettings: '"slnt" -14' }}>
        ¡Hola!
      </p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d="M4.16667 10H15.8333" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p1ae0b780} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#2563eb] content-stretch drop-shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.1)] flex gap-[12px] h-[56px] items-center px-[36px] py-[16px] relative rounded-[16777200px] shrink-0" data-name="Button">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] not-italic relative shrink-0 text-[16px] text-center text-white tracking-[-0.3125px] whitespace-nowrap">Empezar</p>
      <Icon />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Button />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[52px] items-center left-[-281.5px] pt-[32px] top-[326px] w-[562px]" data-name="Paragraph">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#99a1af] text-[14px] text-center tracking-[-0.1504px] whitespace-nowrap">Tus respuestas son confidenciales.</p>
    </div>
  );
}

function Col1() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="col 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph1 />
        <Container2 />
        <Paragraph2 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-white drop-shadow-[0px_25px_25px_rgba(0,0,0,0.25)] max-w-[672px] relative rounded-[16px] shrink-0 w-[672px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start max-w-[inherit] px-[20px] py-[56px] relative size-full">
        <Col />
        <Col1 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="flex-[688_0_0] min-h-px relative w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[24px] relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute h-[42px] left-0 overflow-clip top-0 w-[99.953px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 99.9531 42">
        <g id="Group">
          <path d={svgPaths.p30a7e000} fill="url(#paint0_linear_676_120)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_676_120" x1="49.9644" x2="49.9644" y1="42.0017" y2="-0.0191705">
            <stop stopColor="#8C59FE" />
            <stop offset="1" stopColor="#597AFF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute h-[42px] left-[0.05px] top-0 w-[99.953px]" data-name="Container">
      <Icon1 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute h-[34.414px] left-0 top-0 w-[84.664px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 84.6641 34.4141">
        <g clipPath="url(#clip0_676_113)" id="Icon">
          <path d={svgPaths.p38d5d300} fill="url(#paint0_linear_676_113)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_676_113" x1="42.3322" x2="42.3322" y1="41.9335" y2="-0.00880986">
            <stop stopColor="#00C4B3" />
            <stop offset="1" stopColor="#ACE738" />
          </linearGradient>
          <clipPath id="clip0_676_113">
            <rect fill="white" height="34.4141" width="84.6641" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[34.414px] left-0 top-[0.02px] w-[84.664px]" data-name="Container">
      <Icon2 />
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[42px] relative shrink-0 w-[100px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container6 />
        <Container7 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start justify-center relative size-full">
        <Container5 />
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="h-[36px] relative shrink-0 w-[1155px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center pt-[16px] relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#81878e] text-[14px] text-center tracking-[-0.1504px] whitespace-nowrap">Plataforma creada por DesignOps de UiX</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#2563eb] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[20px] pt-[60px] relative size-full">
        <Container4 />
        <Paragraph3 />
      </div>
    </div>
  );
}

function SurveyWelcome() {
  return (
    <div className="bg-[#2563eb] min-h-[846px] relative shrink-0 w-full" data-name="SurveyWelcome">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start min-h-[inherit] relative size-full">
        <Container />
        <Container3 />
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="bg-[#f9fafb] h-[846px] relative shrink-0 w-full" data-name="PublicLayout">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <SurveyWelcome />
      </div>
    </div>
  );
}

export default function Document() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full" data-name="Document">
      <PublicLayout />
    </div>
  );
}