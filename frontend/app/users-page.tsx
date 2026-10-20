"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Users, X } from "lucide-react";

type ManagedUser = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  createdAt: string;
};
type DialogState =
  | { kind: "create" }
  | { kind: "edit" | "password"; user: ManagedUser };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function responseData(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(" ")
      : data.message;
    throw new Error(message ?? "Não foi possível concluir a operação.");
  }
  return data;
}

function roleLabel(role: ManagedUser["role"]) {
  return role === "SUPER_ADMIN" ? "Super administrador" : "Administrador";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

export default function UsersPage({ token }: { token: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(await responseData(response));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar os usuários.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function openCreateDialog() {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setDialog({ kind: "create" });
  }

  function openUserDialog(kind: "edit" | "password", user: ManagedUser) {
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setDialog({ kind, user });
  }

  function closeDialog() {
    if (saving) return;
    setDialog(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function submitDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    setError("");
    setNotice("");

    if (dialog.kind !== "edit" && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      const isCreate = dialog.kind === "create";
      const isPassword = dialog.kind === "password";
      const url = isCreate
        ? `${API_URL}/users`
        : isPassword
          ? `${API_URL}/users/${dialog.user.id}/password`
          : `${API_URL}/users/${dialog.user.id}`;
      const body = isCreate ? { email, password } : isPassword ? { password } : { email };
      const response = await fetch(url, {
        method: isCreate ? "POST" : "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      await responseData(response);
      setDialog(null);
      setPassword("");
      setConfirmPassword("");
      setNotice(
        isCreate
          ? "Usuário criado."
          : isPassword
            ? "Senha redefinida."
            : "E-mail atualizado.",
      );
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setSaving(false);
    }
  }

  const dialogTitle =
    dialog?.kind === "create"
      ? "Novo usuário"
      : dialog?.kind === "edit"
        ? "Editar usuário"
        : "Redefinir senha";

  return (
    <section className="users-page">
      <div className="users-toolbar">
        <div>
          <h2>Usuários</h2>
          <p>Gerencie as contas de acesso ao AgroClaw.</p>
        </div>
        <button type="button" className="users-primary-button" onClick={openCreateDialog}>
          <Plus size={18} />
          Novo usuário
        </button>
      </div>

      {notice && <div className="users-notice" role="status">{notice}</div>}
      {error && !dialog && <div className="users-error" role="alert">{error}</div>}

      <div className="users-card">
        <div className="users-card-heading">
          <div className="users-heading-icon"><Users size={19} /></div>
          <div>
            <h3>Contas cadastradas</h3>
            <span>{users.length} usuário(s)</span>
          </div>
        </div>
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>USUÁRIO</th>
                <th>PERFIL</th>
                <th>DATA DE CRIAÇÃO</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="users-empty" colSpan={4}>Carregando usuários...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="users-empty" colSpan={4}>Nenhum usuário encontrado.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="users-identity">
                      <span className="users-avatar">{user.email.slice(0, 1).toUpperCase()}</span>
                      <span>{user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`users-role ${user.role === "SUPER_ADMIN" ? "super-admin" : ""}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td>{formatCreatedAt(user.createdAt)}</td>
                  <td>
                    <div className="users-actions">
                      <button type="button" className="users-action-button" onClick={() => openUserDialog("edit", user)}>
                        <Pencil size={15} />
                        Editar
                      </button>
                      <button type="button" className="users-action-button" onClick={() => openUserDialog("password", user)}>
                        <KeyRound size={15} />
                        Redefinir senha
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="users-permission-note">
        Novos usuários recebem o perfil Administrador. Somente o super administrador pode gerenciar contas.
      </p>

      {dialog && (
        <div className="users-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <section className="users-dialog" role="dialog" aria-modal="true" aria-labelledby="users-dialog-title">
            <header className="users-dialog-header">
              <div>
                <h2 id="users-dialog-title">{dialogTitle}</h2>
                <p>{dialog.kind === "password" ? `Defina uma nova senha para ${dialog.user.email}.` : "Os dados são salvos imediatamente no sistema."}</p>
              </div>
              <button type="button" className="users-dialog-close" onClick={closeDialog} aria-label="Fechar" disabled={saving}>
                <X size={19} />
              </button>
            </header>
            <form className="users-form" onSubmit={submitDialog}>
              {dialog.kind !== "password" && (
                <label className="users-field">
                  E-mail
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
              )}
              {dialog.kind !== "edit" && (
                <>
                  <label className="users-field">
                    {dialog.kind === "create" ? "Senha inicial" : "Nova senha"}
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>
                  <label className="users-field">
                    Confirmar senha
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>
                </>
              )}
              {error && <div className="users-error" role="alert">{error}</div>}
              <div className="users-dialog-actions">
                <button type="button" className="users-secondary-button" onClick={closeDialog} disabled={saving}>Cancelar</button>
                <button type="submit" className="users-primary-button" disabled={saving}>
                  {saving ? "Salvando..." : dialog.kind === "password" ? "Redefinir senha" : dialog.kind === "create" ? "Criar usuário" : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
