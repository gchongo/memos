import { CameraIcon, Link2Icon, XIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { convertFileToBase64 } from "@/helpers/utils";
import { useUpdateUser } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

const PROFILE_COVER_HEIGHT = 200;
const PROFILE_AVATAR_SIZE = 134;
const MAX_COVER_SIZE_BYTES = 4 * 1024 * 1024;

export const profileLayoutVars = {
  coverHeight: PROFILE_COVER_HEIGHT,
  avatarSize: PROFILE_AVATAR_SIZE,
} as const;

const hashUsername = (username: string) => {
  let hash = 0;
  for (const char of username) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

interface ProfileHeroProps {
  user: User;
  isOwnProfile: boolean;
  followingCount: number;
  followerCount: number;
  joinedLabel?: string;
  onShareProfile: () => void;
  onFollowToggle: () => void;
  isFollowing: boolean;
  onCoverUpdated?: (user: User) => void;
}

const ProfileHero = ({
  user,
  isOwnProfile,
  followingCount,
  followerCount,
  joinedLabel,
  onShareProfile,
  onFollowToggle,
  isFollowing,
  onCoverUpdated,
}: ProfileHeroProps) => {
  const t = useTranslate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateUser, isPending: isUpdatingCover } = useUpdateUser();
  const displayName = user.displayName || user.username;

  const coverStyle = useMemo(() => {
    const hue = hashUsername(user.username) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue} 22% 28%) 0%, hsl(${(hue + 48) % 360} 18% 14%) 100%)`,
    };
  }, [user.username]);

  const handleCoverSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !isOwnProfile) return;

    if (file.size > MAX_COVER_SIZE_BYTES) {
      toast.error(t("layout.profile-cover-too-large"));
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      const updatedUser = await updateUser({
        user: {
          name: user.name,
          coverUrl: base64,
        },
        updateMask: ["cover_url"],
      });
      onCoverUpdated?.(updatedUser);
      toast.success(t("message.update-succeed"));
    } catch (error) {
      console.error(error);
      toast.error(t("layout.profile-cover-upload-failed"));
    }
  };

  const handleRemoveCover = async () => {
    if (!isOwnProfile || !user.coverUrl) return;

    try {
      const updatedUser = await updateUser({
        user: {
          name: user.name,
          coverUrl: "",
        },
        updateMask: ["cover_url"],
      });
      onCoverUpdated?.(updatedUser);
      toast.success(t("message.update-succeed"));
    } catch (error) {
      console.error(error);
      toast.error(t("layout.profile-cover-upload-failed"));
    }
  };

  return (
    <>
      <div className="group relative w-full overflow-hidden" style={{ height: PROFILE_COVER_HEIGHT }}>
        {user.coverUrl ? (
          <img src={user.coverUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
              />
            ) : null}
            <div className="absolute inset-0 bg-muted" style={coverStyle} />
          </>
        )}

        {isOwnProfile && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleCoverSelected}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-opacity group-hover:bg-black/35 group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full bg-black/60 text-white hover:bg-black/75"
                disabled={isUpdatingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                <CameraIcon className="mr-1.5 h-4 w-4" />
                {user.coverUrl ? t("layout.profile-change-cover") : t("layout.profile-upload-cover")}
              </Button>
              {user.coverUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="rounded-full bg-black/60 text-white hover:bg-black/75"
                  disabled={isUpdatingCover}
                  aria-label={t("layout.profile-remove-cover")}
                  onClick={handleRemoveCover}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative px-4 pb-3">
        <div className="-mt-[calc(var(--profile-avatar-size)/2+3px)] mb-3 flex items-end justify-between gap-3">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            className="h-[var(--profile-avatar-size)] w-[var(--profile-avatar-size)] shrink-0 rounded-full border-4 border-background bg-background shadow-sm"
          />

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border hover:bg-accent"
              aria-label={t("layout.profile-share")}
              onClick={onShareProfile}
            >
              <Link2Icon className="h-4 w-4" />
            </Button>
            {isOwnProfile ? (
              <Button asChild variant="outline" className="h-9 rounded-full border-border px-4 text-[14px] font-bold hover:bg-accent">
                <Link to={ROUTES.SETTING}>{t("layout.edit-profile")}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant={isFollowing ? "outline" : "default"}
                className={cn(
                  "h-9 rounded-full px-4 text-[14px] font-bold",
                  isFollowing
                    ? "border-border bg-transparent text-foreground hover:bg-accent"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
                onClick={onFollowToggle}
              >
                {isFollowing ? t("layout.following") : t("layout.follow")}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-extrabold leading-6 text-foreground">{displayName}</h2>
            <p className="text-[15px] leading-5 text-muted-foreground">@{user.username}</p>
          </div>

          {user.description && <p className="whitespace-pre-wrap text-[15px] leading-5 text-foreground">{user.description}</p>}

          {joinedLabel && <p className="text-[15px] text-muted-foreground">{joinedLabel}</p>}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px]">
            {isOwnProfile && (
              <span>
                <span className="font-bold text-foreground">{followingCount}</span>{" "}
                <span className="text-muted-foreground">{t("layout.profile-following-stat")}</span>
              </span>
            )}
            <span>
              <span className="font-bold text-foreground">{followerCount}</span>{" "}
              <span className="text-muted-foreground">{t("layout.profile-followers-stat")}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHero;
