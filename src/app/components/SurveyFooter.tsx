import Logo from '../../imports/Logo';

export function SurveyFooter() {
  return (
    <footer className="pt-[60px] pb-[20px] text-center">
      <div className="flex justify-center mb-4">
        <div className="w-[100px] h-[42px]">
          <Logo />
        </div>
      </div>
      <p className="text-[#81878E] dark:text-muted-foreground text-sm">
        Plataforma creada por DesignOps de UiX
      </p>
    </footer>
  );
}