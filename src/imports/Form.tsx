import svgPaths from "./svg-krr2tnmyh7";

function Label() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Label">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#364153] text-[14px] top-[0.5px] tracking-[-0.1504px]">Email</p>
    </div>
  );
}

function EmailInput() {
  return (
    <div className="h-[50px] relative rounded-[10px] shrink-0 w-full" data-name="Email Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.5)] tracking-[-0.3125px]">admin@ejemplo.com</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[78px] items-start relative shrink-0 w-full" data-name="Container">
      <Label />
      <EmailInput />
    </div>
  );
}

function Label1() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Label">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#364153] text-[14px] top-[0.5px] tracking-[-0.1504px]">Contraseña</p>
    </div>
  );
}

function PasswordInput() {
  return (
    <div className="h-[50px] relative rounded-[10px] shrink-0 w-full" data-name="Password Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[16px] py-[12px] relative size-full">
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.5)] tracking-[-0.3125px]">••••••••</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] h-[78px] items-start relative shrink-0 w-full" data-name="Container">
      <Label1 />
      <PasswordInput />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[128.7px] size-[20px] top-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="Icon">
          <path d={svgPaths.pca41100} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p75fc300} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M12.5 10H2.5" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#155dfc] h-[48px] relative rounded-[10px] shrink-0 w-full" data-name="Button">
      <Icon />
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[205.7px] not-italic text-[16px] text-center text-white top-[11.5px] tracking-[-0.3125px]">Iniciar Sesión</p>
    </div>
  );
}

function Button1() {
  return (
    <div className="relative rounded-[10px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pb-[12px] pt-[8px] px-[72px] relative w-full">
          <p className="decoration-solid font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[#155dfc] text-[16px] text-center tracking-[-0.3125px] underline">Solicitar acceso como admin</p>
        </div>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="relative rounded-[10px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center pb-[12px] pt-[8px] px-[100px] relative w-full">
          <p className="decoration-solid font-['Inter:Medium',sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[#155dfc] text-[16px] text-center tracking-[-0.3125px] underline">Olvidé mi contraseña</p>
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Button1 />
      <Button2 />
    </div>
  );
}

export default function Form() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative size-full" data-name="Form">
      <Container />
      <Container1 />
      <Button />
      <Frame />
    </div>
  );
}