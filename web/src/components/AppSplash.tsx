import { cn } from "@/lib/utils";

interface AppSplashProps {
  className?: string;
}

const AppSplash = ({ className }: AppSplashProps) => {
  return (
    <div
      className={cn("fixed inset-0 z-[9999] flex items-center justify-center bg-background", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-muted border-t-primary splash-ring" aria-hidden />
        <img
          src="/logo.webp"
          alt=""
          draggable={false}
          className="relative size-12 rounded-xl splash-logo"
        />
      </div>
    </div>
  );
};

export default AppSplash;
