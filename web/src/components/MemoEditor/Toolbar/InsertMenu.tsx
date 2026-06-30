import { uniqBy } from "lodash-es";
import {
  FileIcon,
  ImageIcon,
  LoaderIcon,
  type LucideIcon,
  LinkIcon,
  MapPinIcon,
  Maximize2Icon,
  MicIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  PlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LinkMemoDialog, LocationDialog } from "@/components/MemoMetadata";
import type { MapPoint } from "@/components/map/types";
import { useReverseGeocoding } from "@/components/map/useReverseGeocoding";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  useDropdownMenuSubHoverDelay,
} from "@/components/ui/dropdown-menu";
import { useDebouncedEffect } from "@/hooks";
import type { MemoRelation } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { setPreferredEditorMode } from "../editorMode";
import { DOCUMENT_FILE_ACCEPT, isAudioFile, isDocumentFile, isVideoFile, useFileUpload, useLinkMemo, useLocation } from "../hooks";
import { useEditorContext, useEditorSelector } from "../state";
import type { InsertMenuProps } from "../types";
import type { LocalFile } from "../types/attachment";

const InsertMenu = (props: InsertMenuProps) => {
  const { variant = "default" } = props;
  const t = useTranslate();
  const { actions, dispatch } = useEditorContext();
  const relations = useEditorSelector((s) => s.metadata.relations);
  const editorMode = useEditorSelector((s) => s.ui.editorMode);
  const { location: initialLocation, onLocationChange, onToggleFocusMode, isUploading: isUploadingProp } = props;

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [moreSubmenuOpen, setMoreSubmenuOpen] = useState(false);

  const { handleTriggerEnter, handleTriggerLeave, handleContentEnter, handleContentLeave } = useDropdownMenuSubHoverDelay(
    150,
    setMoreSubmenuOpen,
  );

  const {
    imageInputRef,
    documentInputRef,
    attachmentInputRef,
    selectingFlag,
    handleFileInputChange,
    handlePhotoInputChange,
    handleImageUploadClick,
    handleDocumentUploadClick,
    handleAttachmentUploadClick,
  } = useFileUpload((newFiles: LocalFile[]) => {
    newFiles.forEach((file) => dispatch(actions.addLocalFile(file)));
  });

  const linkMemo = useLinkMemo({
    isOpen: linkDialogOpen,
    currentMemoName: props.memoName,
    existingRelations: relations,
    onAddRelation: (relation: MemoRelation) => {
      dispatch(actions.setMetadata({ relations: uniqBy([...relations, relation], (r) => r.relatedMemo?.name) }));
      setLinkDialogOpen(false);
    },
  });

  const location = useLocation(props.location);
  const {
    state: locationState,
    locationInitialized,
    handlePositionChange: handleLocationPositionChange,
    getLocation,
    reset: locationReset,
    updateCoordinate,
    setPlaceholder,
  } = location;

  const [debouncedPosition, setDebouncedPosition] = useState<MapPoint | undefined>(undefined);

  useDebouncedEffect(
    () => {
      setDebouncedPosition(locationState.position);
    },
    1000,
    [locationState.position],
  );

  const { data: displayName } = useReverseGeocoding(debouncedPosition?.lat, debouncedPosition?.lng);

  useEffect(() => {
    if (displayName) {
      setPlaceholder(displayName);
    }
  }, [displayName, setPlaceholder]);

  const isUploading = selectingFlag || isUploadingProp;

  const handleOpenLinkDialog = useCallback(() => {
    setLinkDialogOpen(true);
  }, []);

  const handleLocationClick = useCallback(() => {
    setLocationDialogOpen(true);
    if (!initialLocation && !locationInitialized) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handleLocationPositionChange({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
        );
      }
    }
  }, [initialLocation, locationInitialized, handleLocationPositionChange]);

  const handleLocationConfirm = useCallback(() => {
    const newLocation = getLocation();
    if (newLocation) {
      onLocationChange(newLocation);
      setLocationDialogOpen(false);
    }
  }, [getLocation, onLocationChange]);

  const handleLocationCancel = useCallback(() => {
    locationReset();
    setLocationDialogOpen(false);
  }, [locationReset]);

  const handleToggleFocusMode = useCallback(() => {
    onToggleFocusMode?.();
    setMoreSubmenuOpen(false);
  }, [onToggleFocusMode]);

  const handleEditorModeChange = useCallback(
    (checked: boolean) => {
      const next = checked ? "wysiwyg" : "raw";
      dispatch(actions.setEditorMode(next));
      setPreferredEditorMode(next);
    },
    [actions, dispatch],
  );

  const handleMediaUploadClick = useCallback(() => {
    handleImageUploadClick();
  }, [handleImageUploadClick]);

  const handleFileUploadClick = useCallback(() => {
    handleDocumentUploadClick();
  }, [handleDocumentUploadClick]);

  const handleAddAttachmentClick = useCallback(() => {
    handleAttachmentUploadClick();
  }, [handleAttachmentUploadClick]);

  const feedToolbarItems = useMemo(
    () =>
      [
        {
          key: "upload-image",
          label: t("editor.insert-menu.upload-image"),
          icon: ImageIcon,
          onClick: handleMediaUploadClick,
        },
        {
          key: "record-audio",
          label: t("editor.audio-recorder.trigger"),
          icon: MicIcon,
          onClick: () => props.onAudioRecorderClick?.(),
        },
        {
          key: "upload-file",
          label: t("editor.insert-menu.upload-file"),
          icon: FileIcon,
          onClick: handleFileUploadClick,
        },
        {
          key: "add-attachment",
          label: t("editor.insert-menu.add-attachment"),
          icon: PaperclipIcon,
          onClick: handleAddAttachmentClick,
        },
        {
          key: "location",
          label: t("editor.insert-menu.add-location"),
          icon: MapPinIcon,
          onClick: handleLocationClick,
        },
      ] satisfies Array<{ key: string; label: string; icon: LucideIcon; onClick: () => void }>,
    [handleAddAttachmentClick, handleFileUploadClick, handleLocationClick, handleMediaUploadClick, props, t],
  );

  const menuItems = useMemo(
    () =>
      [
        {
          key: "upload-media",
          label: t("editor.insert-menu.upload-image"),
          icon: ImageIcon,
          onClick: handleMediaUploadClick,
        },
        {
          key: "record-audio",
          label: t("editor.audio-recorder.trigger"),
          icon: MicIcon,
          onClick: () => props.onAudioRecorderClick?.(),
        },
        {
          key: "upload-file",
          label: t("editor.insert-menu.upload-file"),
          icon: FileIcon,
          onClick: handleFileUploadClick,
        },
        {
          key: "add-attachment",
          label: t("editor.insert-menu.add-attachment"),
          icon: PaperclipIcon,
          onClick: handleAddAttachmentClick,
        },
        {
          key: "link",
          label: t("editor.insert-menu.link-memo"),
          icon: LinkIcon,
          onClick: handleOpenLinkDialog,
        },
        {
          key: "location",
          label: t("editor.insert-menu.add-location"),
          icon: MapPinIcon,
          onClick: handleLocationClick,
        },
      ] satisfies Array<{ key: string; label: string; icon: LucideIcon; onClick: () => void }>,
    [
      handleAddAttachmentClick,
      handleFileUploadClick,
      handleLocationClick,
      handleMediaUploadClick,
      handleOpenLinkDialog,
      props,
      t,
    ],
  );

  const feedIconButtonClass =
    "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[var(--x-accent)] transition-colors hover:bg-[var(--x-accent)]/10 disabled:opacity-40";

  return (
    <>
      {variant === "feed" ? (
        <div className="flex shrink-0 flex-row flex-nowrap items-center gap-0.5">
          {feedToolbarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={feedIconButtonClass}
              disabled={isUploading}
              aria-label={item.label}
              onClick={item.onClick}
            >
              {isUploading && (item.key === "upload-image" || item.key === "upload-file" || item.key === "add-attachment") ? (
                <LoaderIcon className="size-[18px] animate-spin" />
              ) : (
                <item.icon className="size-[18px]" strokeWidth={1.75} />
              )}
            </button>
          ))}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button type="button" className={feedIconButtonClass} aria-label={t("common.more")}>
                <MoreHorizontalIcon className="size-[18px]" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleOpenLinkDialog}>
                <LinkIcon className="h-4 w-4" />
                {t("editor.insert-menu.link-memo")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggleFocusMode}>
                <Maximize2Icon className="h-4 w-4" />
                {t("editor.focus-mode")}
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem checked={editorMode === "wysiwyg"} onCheckedChange={handleEditorModeChange}>
                {t("editor.wysiwyg-editor")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" disabled={isUploading}>
              {isUploading ? <LoaderIcon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {menuItems.slice(0, 3).map((item) => (
              <DropdownMenuItem key={item.key} onClick={item.onClick}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {menuItems.slice(3).map((item) => (
              <DropdownMenuItem key={item.key} onClick={item.onClick}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuSub open={moreSubmenuOpen} onOpenChange={setMoreSubmenuOpen}>
              <DropdownMenuSubTrigger onPointerEnter={handleTriggerEnter} onPointerLeave={handleTriggerLeave}>
                <MoreHorizontalIcon className="w-4 h-4" />
                {t("common.more")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent onPointerEnter={handleContentEnter} onPointerLeave={handleContentLeave}>
                <DropdownMenuItem onClick={handleToggleFocusMode}>
                  <Maximize2Icon className="w-4 h-4" />
                  {t("editor.focus-mode")}
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem checked={editorMode === "wysiwyg"} onCheckedChange={handleEditorModeChange}>
                  {t("editor.wysiwyg-editor")}
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <input
        className="hidden"
        ref={imageInputRef}
        disabled={isUploading}
        onChange={handlePhotoInputChange}
        type="file"
        multiple
        accept="image/*,video/*"
      />
      <input
        className="hidden"
        ref={documentInputRef}
        disabled={isUploading}
        onChange={handleFileInputChange(isDocumentFile)}
        type="file"
        multiple
        accept={DOCUMENT_FILE_ACCEPT}
      />
      <input
        className="hidden"
        ref={attachmentInputRef}
        disabled={isUploading}
        onChange={handleFileInputChange((file) => isVideoFile(file) || isAudioFile(file))}
        type="file"
        multiple
        accept="video/*,audio/*,.mp4,.mov,.m4v,.webm,.mkv,.mp3,.wav,.m4a,.aac,.flac,.ogg"
      />

      <LinkMemoDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        searchText={linkMemo.searchText}
        onSearchChange={linkMemo.setSearchText}
        filteredMemos={linkMemo.filteredMemos}
        isFetching={linkMemo.isFetching}
        onSelectMemo={linkMemo.addMemoRelation}
        isAlreadyLinked={linkMemo.isAlreadyLinked}
      />

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        state={locationState}
        onPositionChange={handleLocationPositionChange}
        onUpdateCoordinate={updateCoordinate}
        onPlaceholderChange={setPlaceholder}
        onCancel={handleLocationCancel}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
};

export default InsertMenu;
