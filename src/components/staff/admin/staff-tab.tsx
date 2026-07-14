"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS } from "@/lib/constants";
import { deleteStaff, fetchStaff, updateStaffRole } from "@/lib/data";
import type { Role, StaffMember } from "@/lib/types";
import {
  Check,
  Copy,
  Info,
  KeyRound,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  PasswordForm,
  STAFF_ROLES,
  StaffForm,
  type Credentials,
} from "./staff-form";

const ROLE_BADGE: Record<Role, string> = {
  admin: "border-primary/30 bg-primary/10 text-primary",
  kitchen: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  courier: "border-violet-500/30 bg-violet-500/15 text-violet-400",
  customer: "border-line bg-surface-2 text-muted",
};

const SELF_TITLE = "Свою роль и учётку изменить нельзя";

/** Плашка с логином и паролем: пароль показывается один раз, его надо скопировать. */
function CredentialsNote({
  title,
  credentials,
  onClose,
}: {
  title: string;
  credentials: Credentials;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const copy = async () => {
    const text = `Логин: ${credentials.email} / Пароль: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен (например, сайт открыт не по https) — покажем пароль текстом
      setCopyFailed(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold break-all">{title}</p>
        <p className="break-all text-emerald-300/80">
          Пароль: {copyFailed ? credentials.password : "••••••••"} — сохраните
          его, посмотреть повторно не получится.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="success" size="sm" onClick={copy}>
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Скопировано" : "Скопировать логин и пароль"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Скрыть"
          className="cursor-pointer rounded-btn p-1.5 text-emerald-300/70 transition-colors hover:bg-white/5 hover:text-emerald-200"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function StaffTab() {
  const { demo, user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<StaffMember | null>(null);
  const [notice, setNotice] = useState<
    { title: string; credentials: Credentials } | null
  >(null);

  const load = useCallback(() => {
    fetchStaff()
      .then((list) => {
        setStaff(list);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : "Не удалось загрузить сотрудников",
        );
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (member: StaffMember, role: Role) => {
    setBusyId(member.id);
    setError(null);
    try {
      await updateStaffRole(member.id, role);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сменить роль");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: StaffMember) => {
    const who = member.name || member.email;
    if (
      !window.confirm(
        `Удалить сотрудника «${who}»? Войти в панель он больше не сможет.`,
      )
    ) {
      return;
    }
    setBusyId(member.id);
    setError(null);
    try {
      await deleteStaff(member.id);
      load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось удалить сотрудника",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {demo && (
        <div className="flex items-start gap-2.5 rounded-card border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Демо-режим.</span> Supabase не
            подключён: учётки ненастоящие и хранятся в этом браузере, пароль не
            сохраняется, а вход в панель сейчас не требуется. Список ниже нужен,
            чтобы посмотреть, как всё работает.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {staff
            ? `Сотрудников: ${staff.length}`
            : "Учётки сотрудников заводит администратор"}
        </p>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Добавить сотрудника
        </Button>
      </div>

      {notice && (
        <CredentialsNote
          title={notice.title}
          credentials={notice.credentials}
          onClose={() => setNotice(null)}
        />
      )}

      {error && (
        <p className="rounded-card border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {error}
        </p>
      )}

      {!staff && !error && <PageLoader label="Загружаем сотрудников…" />}

      {staff && staff.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <UserRound
              className="mx-auto mb-4 size-10 text-muted/60"
              aria-hidden
            />
            <p className="text-sm text-muted">
              Сотрудников пока нет. Нажмите «Добавить сотрудника»: задайте email,
              пароль и роль — учётка заработает сразу.
            </p>
          </CardBody>
        </Card>
      )}

      {staff && staff.length > 0 && (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {staff.map((s) => {
              const isSelf = s.id === user?.id;
              const busy = busyId === s.id;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                      <UserRound className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        <span className="truncate">{s.name || "Без имени"}</span>
                        {isSelf && (
                          <span className="text-xs font-normal text-muted">
                            (вы)
                          </span>
                        )}
                        <Badge className={ROLE_BADGE[s.role]}>
                          {ROLE_LABELS[s.role]}
                        </Badge>
                      </p>
                      <p className="break-all text-xs text-muted">{s.email}</p>
                      <p className="truncate text-xs text-muted">
                        {s.phone || "Телефон не указан"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={s.role}
                      aria-label={`Роль: ${s.name || s.email}`}
                      className="w-full sm:w-40"
                      disabled={isSelf || busy}
                      title={isSelf ? SELF_TITLE : undefined}
                      onChange={(e) => changeRole(s, e.target.value as Role)}
                    >
                      {/* customer в списке не предлагаем, но чужую роль показать надо */}
                      {s.role === "customer" && (
                        <option value="customer">
                          {ROLE_LABELS.customer}
                        </option>
                      )}
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </Select>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        disabled={busy}
                        onClick={() => setPasswordFor(s)}
                        title="Задать новый пароль"
                      >
                        <KeyRound className="size-3.5" aria-hidden />
                        Пароль
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        disabled={isSelf || busy}
                        title={isSelf ? SELF_TITLE : undefined}
                        onClick={() => remove(s)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {formOpen && (
        <StaffForm
          onClose={() => setFormOpen(false)}
          onCreated={(credentials) => {
            setNotice({
              title: `Сотрудник добавлен. Логин: ${credentials.email}`,
              credentials,
            });
            load();
          }}
        />
      )}

      {passwordFor && (
        <PasswordForm
          member={passwordFor}
          onClose={() => setPasswordFor(null)}
          onSaved={(credentials) => {
            setNotice({
              title: `Пароль обновлён. Логин: ${credentials.email}`,
              credentials,
            });
          }}
        />
      )}
    </div>
  );
}
