import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, MapPin, Package, Send, CheckCircle2, X, Truck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  component: TransactionDetail,
});

type TxStatus = "requested" | "scheduled" | "in_progress" | "completed" | "canceled";

function TransactionDetail() {
  const { id } = Route.useParams();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const txQuery = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id,status,requested_quantity,pickup_scheduled_at,pickup_address,notes,created_at,completed_at,contractor_id,recipient_id,material_id,materials(title,unit,pickup_address,pickup_city,pickup_state,photo_urls)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const eventsQuery = useQuery({
    queryKey: ["transaction-events", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transaction_events")
        .select("id,event_type,notes,created_at,actor_id")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["transaction-messages", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id,body,sender_id,created_at")
        .eq("transaction_id", id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // Realtime: messages + transaction updates
  useEffect(() => {
    const channel = supabase
      .channel(`tx:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `transaction_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["transaction-messages", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transaction_events", filter: `transaction_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["transaction-events", id] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["transaction", id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  const updateStatus = useMutation({
    mutationFn: async ({ status, patch, eventType, notes }: { status: TxStatus; patch?: Record<string, unknown>; eventType: string; notes?: string }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status, ...(patch ?? {}), ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("transaction_events").insert({ transaction_id: id, actor_id: user!.id, event_type: eventType, notes: notes ?? null });
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["transaction", id] });
      qc.invalidateQueries({ queryKey: ["transaction-events", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  if (txQuery.isLoading) {
    return (
      <AppShell title="Transaction">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const tx = txQuery.data;
  if (!tx) {
    return (
      <AppShell title="Transaction">
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Transaction not found.</CardContent></Card>
      </AppShell>
    );
  }

  const isContractor = user?.id === tx.contractor_id;
  const isRecipient = user?.id === tx.recipient_id;
  const status = tx.status as TxStatus;
  const material: any = tx.materials;

  return (
    <AppShell title={material?.title ?? "Transaction"}>
      <button onClick={() => navigate({ to: "/transactions" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All transactions
      </button>

      <PageHeader
        eyebrow="Donation request"
        title={material?.title ?? "Material"}
        description={`Requested ${Number(tx.requested_quantity)} ${material?.unit ?? ""} · ${new Date(tx.created_at).toLocaleString()}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Status</CardTitle>
              <StatusBadge status={status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusActions
                status={status}
                isContractor={isContractor}
                isRecipient={isRecipient}
                tx={tx}
                disabled={updateStatus.isPending}
                onAction={(payload) => updateStatus.mutate(payload)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pickup details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div>{tx.pickup_address ?? material?.pickup_address ?? "Address shared after scheduling"}</div>
                  {material?.pickup_city && <div className="text-muted-foreground">{material.pickup_city}{material.pickup_state ? `, ${material.pickup_state}` : ""}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span>{tx.pickup_scheduled_at ? new Date(tx.pickup_scheduled_at).toLocaleString() : "Not scheduled yet"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{Number(tx.requested_quantity)} {material?.unit}</span>
              </div>
              {tx.notes && <p className="pt-2 text-muted-foreground">{tx.notes}</p>}
              <div className="pt-2">
                <Link to="/materials/$id" params={{ id: tx.material_id }} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  View material listing →
                </Link>
              </div>
            </CardContent>
          </Card>

          <MessagesCard
            transactionId={id}
            userId={user?.id ?? null}
            messages={messagesQuery.data ?? []}
            disabled={status === "canceled" || status === "completed"}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              <Timeline events={eventsQuery.data ?? []} createdAt={tx.created_at} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatusActions({
  status,
  isContractor,
  isRecipient,
  tx,
  disabled,
  onAction,
}: {
  status: TxStatus;
  isContractor: boolean;
  isRecipient: boolean;
  tx: any;
  disabled: boolean;
  onAction: (p: { status: TxStatus; patch?: Record<string, unknown>; eventType: string; notes?: string }) => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [when, setWhen] = useState<string>(tx.pickup_scheduled_at ? toLocalInput(tx.pickup_scheduled_at) : "");
  const [address, setAddress] = useState<string>(tx.pickup_address ?? tx.materials?.pickup_address ?? "");

  if (status === "completed") {
    return <p className="text-sm text-muted-foreground">This donation is complete. Thanks for keeping materials out of the landfill.</p>;
  }
  if (status === "canceled") {
    return <p className="text-sm text-muted-foreground">This request was canceled.</p>;
  }

  const cancelBtn = (
    <Button variant="outline" disabled={disabled} onClick={() => onAction({ status: "canceled", eventType: "canceled" })}>
      <X className="mr-1 h-4 w-4" /> Cancel
    </Button>
  );

  return (
    <div className="space-y-3">
      {status === "requested" && isContractor && (
        <>
          {!showSchedule ? (
            <div className="flex flex-wrap gap-2">
              <Button disabled={disabled} onClick={() => setShowSchedule(true)}>
                <CalendarClock className="mr-1 h-4 w-4" /> Schedule pickup
              </Button>
              {cancelBtn}
            </div>
          ) : (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="when">Pickup date &amp; time</Label>
                <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr">Pickup address</Label>
                <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, state" />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={disabled || !when || !address.trim()}
                  onClick={() =>
                    onAction({
                      status: "scheduled",
                      patch: { pickup_scheduled_at: new Date(when).toISOString(), pickup_address: address.trim() },
                      eventType: "scheduled",
                      notes: `${new Date(when).toLocaleString()} @ ${address.trim()}`,
                    })
                  }
                >
                  Confirm
                </Button>
                <Button variant="ghost" onClick={() => setShowSchedule(false)}>Back</Button>
              </div>
            </div>
          )}
        </>
      )}

      {status === "requested" && isRecipient && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Waiting for the donor to confirm a pickup time.</p>
          {cancelBtn}
        </div>
      )}

      {status === "scheduled" && (
        <div className="flex flex-wrap gap-2">
          {isRecipient && (
            <Button disabled={disabled} onClick={() => onAction({ status: "in_progress", eventType: "picked_up", notes: "Pickup in progress" })}>
              <Truck className="mr-1 h-4 w-4" /> Mark picked up
            </Button>
          )}
          {isContractor && (
            <Button variant="outline" disabled={disabled} onClick={() => onAction({ status: "requested", patch: { pickup_scheduled_at: null }, eventType: "rescheduling", notes: "Reverted to requested to reschedule" })}>
              Reschedule
            </Button>
          )}
          {cancelBtn}
        </div>
      )}

      {status === "in_progress" && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={disabled} onClick={() => onAction({ status: "completed", eventType: "completed", notes: "Donation completed" })}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Mark completed
          </Button>
          {cancelBtn}
        </div>
      )}
    </div>
  );
}

function Timeline({ events, createdAt }: { events: any[]; createdAt: string }) {
  const items = [
    { event_type: "requested", created_at: createdAt, notes: "Request submitted" },
    ...events,
  ];
  return (
    <ol className="space-y-4">
      {items.map((e, i) => (
        <li key={e.id ?? `seed-${i}`} className="flex gap-3">
          <div className="mt-1 flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {i < items.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
          </div>
          <div className="pb-2">
            <div className="text-sm font-medium capitalize">{String(e.event_type).replaceAll("_", " ")}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
            {e.notes && <div className="mt-1 text-xs text-muted-foreground">{e.notes}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function MessagesCard({ transactionId, userId, messages, disabled }: { transactionId: string; userId: string | null; messages: any[]; disabled: boolean }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!body.trim() || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ transaction_id: transactionId, sender_id: userId, body: body.trim() });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Messages</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">No messages yet. Say hello 👋</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                    <div>{m.body}</div>
                    <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={disabled ? "Conversation closed" : "Write a message…"}
            rows={2}
            disabled={disabled || sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={() => void send()} disabled={disabled || sending || !body.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}