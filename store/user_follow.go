package store

import "context"

type UserFollow struct {
	FollowerID int32
	FolloweeID int32
	CreatedTs  int64
}

type FindUserFollow struct {
	FollowerID *int32
	FolloweeID *int32
}

type DeleteUserFollow struct {
	FollowerID int32
	FolloweeID int32
}

func (s *Store) UpsertUserFollow(ctx context.Context, follow *UserFollow) error {
	return s.driver.UpsertUserFollow(ctx, follow)
}

func (s *Store) DeleteUserFollow(ctx context.Context, delete *DeleteUserFollow) error {
	return s.driver.DeleteUserFollow(ctx, delete)
}

func (s *Store) HasUserFollow(ctx context.Context, followerID, followeeID int32) (bool, error) {
	return s.driver.HasUserFollow(ctx, followerID, followeeID)
}

func (s *Store) CountUserFollowers(ctx context.Context, followeeID int32) (int32, error) {
	return s.driver.CountUserFollowers(ctx, followeeID)
}

func (s *Store) CountUserFollowing(ctx context.Context, followerID int32) (int32, error) {
	return s.driver.CountUserFollowing(ctx, followerID)
}

func (s *Store) ListFollowingUsernames(ctx context.Context, followerID int32) ([]string, error) {
	return s.driver.ListFollowingUsernames(ctx, followerID)
}

func (s *Store) DeleteUserFollowsByUserID(ctx context.Context, userID int32) error {
	return s.driver.DeleteUserFollowsByUserID(ctx, userID)
}
