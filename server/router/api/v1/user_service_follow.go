package v1

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	v1pb "github.com/usememos/memos/proto/gen/api/v1"
	"github.com/usememos/memos/store"
)

func (s *APIV1Service) FollowUser(ctx context.Context, request *v1pb.FollowUserRequest) (*emptypb.Empty, error) {
	currentUser, err := s.fetchCurrentUser(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if currentUser == nil {
		return nil, status.Errorf(codes.Unauthenticated, "user not authenticated")
	}

	targetUser, err := ResolveUserByName(ctx, s.Store, request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user name: %v", err)
	}
	if targetUser == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}
	if targetUser.ID == currentUser.ID {
		return nil, status.Errorf(codes.InvalidArgument, "cannot follow yourself")
	}

	if err := s.Store.UpsertUserFollow(ctx, &store.UserFollow{
		FollowerID: currentUser.ID,
		FolloweeID: targetUser.ID,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to follow user: %v", err)
	}

	return &emptypb.Empty{}, nil
}

func (s *APIV1Service) UnfollowUser(ctx context.Context, request *v1pb.UnfollowUserRequest) (*emptypb.Empty, error) {
	currentUser, err := s.fetchCurrentUser(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}
	if currentUser == nil {
		return nil, status.Errorf(codes.Unauthenticated, "user not authenticated")
	}

	targetUser, err := ResolveUserByName(ctx, s.Store, request.Name)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user name: %v", err)
	}
	if targetUser == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	if err := s.Store.DeleteUserFollow(ctx, &store.DeleteUserFollow{
		FollowerID: currentUser.ID,
		FolloweeID: targetUser.ID,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to unfollow user: %v", err)
	}

	return &emptypb.Empty{}, nil
}

func (s *APIV1Service) ListFollowing(ctx context.Context, request *v1pb.ListFollowingRequest) (*v1pb.ListFollowingResponse, error) {
	user, err := ResolveUserByName(ctx, s.Store, request.Parent)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user name: %v", err)
	}
	if user == nil {
		return nil, status.Errorf(codes.NotFound, "user not found")
	}

	usernames, err := s.Store.ListFollowingUsernames(ctx, user.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list following users: %v", err)
	}

	return &v1pb.ListFollowingResponse{Usernames: usernames}, nil
}

func (s *APIV1Service) getUserFollowCounts(ctx context.Context, userID int32) (followerCount int32, followingCount int32, err error) {
	followerCount, err = s.Store.CountUserFollowers(ctx, userID)
	if err != nil {
		return 0, 0, err
	}
	followingCount, err = s.Store.CountUserFollowing(ctx, userID)
	if err != nil {
		return 0, 0, err
	}
	return followerCount, followingCount, nil
}
