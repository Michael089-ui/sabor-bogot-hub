import { Link } from "react-router-dom";

interface LogoSaborCapitalProps {
  className?: string;
  linkTo?: string;
}

export const LogoSaborCapital = ({ className = "", linkTo = "/" }: LogoSaborCapitalProps) => {
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-lg">SC</span>
      </div>
      <span className="text-xl font-bold text-foreground">Sabor Capital</span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};
