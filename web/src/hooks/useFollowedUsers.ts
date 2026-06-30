import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const FOLLOWED_STORAGE_KEY = "memos-x-followed-usernames";
const FOLLOWERS_STORAGE_KEY = "memos-x-follower-index";

type FollowerIndex = Record<string, string[]>;

const readFollowerIndex = (index: FollowerIndex | undefined): FollowerIndex => index ?? {};

const uniqueUsernames = (usernames: string[]) => Array.from(new Set(usernames));

export const useFollowedUsers = () => {
  const [followedUsernames, setFollowedUsernames] = useLocalStorage<string[]>(FOLLOWED_STORAGE_KEY, []);
  const [followerIndex, setFollowerIndex] = useLocalStorage<FollowerIndex>(FOLLOWERS_STORAGE_KEY, {});

  const isFollowing = useCallback(
    (username: string) => followedUsernames.includes(username),
    [followedUsernames],
  );

  const getFollowerCount = useCallback(
    (username: string) => readFollowerIndex(followerIndex)[username]?.length ?? 0,
    [followerIndex],
  );

  const follow = useCallback(
    (username: string, followerUsername?: string) => {
      setFollowedUsernames((current) => (current.includes(username) ? current : [...current, username]));

      if (!followerUsername || followerUsername === username) {
        return;
      }

      setFollowerIndex((current) => {
        const next = { ...readFollowerIndex(current) };
        const followers = uniqueUsernames([...(next[username] ?? []), followerUsername]);
        next[username] = followers;
        return next;
      });
    },
    [setFollowedUsernames, setFollowerIndex],
  );

  const unfollow = useCallback(
    (username: string, followerUsername?: string) => {
      setFollowedUsernames((current) => current.filter((name) => name !== username));

      if (!followerUsername) {
        return;
      }

      setFollowerIndex((current) => {
        const next = { ...readFollowerIndex(current) };
        const followers = (next[username] ?? []).filter((name) => name !== followerUsername);
        if (followers.length === 0) {
          delete next[username];
        } else {
          next[username] = followers;
        }
        return next;
      });
    },
    [setFollowedUsernames, setFollowerIndex],
  );

  const toggleFollow = useCallback(
    (username: string, followerUsername?: string) => {
      if (isFollowing(username)) {
        unfollow(username, followerUsername);
      } else {
        follow(username, followerUsername);
      }
    },
    [follow, isFollowing, unfollow],
  );

  return {
    followedUsernames,
    followerIndex,
    isFollowing,
    getFollowerCount,
    follow,
    unfollow,
    toggleFollow,
  };
};
