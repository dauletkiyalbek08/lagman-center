"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/types";
import { Info, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as Array<[Role, string]>;

export function StaffTab() {
  const { demo, user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (demo) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, role, name, phone")
      .order("created_at")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          return;
        }
        setError(null);
        setProfiles((data as Profile[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [demo, reloadKey]);

  if (demo) {
    return (
      <Card>
        <CardBody className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold">
              Управление ролями доступно после подключения Supabase.
            </p>
            <p className="text-muted">
              Сотрудник регистрируется на сайте, а вы назначаете ему роль
              здесь.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const changeRole = async (id: string, role: Role) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusyId(id);
    const { error: err } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (err) alert(err.message);
    setReloadKey((k) => k + 1);
    setBusyId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Сотрудник сначала регистрируется на сайте (
          <span className="text-white">/register</span>), затем назначьте ему
          роль в списке ниже.
        </p>
      </div>

      {error && (
        <p className="rounded-card border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          Не удалось загрузить профили: {error}
        </p>
      )}

      {!profiles && !error && <PageLoader label="Загружаем профили…" />}

      {profiles && profiles.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <UserRound
              className="mx-auto mb-4 size-10 text-muted/60"
              aria-hidden
            />
            <p className="text-sm text-muted">
              Пока нет зарегистрированных пользователей.
            </p>
          </CardBody>
        </Card>
      )}

      {profiles && profiles.length > 0 && (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {profiles.map((p) => {
              const isSelf = p.id === user?.id;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                    <UserRound className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {p.name || "Без имени"}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-muted">
                          (вы)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {p.phone || "Телефон не указан"}
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <Select
                      value={p.role}
                      aria-label={`Роль: ${p.name || p.phone || p.id}`}
                      disabled={isSelf || busyId === p.id}
                      onChange={(e) => changeRole(p.id, e.target.value as Role)}
                      title={
                        isSelf ? "Свою роль изменить нельзя" : undefined
                      }
                    >
                      {ROLE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
