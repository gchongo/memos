import { MapPinIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LazyLocationPicker } from "@/components/map/LazyLocationPicker";
import { cn } from "@/lib/utils";
import type { Location } from "@/types/proto/api/v1/memo_service_pb";
import { getLocationCoordinatesText, getLocationDisplayText } from "./locationHelpers";

interface LocationDisplayViewProps {
  location?: Location;
}

const LocationDisplayView = ({ location }: LocationDisplayViewProps) => {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  if (!location) {
    return null;
  }

  const displayText = getLocationDisplayText(location);
  const latlng = { lat: location.latitude, lng: location.longitude };

  return (
    <div
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card"
      data-no-memo-nav
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="flex w-full min-w-0 items-center gap-2 border-b border-border px-3 py-2.5 text-[15px] leading-5 text-muted-foreground">
        <MapPinIcon className="h-4 w-4 shrink-0" />
        <span className="shrink-0 opacity-80">[{getLocationCoordinatesText(location, 2)}]</span>
        <span className="min-w-0 truncate">{displayText}</span>
      </div>

      <div ref={mapHostRef} className="w-full">
        {mapVisible ? (
          <LazyLocationPicker
            latlng={latlng}
            readonly
            className={cn("h-52 rounded-none border-0 shadow-none sm:h-60")}
          />
        ) : (
          <div className="memo-location-map h-52 w-full bg-muted/30 sm:h-60" aria-hidden />
        )}
      </div>
    </div>
  );
};

export default LocationDisplayView;
