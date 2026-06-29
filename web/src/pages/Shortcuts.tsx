import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import {
  CheckCircle2Icon,
  ClipboardCheckIcon,
  Clock3Icon,
  ExternalLinkIcon,
  FilterIcon,
  MoreVerticalIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  ShieldIcon,
  TagsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import FeedHeader from "@/components/FeedHeader";
import XWidgetCard from "@/components/XWidgetCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { shortcutServiceClient } from "@/connect";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import { handleError } from "@/lib/error";
import { Shortcut, ShortcutSchema } from "@/types/proto/api/v1/shortcut_service_pb";
import { useTranslate } from "@/utils/i18n";

const SHORTCUT_EXAMPLE_DEFS = [
  { id: "pinned", filter: "pinned", icon: PinIcon },
  { id: "recent", filter: 'created_ts >= now - duration("1h")', icon: Clock3Icon },
  { id: "public", filter: 'visibility == "PUBLIC"', icon: ShieldIcon },
  { id: "projectTags", filter: 'tag in ["work", "personal"]', icon: TagsIcon },
  { id: "archiveTree", filter: 'tags.exists(t, t.startsWith("archive"))', icon: TagsIcon },
  { id: "openTasks", filter: "has_task_list && has_incomplete_tasks", icon: ClipboardCheckIcon },
  { id: "linksOrCode", filter: "has_link || has_code", icon: FilterIcon },
  { id: "contentSearch", filter: 'content.contains("TODO")', icon: SearchIcon },
  { id: "startsWith", filter: 'content.startsWith("TODO")', icon: SearchIcon },
  { id: "regexMatch", filter: 'content.matches("v[0-9]+")', icon: FilterIcon },
  { id: "allTags", filter: 'tags.all(t, t.startsWith("work/"))', icon: TagsIcon },
  { id: "oneProjectTag", filter: 'tags.exists_one(t, t.startsWith("project/"))', icon: TagsIcon },
  { id: "anyOfTags", filter: 'sets.intersects(tags, ["work", "urgent"])', icon: TagsIcon },
  { id: "exactlyTags", filter: 'sets.equivalent(tags, ["inbox"])', icon: TagsIcon },
  { id: "year2024", filter: "created_ts.getFullYear() == 2024", icon: Clock3Icon },
  { id: "weekend", filter: "created_ts.getDayOfWeek() == 0 || created_ts.getDayOfWeek() == 6", icon: Clock3Icon },
  { id: "longNotes", filter: "size(content) > 280", icon: FilterIcon },
] as const;

const filterFields = [
  "content.contains(...)",
  "content.startsWith(...)",
  "content.endsWith(...)",
  "content.matches(...)",
  "visibility",
  "pinned",
  "tag in [...]",
  "tags.exists(...)",
  "tags.all(...)",
  "tags.exists_one(...)",
  "sets.contains(tags, [...])",
  "sets.intersects(tags, [...])",
  "sets.equivalent(tags, [...])",
  "size(content) > ...",
  "has_task_list",
  "has_incomplete_tasks",
  "has_link",
  "has_code",
  'created_ts >= now - duration("24h")',
  "created_ts.getFullYear() == ...",
  "created_ts.getMonth() == ... (0 = Jan)",
  "created_ts.getDayOfWeek() == ... (0 = Sun)",
  "updated_ts",
  "now",
  'timestamp("2025-01-01T00:00:00Z")',
];

const createEmptyShortcut = () =>
  create(ShortcutSchema, {
    name: "",
    title: "",
    filter: "",
  });

interface ShortcutGuideProps {
  onUseExample: (example: (typeof SHORTCUT_EXAMPLE_DEFS)[number]) => void;
}

interface ShortcutsRouteState {
  openCreate?: boolean;
  shortcut?: Shortcut;
}

const ShortcutGuide = ({ onUseExample }: ShortcutGuideProps) => {
  const t = useTranslate();

  return (
    <XWidgetCard title={t("shortcutsPage.expressionExamples")}>
      <div className="flex flex-col gap-1">
        {SHORTCUT_EXAMPLE_DEFS.map((example) => {
          const Icon = example.icon;
          return (
            <button
              key={example.id}
              type="button"
              className="group rounded-lg p-2 text-left transition-colors hover:bg-accent/50"
              onClick={() => onUseExample(example)}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 text-[var(--x-accent)]" />
                {t(`shortcutsPage.examples.${example.id}.title` as Parameters<typeof t>[0])}
              </span>
              <span className="mt-1 block font-mono text-xs leading-5 text-muted-foreground">{example.filter}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {t(`shortcutsPage.examples.${example.id}.description` as Parameters<typeof t>[0])}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">{t("shortcutsPage.supportedFields")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {filterFields.map((field) => (
            <Badge key={field} variant="secondary" className="font-mono text-[11px]">
              {field}
            </Badge>
          ))}
        </div>
      </div>
    </XWidgetCard>
  );
};

const Shortcuts = () => {
  const t = useTranslate();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { shortcuts, refetchSettings } = useAuth();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [draft, setDraft] = useState<Shortcut>(createEmptyShortcut());
  const [deleteTarget, setDeleteTarget] = useState<Shortcut | undefined>();
  const createState = useLoading(false);
  const validateState = useLoading(false);
  const updateState = useLoading(false);
  const isEditing = draft.name !== "";
  const isSaving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    const state = location.state as ShortcutsRouteState | null;
    if (!state) return;

    if (state.shortcut) {
      setDraft(
        create(ShortcutSchema, {
          name: state.shortcut.name,
          title: state.shortcut.title,
          filter: state.shortcut.filter,
        }),
      );
      setIsCreateFormOpen(true);
    } else if (state.openCreate) {
      setDraft(createEmptyShortcut());
      setIsCreateFormOpen(true);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, navigate]);

  const setDraftState = (state: Partial<Shortcut>) => {
    setDraft((current) => ({ ...current, ...state }));
  };

  const handleUseExample = (example: (typeof SHORTCUT_EXAMPLE_DEFS)[number]) => {
    setDraft(
      create(ShortcutSchema, {
        name: draft.name,
        title: draft.title || t(`shortcutsPage.examples.${example.id}.title` as Parameters<typeof t>[0]),
        filter: example.filter,
      }),
    );
    setIsCreateFormOpen(true);
  };

  const handleOpenCreateForm = () => {
    setDraft(createEmptyShortcut());
    setIsCreateFormOpen(true);
  };

  const handleCloseForm = () => {
    setDraft(createEmptyShortcut());
    setIsCreateFormOpen(false);
  };

  const handleEditShortcut = (shortcut: Shortcut) => {
    setDraft(
      create(ShortcutSchema, {
        name: shortcut.name,
        title: shortcut.title,
        filter: shortcut.filter,
      }),
    );
    setIsCreateFormOpen(true);
  };

  const validateDraft = async () => {
    if (!draft.title || !draft.filter) {
      toast.error(t("shortcutsPage.validateEmpty"));
      return false;
    }
    if (!user?.name) {
      toast.error(t("shortcutsPage.noUser"));
      return false;
    }

    try {
      validateState.setLoading();
      await shortcutServiceClient.createShortcut({
        parent: user.name,
        shortcut: { name: "", title: draft.title, filter: draft.filter },
        validateOnly: true,
      });
      validateState.setFinish();
      toast.success(t("shortcutsPage.validateSuccess"));
      return true;
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: "Validate shortcut filter",
        onError: () => validateState.setError(),
      });
      return false;
    }
  };

  const handleCreateShortcut = async () => {
    if (!draft.title || !draft.filter) {
      toast.error(t("shortcutsPage.validateEmpty"));
      return;
    }
    if (!user?.name) {
      toast.error(t("shortcutsPage.noUser"));
      return;
    }

    try {
      createState.setLoading();
      await shortcutServiceClient.createShortcut({
        parent: user.name,
        shortcut: { name: "", title: draft.title, filter: draft.filter },
      });
      await refetchSettings();
      createState.setFinish();
      setDraft(createEmptyShortcut());
      setIsCreateFormOpen(false);
      toast.success(t("shortcutsPage.createSuccess"));
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: "Create shortcut",
        onError: () => createState.setError(),
      });
    }
  };

  const handleUpdateShortcut = async () => {
    if (!draft.title || !draft.filter) {
      toast.error(t("shortcutsPage.validateEmpty"));
      return;
    }

    try {
      updateState.setLoading();
      await shortcutServiceClient.updateShortcut({
        shortcut: draft,
        updateMask: create(FieldMaskSchema, { paths: ["title", "filter"] }),
      });
      await refetchSettings();
      updateState.setFinish();
      setDraft(createEmptyShortcut());
      setIsCreateFormOpen(false);
      toast.success(t("shortcutsPage.updateSuccess"));
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: "Update shortcut",
        onError: () => updateState.setError(),
      });
    }
  };

  const handleSaveShortcut = async () => {
    if (isEditing) {
      await handleUpdateShortcut();
      return;
    }

    await handleCreateShortcut();
  };

  const confirmDeleteShortcut = async () => {
    if (!deleteTarget) return;

    try {
      await shortcutServiceClient.deleteShortcut({ name: deleteTarget.name });
      await refetchSettings();
      toast.success(t("setting.shortcut.delete-success", { title: deleteTarget.title }));
      setDeleteTarget(undefined);
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: "Delete shortcut",
      });
    }
  };

  const createButtonLabel = useMemo(
    () => (isCreateFormOpen ? t("common.cancel") : `${t("common.create")}${t("common.shortcuts")}`),
    [isCreateFormOpen, t],
  );

  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <FeedHeader title={t("common.shortcuts")} />

      <div className="border-b border-border px-4 py-3">
        <p className="text-[15px] leading-6 text-muted-foreground">{t("shortcutsPage.description")}</p>
        <div className="mt-3">
          <Button
            className="rounded-full"
            variant={isCreateFormOpen ? "outline" : "default"}
            onClick={isCreateFormOpen ? handleCloseForm : handleOpenCreateForm}
          >
            {isCreateFormOpen ? <XIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {createButtonLabel}
          </Button>
        </div>
      </div>

      {isCreateFormOpen && (
        <div className="border-b border-border px-4 py-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{isEditing ? t("shortcutsPage.editTitle") : t("shortcutsPage.createTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("shortcutsPage.formDescription")}</p>
            </div>
            <a
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--x-accent)] hover:underline"
              href="https://www.usememos.com/docs/usage/shortcuts"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("shortcutsPage.docs")}
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shortcut-title">{t("common.title")}</Label>
              <Input
                id="shortcut-title"
                value={draft.title}
                placeholder={t("shortcutsPage.titlePlaceholder")}
                onChange={(event) => setDraftState({ title: event.target.value })}
              />
              <p className="text-xs leading-5 text-muted-foreground">{t("shortcutsPage.titleHint")}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortcut-filter">{t("common.filter")}</Label>
              <Textarea
                id="shortcut-filter"
                rows={5}
                className="font-mono text-sm"
                value={draft.filter}
                placeholder={t("shortcutsPage.filterPlaceholder")}
                onChange={(event) => setDraftState({ filter: event.target.value })}
              />
              <p className="text-xs leading-5 text-muted-foreground">{t("shortcutsPage.filterHint")}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-full" disabled={validateState.isLoading || isSaving} onClick={validateDraft}>
              <CheckCircle2Icon className="h-4 w-4" />
              {t("shortcutsPage.validate")}
            </Button>
            <Button className="rounded-full" disabled={isSaving || validateState.isLoading} onClick={handleSaveShortcut}>
              <SaveIcon className="h-4 w-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t("shortcutsPage.allShortcuts")}</h2>
          <Badge variant="outline">{shortcuts.length}</Badge>
        </div>

        {shortcuts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{t("shortcutsPage.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("shortcutsPage.emptyDescription")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.name}
                className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-foreground">{shortcut.title}</div>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-card px-3 py-2 font-mono text-xs leading-5 text-muted-foreground">
                    {shortcut.filter}
                  </pre>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditShortcut(shortcut)}>
                      <PencilIcon className="h-4 w-4" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTarget(shortcut)}>
                      <Trash2Icon className="h-4 w-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateFormOpen && (
        <div className="px-4 pb-6">
          <ShortcutGuide onUseExample={handleUseExample} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title={t("setting.shortcut.delete-confirm", { title: deleteTarget?.title ?? "" })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDeleteShortcut}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Shortcuts;
