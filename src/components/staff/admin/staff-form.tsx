"use client";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_LABELS } from "@/lib/constants";
import { createStaff, setStaffPassword } from "@/lib/data";
import type { Role, StaffMember } from "@/lib/types";
import { Eye, EyeOff, RefreshCw, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

/** Роли, которые может выдать админ. `customer` — не роль сотрудника. */
export const STAFF_ROLES: Role[] = ["kitchen", "courier", "admin"];

const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Учётные данные, которые показываем админу один раз после создания/смены пароля. */
export interface Credentials {
  email: string;
  password: string;
}

/**
 * Пароль вида Lagman-K7QP: без похожих символов (0/O, 1/I/l),
 * чтобы его можно было продиктовать сотруднику голосом.
 */
export function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `Lagman-${tail}`;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <Card className="my-4 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardBody>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h3 className="font-heading text-lg font-extrabold uppercase">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="cursor-pointer rounded-btn p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-btn border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
      {children}
    </p>
  );
}

/** Поле пароля: показать/скрыть глазом + генератор случайного пароля. */
function PasswordField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <Label htmlFor={id}>Пароль *</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Input
            id={id}
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Минимум 6 символов"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            className="pr-11"
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-btn text-muted transition-colors hover:text-white"
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            title={show ? "Скрыть пароль" : "Показать пароль"}
          >
            {show ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            onChange(generatePassword());
            setShow(true);
          }}
          title="Сгенерировать случайный пароль"
        >
          <RefreshCw className="size-4" aria-hidden />
          Сгенерировать
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Запишите пароль: после сохранения его уже не посмотреть, можно только
        задать новый.
      </p>
    </div>
  );
}

interface StaffFormProps {
  onClose: () => void;
  /** Отдаём наверх логин и пароль — показать их админу один раз. */
  onCreated: (credentials: Credentials) => void;
}

/** Создание учётки сотрудника: админ сам задаёт email, пароль и роль. */
export function StaffForm({ onClose, onCreated }: StaffFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("kitchen");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError("Укажите имя сотрудника");
      return;
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setError("Укажите корректный email — на него сотрудник будет входить");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setSaving(true);
    try {
      await createStaff({
        email: cleanEmail,
        password,
        name: cleanName,
        phone: cleanPhone,
        role,
      });
      onCreated({ email: cleanEmail, password });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось добавить сотрудника",
      );
      setSaving(false);
    }
  };

  return (
    <Modal title="Добавить сотрудника" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Учётка заработает сразу — подтверждать почту не нужно. Передайте
          сотруднику логин и пароль, и он сможет войти в панель.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="staff-name">Имя *</Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, Асхат"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <Label htmlFor="staff-phone">Телефон</Label>
            <Input
              id="staff-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 707 000 0000"
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="staff-email">Email *</Label>
          <Input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kuhnya@lagman.kz"
            autoComplete="off"
            required
          />
        </div>

        <PasswordField
          id="staff-password"
          value={password}
          onChange={setPassword}
        />

        <div>
          <Label htmlFor="staff-role">Роль *</Label>
          <Select
            id="staff-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner className="size-4" />}
            Добавить сотрудника
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface PasswordFormProps {
  member: StaffMember;
  onClose: () => void;
  /** Новый пароль — показать админу, чтобы он передал его сотруднику. */
  onSaved: (credentials: Credentials) => void;
}

/** Смена пароля сотруднику (в том числе себе). */
export function PasswordForm({ member, onClose, onSaved }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setSaving(true);
    try {
      await setStaffPassword(member.id, password);
      onSaved({ email: member.email, password });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сменить пароль",
      );
      setSaving(false);
    }
  };

  return (
    <Modal title="Сменить пароль" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Новый пароль для{" "}
          <span className="break-all font-semibold text-white">
            {member.email}
          </span>
          . Старый перестанет работать сразу.
        </p>

        <PasswordField
          id="staff-new-password"
          value={password}
          onChange={setPassword}
        />

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner className="size-4" />}
            Сохранить пароль
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  );
}
