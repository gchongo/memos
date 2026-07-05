import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookmarkMinusIcon,
  BookmarkPlusIcon,
  CheckCheckIcon,
  CopyIcon,
  Edit3Icon,
  FileTextIcon,
  LinkIcon,
  ListChecksIcon,
  ListRestartIcon,
  MoreVerticalIcon,
  PinIcon,
  PinOffIcon,
  TrashIcon,
} from "lucide-react";
import { useContext, useState } from "react";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemoViewContext } from "@/components/MemoView/MemoViewContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { ROUTES } from "@/router/routes";
import { isSuperUser } from "@/utils/user";
import { countTasks } from "@/utils/markdown-manipulation";
import { useMemoActionHandlers } from "./hooks";
import type { MemoActionMenuProps } from "./types";

const MemoActionMenu = (props: MemoActionMenuProps) => {
  const { memo, readonly } = props;
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const location = useLocation();
  const memoViewContext = useContext(MemoViewContext);

  const withMenuSelect = (handler: () => void) => () => {
    memoViewContext?.suppressCardNavigation();
    handler();
  };

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derived state
  const isComment = Boolean(memo.parent);
  const isArchived = memo.state === State.ARCHIVED;
  const taskStats = countTasks(memo.content);
  const canMutateTasks = !readonly && !isArchived && taskStats.total > 0;
  const hasOpenTasks = taskStats.completed < taskStats.total;
  const hasCompletedTasks = taskStats.completed > 0;

  // Action handlers
  const {
    handleTogglePinMemoBtnClick,
    handleToggleFeatureMemoBtnClick,
    handleEditMemoClick,
    handleToggleMemoStatusClick,
    handleCopyLink,
    handleCopyContent,
    handleCheckAllTaskListItemsClick,
    handleUncheckAllTaskListItemsClick,
    handleDeleteMemoClick,
    confirmDeleteMemo,
  } = useMemoActionHandlers({
    memo,
    onEdit: props.onEdit,
    setDeleteDialogOpen,
  });

  const canPinToProfile = memo.creator === currentUser?.name;
  const canFeatureOnExplore = isSuperUser(currentUser);
  const isExplorePage = location.pathname === ROUTES.EXPLORE;
  const canFeatureThisMemo = memo.visibility === Visibility.PUBLIC;

  return (
    <div
      data-no-memo-nav
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-4">
            <MoreVerticalIcon className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={2} data-no-memo-nav>
          {canFeatureOnExplore && !isArchived && !isComment && (
            <DropdownMenuItem
              disabled={!canFeatureThisMemo}
              onSelect={withMenuSelect(() => void handleToggleFeatureMemoBtnClick())}
            >
              {memo.featured ? <PinOffIcon className="w-4 h-auto" /> : <PinIcon className="w-4 h-auto" />}
              {memo.featured ? t("common.unfeature") : t("common.feature")}
            </DropdownMenuItem>
          )}

          {/* Edit actions (non-readonly, non-archived) */}
          {!readonly && !isArchived && (
            <>
              {!isComment && canPinToProfile && !(isExplorePage && canFeatureOnExplore) && (
                <DropdownMenuItem onSelect={withMenuSelect(() => void handleTogglePinMemoBtnClick())}>
                  {memo.pinned ? <BookmarkMinusIcon className="w-4 h-auto" /> : <BookmarkPlusIcon className="w-4 h-auto" />}
                  {memo.pinned ? t("layout.profile-unpin") : t("layout.profile-pin")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={withMenuSelect(handleEditMemoClick)}>
                <Edit3Icon className="w-4 h-auto" />
                {t("common.edit")}
              </DropdownMenuItem>
            </>
          )}

          {/* Copy submenu (non-archived) */}
          {!isArchived && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CopyIcon className="w-4 h-auto" />
                {t("common.copy")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent data-no-memo-nav>
                <DropdownMenuItem onSelect={withMenuSelect(handleCopyLink)}>
                  <LinkIcon className="w-4 h-auto" />
                  {t("memo.copy-link")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={withMenuSelect(handleCopyContent)}>
                  <FileTextIcon className="w-4 h-auto" />
                  {t("memo.copy-content")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Task submenu (writable task memos) */}
          {canMutateTasks && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ListChecksIcon className="w-4 h-auto" />
                {t("memo.task-actions.title")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent data-no-memo-nav>
                <DropdownMenuItem disabled={!hasOpenTasks} onSelect={withMenuSelect(() => void handleCheckAllTaskListItemsClick())}>
                  <CheckCheckIcon className="w-4 h-auto" />
                  {t("memo.task-actions.check-all")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!hasCompletedTasks} onSelect={withMenuSelect(() => void handleUncheckAllTaskListItemsClick())}>
                  <ListRestartIcon className="w-4 h-auto" />
                  {t("memo.task-actions.uncheck-all")}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Write actions (non-readonly) */}
          {!readonly && (
            <>
              {/* Archive/Restore (non-comment) */}
              {!isComment && (
                <DropdownMenuItem onSelect={withMenuSelect(() => void handleToggleMemoStatusClick())}>
                  {isArchived ? <ArchiveRestoreIcon className="w-4 h-auto" /> : <ArchiveIcon className="w-4 h-auto" />}
                  {isArchived ? t("common.restore") : t("common.archive")}
                </DropdownMenuItem>
              )}

              {/* Delete */}
              <DropdownMenuItem onSelect={withMenuSelect(handleDeleteMemoClick)}>
                <TrashIcon className="w-4 h-auto" />
                {t("common.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("memo.delete-confirm")}
        confirmLabel={t("common.delete")}
        description={t("memo.delete-confirm-description")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDeleteMemo}
        confirmVariant="destructive"
      />
      </DropdownMenu>
    </div>
  );
};

export default MemoActionMenu;
