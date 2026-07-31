import svgPaths from "./svg-e2y5bd32ml";

function Frame1() {
  return (
    <div className="absolute content-stretch flex items-center justify-center left-[25px] top-[14px]">
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">Degradado 1</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[11.692px] items-center leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">
      <p className="relative shrink-0">HEX</p>
      <p className="relative shrink-0">#597AFF</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">RGB (89, 122, 255)</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[11.692px] items-center leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">
      <p className="relative shrink-0">CMYK</p>
      <p className="relative shrink-0">(55, 72, 0, 0)</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[11.004px] items-start left-[26px] top-[291px] w-[242.099px]">
      <Frame />
      <Frame2 />
      <Frame4 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[11.692px] items-center leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">
      <p className="relative shrink-0">HEX</p>
      <p className="relative shrink-0">#8C59FE</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">RGB (140, 89, 254)</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex font-['Satoshi:Medium',sans-serif] gap-[11.692px] items-center leading-[normal] not-italic relative shrink-0 text-[#23232c] text-[21.12px] whitespace-nowrap">
      <p className="relative shrink-0">CMYK</p>
      <p className="relative shrink-0">(70, 69, 0, 0)</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[11.004px] items-start left-[26px] top-[527px] w-[242.099px]">
      <Frame6 />
      <Frame7 />
      <Frame8 />
    </div>
  );
}

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute bg-white content-stretch flex h-[694px] items-center left-0 pb-[31.403px] pt-[6.893px] px-[6.893px] rounded-[24.245px] shadow-[0px_6.127px_24.663px_0px_rgba(151,151,151,0.25)] top-0 w-[297px]" data-name="Color format" />
      <Frame1 />
      <div className="-translate-x-1/2 absolute h-[112px] left-1/2 top-[73px] w-[257px]" data-name="Color_C">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 257 112">
          <path d={svgPaths.p4b9000} fill="url(#paint0_linear_402_391)" id="Color_C" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_402_391" x1="128.5" x2="128.5" y1="0" y2="112">
              <stop stopColor="#6076FF" />
              <stop offset="1" stopColor="#895CFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[33.14%_36.7%_61.82%_52.19%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 35">
          <path d={svgPaths.p10dab300} fill="var(--fill-0, #597AFF)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[67.15%_36.7%_27.81%_52.19%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 35">
          <path d={svgPaths.p10dab300} fill="var(--fill-0, #865FFF)" id="Vector" />
        </svg>
      </div>
      <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[25px] not-italic text-[#23232c] text-[27px] top-[230px] whitespace-nowrap">597AFF</p>
      <p className="absolute font-['Satoshi:Medium',sans-serif] leading-[normal] left-[25px] not-italic text-[#23232c] text-[27px] top-[466px] whitespace-nowrap">8C59FE</p>
      <Frame3 />
      <Frame5 />
    </div>
  );
}