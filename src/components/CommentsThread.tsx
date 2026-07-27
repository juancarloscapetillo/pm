"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Send } from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string } | null;
  mentions: { user: { name: string } }[];
}

export default function CommentsThread({
  entityType,
  entityId,
  members,
}: {
  entityType: "TASK" | "WORK_ACTIVITY" | "INCIDENT" | "PROJECT";
  entityId: string;
  members: Member[];
}) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [body, setBody] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function submit() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ entityType, entityId, body, mentionUserIds: mentionIds }),
    });
    setSending(false);
    if (res.ok) {
      setBody("");
      setMentionIds([]);
      load();
      toast.success("Comentario agregado");
    } else {
      toast.error("No se pudo agregar el comentario");
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Comentarios</h3>
      {loading && <p className="text-sm text-gray-400">Cargando...</p>}
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{c.author?.name ?? "Usuario"}</span>
              <span className="text-xs text-gray-400">{format(new Date(c.createdAt), "d MMM, HH:mm", { locale: es })}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.body}</p>
            {c.mentions.length > 0 && (
              <div className="text-xs text-calume-navy mt-1">
                Mencionó a {c.mentions.map((m) => m.user.name).join(", ")}
              </div>
            )}
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-sm text-gray-400">Sin comentarios todavía.</p>}
      </div>

      <textarea
        className="input min-h-[70px]"
        placeholder="Escribe un comentario..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setMentionIds((ids) => (ids.includes(m.id) ? ids.filter((id) => id !== m.id) : [...ids, m.id]))
              }
              className={`text-xs px-2 py-1 rounded-full border ${
                mentionIds.includes(m.id)
                  ? "bg-calume-navy text-white border-calume-navy"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              @{m.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <button className="btn-primary btn-sm" onClick={submit} disabled={sending || !body.trim()}>
          <Send size={14} /> Comentar
        </button>
      </div>
    </div>
  );
}
