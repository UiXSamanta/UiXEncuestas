function Heading() {
  return (
    <div className="relative shrink-0" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[#101828] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Pantalla de Bienvenida</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Heading />
      </div>
    </div>
  );
}

function TextInput() {
  return (
    <div className="h-[42px] relative rounded-[10px] shrink-0 w-[433px]" data-name="Text Input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-center overflow-clip px-[17px] py-[9px] relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.8)] tracking-[-0.625px] w-full">Testing NPS y Lógica</p>
      </div>
      <div aria-hidden className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#364153] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Título</p>
        <TextInput />
      </div>
    </div>
  );
}

function TextArea() {
  return (
    <div className="h-[90px] relative rounded-[10px] shrink-0 w-[433px]" data-name="Text Area">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip px-[17px] py-[9px] relative rounded-[inherit] size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[16px] text-[rgba(10,10,10,0.5)] tracking-[-0.625px] w-full">Enter description...</p>
      </div>
      <div aria-hidden className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[10px]" />
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[8px] items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#364153] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Descripción</p>
        <TextArea />
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="relative shrink-0" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#364153] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Imagen de fondo</p>
      </div>
    </div>
  );
}

function Text() {
  return <div className="absolute bg-white left-[2px] rounded-[16777200px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] size-[16px] top-0" data-name="Text" />;
}

function TextTransform() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Text:transform">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#d1d5dc] h-[22px] relative rounded-[16777200px] shrink-0 w-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <TextTransform />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Label />
        <Button />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container7 />
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#364153] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Imagen Open Graph</p>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="relative shrink-0 w-full" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[#81878e] text-[12px] whitespace-nowrap">Vista previa en redes sociales y mensajería</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0 w-[242.203px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Label1 />
        <Paragraph />
      </div>
    </div>
  );
}

function Text1() {
  return <div className="absolute bg-white left-[2px] rounded-[16777200px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] size-[16px] top-0" data-name="Text" />;
}

function TextTransform1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Text:transform">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text1 />
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#d1d5dc] h-[22px] relative rounded-[16777200px] shrink-0 w-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <TextTransform1 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container10 />
        <Button1 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div aria-hidden className="absolute border-[#ebeef4] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[17px] relative size-full">
        <Container9 />
      </div>
    </div>
  );
}

function Label2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#364153] text-[14px] tracking-[-0.3008px] whitespace-nowrap">Imagen de bienvenida</p>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[#81878e] text-[12px] whitespace-nowrap">Se muestra junto al texto en desktop (dos columnas)</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0 w-[297.648px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Label2 />
        <Paragraph1 />
      </div>
    </div>
  );
}

function Text2() {
  return <div className="absolute bg-white left-[2px] rounded-[16777200px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] size-[16px] top-0" data-name="Text" />;
}

function TextTransform2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Text:transform">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Text2 />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#d1d5dc] h-[22px] relative rounded-[16777200px] shrink-0 w-[40px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <TextTransform2 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container13 />
        <Button2 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div aria-hidden className="absolute border-[#ebeef4] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[17px] relative size-full">
        <Container12 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 w-[433px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start relative size-full">
        <Container4 />
        <Container5 />
        <Container6 />
        <Container8 />
        <Container11 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-0 p-[25px] top-0 w-[483px]" data-name="Container">
      <Container2 />
      <Container3 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-white relative rounded-[10px] size-full" data-name="Container">
      <Container1 />
    </div>
  );
}