"use client";

import * as React from "react";
import { BadgeCheck, MapPin, Pencil, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton, EditorDialog, Field, FormError, ImagePicker, inputClass, textareaClass, useAdminAction } from "@/components/admin/kit";

export interface ArtistRow {
  id: string;
  name: string;
  bio: string;
  city: string;
  imageUrl: string | null;
  verified: boolean;
  songs: number;
  albums: number;
  podcasts: number;
}

function ArtistForm({ artist, onClose }: { artist?: ArtistRow; onClose: () => void }) {
  const { run, busy, error } = useAdminAction();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("verified", (e.currentTarget.elements.namedItem("verified") as HTMLInputElement).checked ? "true" : "false");
    void run(() => fetch(artist ? `/api/admin/artists/${artist.id}` : "/api/admin/artists", { method: artist ? "PATCH" : "POST", body: fd }), onClose);
  };
  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-[160px_1fr]">
      <ImagePicker name="image" removeName="removeImage" currentUrl={artist?.imageUrl} label="Photo" round />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <input name="name" required maxLength={120} defaultValue={artist?.name} className={inputClass} placeholder="Artist name" />
          </Field>
          <Field label="City">
            <input name="city" maxLength={80} defaultValue={artist?.city} className={inputClass} placeholder="Chennai" />
          </Field>
        </div>
        <Field label="Bio">
          <textarea name="bio" maxLength={2000} defaultValue={artist?.bio} className={textareaClass} placeholder="A few lines about the artist" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="verified" defaultChecked={artist?.verified} className="size-4 accent-[hsl(var(--primary))]" />
          Verified artist (shows a blue tick)
        </label>
        <FormError error={error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            {artist ? "Save artist" : "Create artist"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ArtistCard({ artist, onEdit }: { artist: ArtistRow; onEdit: () => void }) {
  const { run, busy } = useAdminAction();
  return (
    <li className="glass flex gap-4 rounded-xl p-4">
      {artist.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artist.imageUrl} alt="" className="size-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-7" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          {artist.name}
          {artist.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />}
        </p>
        {artist.city && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden /> {artist.city}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {artist.songs} songs · {artist.albums} albums · {artist.podcasts} podcasts
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Edit ${artist.name}`}
        >
          <Pencil className="size-4" />
        </button>
        <DeleteButton
          label={`${artist.name} (their songs, albums and podcasts are kept, just unlinked)`}
          disabled={busy}
          onConfirm={() => void run(() => fetch(`/api/admin/artists/${artist.id}`, { method: "DELETE" }))}
        />
      </div>
    </li>
  );
}

export function ArtistsManager({ artists }: { artists: ArtistRow[] }) {
  const [editing, setEditing] = React.useState<ArtistRow | "new" | null>(null);
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing("new")}>
        <Plus /> New artist
      </Button>
      {artists.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} onEdit={() => setEditing(a)} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No artists yet. Create the first one.</p>
      )}
      <EditorDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "New artist" : `Edit ${editing?.name ?? ""}`}
      >
        {editing && (
          <ArtistForm key={editing === "new" ? "new" : editing.id} artist={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
        )}
      </EditorDialog>
    </div>
  );
}
