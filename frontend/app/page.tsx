'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import FolderManager from '../components/FolderManager';
import FarmEditModal from '../components/FarmEditModal';
import FarmWizard from '../components/FarmWizard';
import { ChecklistCategoryFieldset } from './checklist-category-fieldset';
import { farmDocumentRows } from './farm-document-rows';
import { Bell, Bot, Calendar, Check, ChevronLeft, ChevronRight, Cpu, FileText, Folder, Info, Menu, Paperclip, Pencil, Plus, Search, Send, Settings, Sprout, Tractor, Trash2, Users, X } from 'lucide-react';

type Tab = 'agente-ia' | 'fazendas' | 'agenda' | 'pastas';
type Farm = { id: string; name: string; location: string; areaHectares: string | number; culture: string; status: string; coverImage?: string | null; checklist?: { id: string; documentKey: string; label?: string; documentDate?: string | null; dueDate?: string | null; renewalComments?: string | null; renewalDate?: string | null; documentStatus?: string | null }[]; documents?: { originalName: string; checklistDocumentKey?: string | null }[] };
type Obligation = { id: string; title: string; dueDate: string; priority: string; completed: boolean };
type Message = { sender: 'user' | 'ai'; content: string; time: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const farmDocumentGroups = farmDocumentRows.reduce<{ abbreviation: string; rows: typeof farmDocumentRows }[]>((groups, row) => { if (row.abbreviation || groups.length === 0) groups.push({ abbreviation: row.abbreviation, rows: [] }); groups[groups.length - 1].rows.push(row); return groups; }, []);
const pageMeta: Record<Tab, { title: string; subtitle: string }> = {
  'agente-ia': { title: 'Agente IA', subtitle: 'Converse com seu assistente agronômico' },
  fazendas: { title: 'Fazendas', subtitle: 'Gerencie suas propriedades rurais' },
  agenda: { title: 'Agenda', subtitle: 'Calendário e tarefas da fazenda' },
  pastas: { title: 'Pastas', subtitle: 'Arquivos e documentos organizados' },
};

function formatDate(value: string) { return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR'); }
function normalizeDocumentName(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); }
function FarmDatePicker({ value, disabled, onChange }: { value?: string | null; disabled?: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [noDate, setNoDate] = useState(!value);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const parsed = typeof value === 'string' && value ? new Date(`${value.slice(0, 10)}T12:00:00`) : null;
  const validDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  const [day, setDay] = useState(validDate?.getDate() ?? new Date().getDate());
  const [month, setMonth] = useState(validDate?.getMonth() ?? new Date().getMonth());
  const [year, setYear] = useState(validDate?.getFullYear() ?? new Date().getFullYear());
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const years = Array.from({ length: 81 }, (_, index) => new Date().getFullYear() + 20 - index);
  const days = new Date(year, month + 1, 0).getDate();

  function chooseDate(nextDay = day, nextMonth = month, nextYear = year) {
    const safeDay = Math.min(nextDay, new Date(nextYear, nextMonth + 1, 0).getDate());
    setNoDate(false);
    setDay(safeDay);
    setMonth(nextMonth);
    setYear(nextYear);
    onChange(`${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
  }

  function openPicker() {
    if (disabled) return;
    const current = validDate ?? new Date();
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (trigger) {
      setPopoverPosition({
        top: trigger.bottom + 8,
        left: Math.max(16, Math.min(trigger.left, window.innerWidth - 456)),
      });
    }
    setDay(current.getDate());
    setMonth(current.getMonth());
    setYear(current.getFullYear());
    setOpen(true);
  }

  return <div className="farm-date-picker">
    <div className="farm-date-field">
      <button ref={triggerRef} type="button" className={`farm-information-input farm-date-trigger ${noDate ? 'indeterminate' : ''}`} onClick={openPicker} disabled={disabled} aria-expanded={open}>
      {noDate ? 'Indeterminado' : validDate ? `${String(validDate.getDate()).padStart(2, '0')}/${String(validDate.getMonth() + 1).padStart(2, '0')}/${validDate.getFullYear()}` : 'dd/mm/aaaa'}
      <Calendar size={16} />
      </button>
    </div>
    {open && <div className="farm-date-popover" style={{ top: popoverPosition.top, left: popoverPosition.left }}>
      <div className="farm-date-columns">
        <div className="farm-date-column"><span>Dia</span><div>{Array.from({ length: days }, (_, index) => index + 1).map(item => <button type="button" className={item === day ? 'selected' : ''} key={item} onClick={() => chooseDate(item)}>{String(item).padStart(2, '0')}</button>)}</div></div>
        <div className="farm-date-column farm-date-month-column"><span>Mês</span><div>{months.map((item, index) => <button type="button" className={index === month ? 'selected' : ''} key={item} onClick={() => chooseDate(day, index)}>{item}</button>)}</div></div>
        <div className="farm-date-column"><span>Ano</span><div>{years.map(item => <button type="button" className={item === year ? 'selected' : ''} key={item} onClick={() => chooseDate(day, month, item)}>{item}</button>)}</div></div>
      </div>
      <span className="farm-date-no-date"><input type="checkbox" checked={noDate} disabled={disabled} onChange={event => { const checked = event.target.checked; setNoDate(checked); setOpen(false); if (checked) onChange(''); }} /> Indeterminado</span>
      <div className="farm-date-actions"><button type="button" className="btn btn-ghost" onClick={() => { onChange(''); setOpen(false); }}>Limpar</button><button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>Salvar</button></div>
    </div>}
  </div>;
}
function coverFor(farm: Farm) { return farm.coverImage?.startsWith('data:image/') || farm.coverImage?.startsWith('/') ? farm.coverImage : farm.coverImage?.startsWith('fazenda_') ? `/${farm.coverImage}` : '/fazenda_sol_nascente.png'; }

export default function Home({ initialTab = 'agente-ia' }: { initialTab?: Tab }) {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => setToken(window.localStorage.getItem('agroclaw_token')), []);
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        window.localStorage.removeItem('agroclaw_token');
        setToken(null);
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error('E-mail ou senha inválidos.');
      const data = await response.json(); window.localStorage.setItem('agroclaw_token', data.accessToken); setToken(data.accessToken);
    } catch (error) { setLoginError(error instanceof Error ? error.message : 'Não foi possível entrar.'); }
    finally { setLoginLoading(false); }
  }

  if (token === null) return <LoginPage email={email} password={password} setEmail={setEmail} setPassword={setPassword} error={loginError} loading={loginLoading} onSubmit={login} />;
  return <Dashboard token={token} tab={tab} setTab={setTab} onLogout={() => { window.localStorage.removeItem('agroclaw_token'); setToken(null); }} />;
}

function LoginPage(props: { email: string; password: string; setEmail: (v: string) => void; setPassword: (v: string) => void; error: string; loading: boolean; onSubmit: (e: FormEvent) => void }) {
  return <main className="login-page"><section className="login-card">
    <div className="login-brand"><div className="brand-icon"><Sprout size={24} /></div><div><strong>AgroClaw</strong><span>Farm Manager</span></div></div>
    <h1>Acessar sistema</h1><p>Entre com o usuário administrador para continuar.</p>
    <form className="login-form" onSubmit={props.onSubmit}>
      <label>E-mail<input type="email" value={props.email} onChange={e => props.setEmail(e.target.value)} required /></label>
      <label>Senha<input type="password" value={props.password} onChange={e => props.setPassword(e.target.value)} required /></label>
      {props.error && <div className="login-error">{props.error}</div>}
      <button type="submit" disabled={props.loading}>{props.loading ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </section></main>;
}

function Dashboard({ token, tab, setTab, onLogout }: { token: string; tab: Tab; setTab: (tab: Tab) => void; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = pageMeta[tab];
  return <div className="app-layout">
    {mobileOpen && <div className="sidebar-overlay visible" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand"><div className="brand-icon"><Sprout color="white" /></div><div className="brand-text"><span className="brand-name">AgroClaw</span><span className="brand-tagline">Farm Manager</span></div></div>
      <nav className="sidebar-nav"><div className="sidebar-section-label">Principal</div>
        <NavItem icon={<Bot />} label="Agente IA" active={tab === 'agente-ia'} badge="Novo" onClick={() => { setTab('agente-ia'); setMobileOpen(false); }} />
        <NavItem icon={<Tractor />} label="Fazendas" active={tab === 'fazendas'} badge="" onClick={() => { setTab('fazendas'); setMobileOpen(false); }} />
        <NavItem icon={<Calendar />} label="Agenda" active={tab === 'agenda'} onClick={() => { setTab('agenda'); setMobileOpen(false); }} />
        <NavItem icon={<Folder />} label="Pastas" active={tab === 'pastas'} onClick={() => { setTab('pastas'); setMobileOpen(false); }} />
      </nav>
      <div className="sidebar-footer"><div className="user-profile"><div className="user-avatar">RA</div><div className="user-info"><span className="user-name">Administrador</span><span className="user-role">Administrador</span></div><button className="user-settings-btn" aria-label="Sair" onClick={onLogout}><Settings size={16} /></button></div></div>
    </aside>
    <main className="main-content"><header className="main-header"><div className="header-left"><button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Menu"><Menu /></button><h1 className="page-title">{meta.title}</h1><span className="page-subtitle">{meta.subtitle}</span></div><div className="header-right"><div className="header-search"><Search size={16} /><input placeholder="Buscar..." /><span className="search-shortcut">Ctrl+K</span></div><button className="header-btn" aria-label="Notificações"><Bell size={18} /><span className="notification-dot" /></button></div></header>
      <div className="content-body"><TabContent tab={tab} token={token} /></div>
    </main>
  </div>;
}

function NavItem({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active: boolean; badge?: string; onClick: () => void }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span className="nav-label">{label}</span>{badge && <span className="nav-badge">{badge}</span>}</button>; }

function TabContent({ tab, token }: { tab: Tab; token: string }) {
  if (tab === 'fazendas') return <FarmsPage token={token} />;
  if (tab === 'agenda') return <AgendaPage token={token} />;
  if (tab === 'pastas') return <FoldersPage token={token} />;
  return <AiPage token={token} />;
}

function AiPage({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([{ sender: 'ai', content: 'Olá! Sou seu assistente de inteligência artificial para gerenciamento de Fazendas.\n\nComo posso ajudar você hoje?', time: 'agora' }]);
  const [input, setInput] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [model, setModel] = useState('llama-3.3-70b-versatile'); const [attachment, setAttachment] = useState<File | null>(null); const [attachmentText, setAttachmentText] = useState('');
  useEffect(() => { fetch(`${API_URL}/ai/messages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).then(data => setMessages(data.map((item: { sender: 'user' | 'ai'; content: string; createdAt: string }) => ({ sender: item.sender, content: item.content, time: new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) })))).catch(() => undefined); }, [token]);
  async function send(content = input) { if ((!content.trim() && !attachment) || loading) return; const text = content.trim() || `📎 ${attachment?.name}`; const prompt = attachmentText ? `${text}\n\nConteúdo do arquivo anexado:\n${attachmentText}` : text; setInput(''); setAttachment(null); setAttachmentText(''); setMessages(old => [...old, { sender: 'user', content: text, time: 'agora' }]); setLoading(true); setError(''); try { const r = await fetch(`${API_URL}/ai/messages`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: prompt, model, attachmentText }) }); const data = await r.json(); if (!r.ok) throw new Error(data.message ?? 'Não foi possível consultar a IA.'); setMessages(old => [...old, { sender: 'ai', content: data.content, time: 'agora' }]); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao consultar a IA.'); } finally { setLoading(false); } }
  return <div id="tab-agente-ia" className="tab-page active"><div className="chat-header-bar"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Cpu size={18} color="var(--accent-primary)" /><b>Modelo IA</b><select value={model} onChange={e => setModel(e.target.value)}><option value="llama-3.3-70b-versatile">Llama 3.3 70B</option><option value="qwen/qwen3.6-27b">Qwen 3.6 27B</option><option value="llama-3.1-8b-instant">Llama 3.1 8B</option><option value="mixtral-8x7b-32768">Mixtral 8x7B</option><option value="gemma2-9b-it">Gemma 2 9B</option></select></div><button className="btn btn-outline" onClick={async () => { await fetch(`${API_URL}/ai/messages`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setMessages([]); }}><Trash2 size={14} /> Limpar Chat</button></div><div className="chat-container"><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.sender}`} key={`${index}-${message.time}`}><div className="message-avatar">{message.sender === 'ai' ? <Sprout size={16} color="white" /> : 'R'}</div><div className="message-content"><div className="message-header"><span className="message-sender">{message.sender === 'ai' ? 'AgroClaw IA' : 'Você'}</span><span className="message-time">{message.time}</span></div><div className="message-body"><p>{message.content}</p></div></div></div>)}{loading && <div className="chat-message ai"><div className="message-avatar"><Sprout size={16} color="white" /></div><div className="typing-indicator"><span /><span /><span /></div></div>}</div><div className="chat-input-area"><div className="chat-input-wrapper"><div className="chat-input-row"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Pergunte algo sobre suas fazendas..." rows={1} /><div className="chat-input-actions"><input id="ai-attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt" hidden onChange={event => { const file = event.target.files?.[0] ?? null; setAttachment(file); if (file && (file.name.endsWith('.txt') || file.name.endsWith('.csv'))) { const reader = new FileReader(); reader.onload = loaded => setAttachmentText(String(loaded.target?.result ?? '')); reader.readAsText(file); } else setAttachmentText(''); }} /><button className="input-action-btn" aria-label="Anexar arquivo" onClick={() => document.getElementById('ai-attachment')?.click()}><Paperclip size={18} /></button><button className="send-btn" onClick={() => send()} disabled={(!input.trim() && !attachment) || loading}><Send size={16} /></button></div></div></div>{error && <div className="login-error" style={{ marginTop: 8 }}>{error}</div>}<div className="chat-disclaimer">AgroClaw IA pode gerar informações imprecisas. Verifique sempre dados críticos.</div></div></div></div>;
}

function FarmsPage({ token }: { token: string }) {
  const [farms, setFarms] = useState<Farm[]>([]); const [error, setError] = useState(''); const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null); const [editingFarm, setEditingFarm] = useState<Farm | null>(null); const [wizardOpen, setWizardOpen] = useState(false);
  useEffect(() => { fetch(`${API_URL}/farms`, { headers: { Authorization: `Bearer ${token}` } }).then(async r => { if (!r.ok) throw new Error('Não foi possível carregar as fazendas.'); return r.json(); }).then(setFarms).catch(e => setError(e.message)); }, [token]);
  const hectares = useMemo(() => farms.reduce((sum, farm) => sum + Number(farm.areaHectares), 0), [farms]);
  async function deleteFarm(farm: Farm) { if (!window.confirm(`Deseja excluir a fazenda "${farm.name}"?`)) return; const response = await fetch(`${API_URL}/farms/${farm.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (response.ok) setFarms(old => old.filter(item => item.id !== farm.id)); else setError('Não foi possível excluir a fazenda.'); }
  return <div id="tab-fazendas" className="tab-page active"><div className="fazendas-header"><div><h2>Suas Fazendas</h2><button className="btn btn-primary" onClick={() => setWizardOpen(true)}><Plus size={16} /> Nova Fazenda</button></div><div className="fazendas-stats"><div className="stat-item"><span className="stat-value">{farms.length}</span><span className="stat-label">Fazendas</span></div><div className="stat-item"><span className="stat-value">{hectares.toLocaleString('pt-BR')}</span><span className="stat-label">Hectares</span></div></div></div>{error && <div className="login-error">{error}</div>}<div className="fazendas-grid">{farms.map(farm => <div className="fazenda-card" key={farm.id}><div className="fazenda-cover"><Image src={coverFor(farm)} alt={farm.name} width={640} height={280} /><div className="farm-card-actions"><button aria-label="Editar fazenda" title="Editar fazenda" onClick={() => setEditingFarm(farm)}><Pencil size={16} /></button><button aria-label="Excluir fazenda" title="Excluir fazenda" onClick={() => deleteFarm(farm)}><Trash2 size={16} /></button></div></div><div className="fazenda-body"><h3 className="fazenda-name">{farm.name}</h3><div className="fazenda-location"><Search size={12} /> {farm.location}</div><div className="fazenda-metrics"><div className="metric"><div className="metric-value">{farm.areaHectares}ha</div><div className="metric-label">Área</div></div><div className="metric"><div className="metric-value">{farm.culture}</div><div className="metric-label">Cultura</div></div><div className="metric"><div className="metric-value">{farm.checklist?.length ?? 0}</div><div className="metric-label">Documentos</div></div></div><div className="fazenda-actions"><button className="btn btn-primary" onClick={() => setSelectedFarm(farm)}>Ver Detalhes</button></div></div></div>)}</div>{selectedFarm && <FarmDetailsModal farm={selectedFarm} token={token} onClose={() => setSelectedFarm(null)} />}{wizardOpen && <FarmWizard token={token} open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={async () => { setWizardOpen(false); const response = await fetch(`${API_URL}/farms`, { headers: { Authorization: `Bearer ${token}` } }); if (response.ok) setFarms(await response.json()); }} />}{editingFarm && <FarmEditModal farm={editingFarm} token={token} onClose={() => setEditingFarm(null)} onSaved={updated => { setFarms(old => old.map(item => item.id === updated.id ? { ...item, ...updated } : item)); setEditingFarm(null); }} />}</div>;
}

function FarmDetailsModal({ farm, token, onClose }: { farm: Farm; token: string; onClose: () => void }) {
  const [activeBlock, setActiveBlock] = useState<'documentos' | 'maquinas' | 'funcionarios' | null>(null); const [documentsModalOpen, setDocumentsModalOpen] = useState(false); const [informationModalOpen, setInformationModalOpen] = useState(false); const [hoveredDocumentGroup, setHoveredDocumentGroup] = useState<number | null>(null); const [documentSearch, setDocumentSearch] = useState('');
  const [documentFolders, setDocumentFolders] = useState<{ id: string; name: string; parentFolderId?: string | null }[]>([]); const [editableChecklist, setEditableChecklist] = useState(farm.checklist ?? []);
  useEffect(() => { if (activeBlock !== 'documentos') return; fetch(`${API_URL}/folders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).then(data => setDocumentFolders(data.filter((folder: { farmId?: string | null; name: string }) => folder.farmId === farm.id))).catch(() => undefined); }, [activeBlock, farm.id, token]);
  async function updateChecklistField(itemId: string, field: 'documentDate' | 'dueDate' | 'renewalComments' | 'renewalDate' | 'documentStatus', value: string) { setEditableChecklist(items => items.map(item => item.id === itemId ? { ...item, [field]: value || null } : item)); await fetch(`${API_URL}/farms/${farm.id}/checklist/${itemId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value || null }) }); }
  return <div className="modal-overlay visible" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card farm-overview-modal"><div className="modal-header"><h2>{farm.name}</h2><button className="modal-close-btn" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div><div className="modal-body"><div className="modal-grid"><div><div className="modal-cover-img"><Image src={coverFor(farm)} alt={farm.name} width={640} height={280} /></div><div className="modal-meta-list"><div className="modal-meta-item"><span className="meta-label">Localização</span><span className="meta-value">{farm.location}</span></div><div className="modal-meta-item"><span className="meta-label">Área Total</span><span className="meta-value">{farm.areaHectares} ha</span></div><div className="modal-meta-item"><span className="meta-label">Cultura Ativa</span><span className="meta-value">{farm.culture}</span></div><div className="modal-meta-item"><span className="meta-label">Status</span><span className="meta-value">{farm.status}</span></div></div></div><div><h3>Panorama da Fazenda</h3><p className="modal-docs-intro">Selecione uma área para continuar.</p><div className="farm-overview-blocks"><button className={`farm-overview-block ${activeBlock === 'documentos' ? 'active' : ''}`} onClick={() => { setActiveBlock('documentos'); setDocumentsModalOpen(true); }}><FileText size={24} /><span><strong>Documentos</strong></span></button><button className={`farm-overview-block ${activeBlock === 'maquinas' ? 'active' : ''}`} onClick={() => setActiveBlock('maquinas')}><Tractor size={24} /><span><strong>Máquinas</strong></span></button><button className={`farm-overview-block ${activeBlock === 'funcionarios' ? 'active' : ''}`} onClick={() => setActiveBlock('funcionarios')}><Users size={24} /><span><strong>Funcionários</strong></span></button><button className="farm-overview-block" type="button"><Calendar size={24} /><span><strong>Calendário</strong></span></button><button className="farm-overview-block" type="button" onClick={() => setInformationModalOpen(true)}><Info size={24} /><span><strong>Informações da Fazenda</strong></span></button></div>{activeBlock === 'documentos' && documentsModalOpen && <div className="nested-document-modal"><div className="nested-document-modal-header"><strong>Documentos da Fazenda</strong><div><span>{farm.checklist?.length ?? 0} checklist(s)</span><button className="modal-close-btn" onClick={() => setDocumentsModalOpen(false)} aria-label="Fechar documentos"><X size={18} /></button></div></div><fieldset className="documents-fieldset"><legend>Documentos da Fazenda</legend><div className="document-search-block"><Search size={17} /><input value={documentSearch} onChange={event => setDocumentSearch(event.target.value)} placeholder="Pesquisar documento..." aria-label="Pesquisar documento" />{documentSearch && <button type="button" onClick={() => setDocumentSearch('')} aria-label="Limpar pesquisa"><X size={15} /></button>}</div><div className="documents-category-list"><ChecklistCategoryFieldset title="DOCUMENTOS DA PROPRIEDADE" prefix="prop_" farm={farm} folders={documentFolders} search={documentSearch} /><ChecklistCategoryFieldset title="DOCUMENTOS AMBIENTAIS" prefix="amb_" farm={farm} folders={documentFolders} search={documentSearch} /><ChecklistCategoryFieldset title="DOCUMENTOS PECUARIOS - ADAB" prefix="pec_" farm={farm} folders={documentFolders} search={documentSearch} /></div><div className="farm-checklist-links legacy-document-list">{farm.checklist?.length ? farm.checklist.filter(item => (item.label ?? item.documentKey).toLocaleLowerCase('pt-BR').includes(documentSearch.toLocaleLowerCase('pt-BR'))).map(item => { const folder = documentFolders.find(candidate => candidate.name === (item.label ?? item.documentKey) && candidate.parentFolderId); return <button className="farm-checklist-link" key={item.documentKey} disabled={!folder} onClick={() => { if (folder) window.location.href = `/pastas?farmId=${farm.id}&folderId=${folder.id}`; }}><FileText size={18} /><span>{item.label ?? item.documentKey}</span><span className="farm-checklist-arrow">{folder ? 'Abrir pasta →' : 'Pasta indisponível'}</span></button>; }) : <p className="text-muted">Nenhum item de checklist cadastrado.</p>}</div></fieldset></div>}{informationModalOpen && <div className="nested-document-modal farm-information-modal"><div className="nested-document-modal-header"><strong>Informações da Fazenda</strong><button className="modal-close-btn" onClick={() => setInformationModalOpen(false)} aria-label="Fechar informações"><X size={18} /></button></div><div className="farm-information-table-wrap"><table className="farm-information-table"><thead><tr><th>ABREVIATURA</th><th>NOMES</th><th>DATA DO DOCUMENTO</th><th>DATA DE VENCIMENTO</th><th>COMENTARIOS DA RENOVAÇÃO</th><th>DATA DA RENOVAÇÃO</th><th>SITUAÇÃO DO DOCUMENTO</th></tr></thead><tbody>{farmDocumentGroups.map((group, groupIndex) => group.rows.map((row, rowIndex) => { const item = editableChecklist.find(candidate => normalizeDocumentName(candidate.label ?? candidate.documentKey) === normalizeDocumentName(row.name)); return <tr key={`${groupIndex}-${row.name}`} onMouseEnter={() => setHoveredDocumentGroup(groupIndex)} onMouseLeave={() => setHoveredDocumentGroup(null)}>{rowIndex === 0 && <td className={`farm-information-abbreviation ${hoveredDocumentGroup === groupIndex ? 'hovered' : ''}`} rowSpan={group.rows.length}>{group.abbreviation}</td>}<td className="farm-information-name"><span className={`farm-information-connector ${rowIndex === group.rows.length - 1 ? 'last' : ''}`} />{row.name}</td><td><FarmDatePicker disabled={!item} value={item?.documentDate} onChange={value => item && updateChecklistField(item.id, 'documentDate', value)} /></td><td><FarmDatePicker disabled={!item} value={item?.dueDate} onChange={value => item && updateChecklistField(item.id, 'dueDate', value)} /></td><td><input className="farm-information-input" type="text" disabled={!item} value={item?.renewalComments ?? ''} onChange={event => item && updateChecklistField(item.id, 'renewalComments', event.target.value)} /></td><td><FarmDatePicker disabled={!item} value={item?.renewalDate} onChange={value => item && updateChecklistField(item.id, 'renewalDate', value)} /></td><td><input className="farm-information-input" type="text" disabled={!item} value={item?.documentStatus ?? ''} onChange={event => item && updateChecklistField(item.id, 'documentStatus', event.target.value)} /></td></tr>; }))}</tbody></table></div></div>}{activeBlock === 'maquinas' && <div className="farm-overview-placeholder"><strong>Máquinas</strong><span>Detalhes desta área serão definidos na próxima etapa.</span></div>}{activeBlock === 'funcionarios' && <div className="farm-overview-placeholder"><strong>Funcionários</strong><span>Detalhes desta área serão definidos na próxima etapa.</span></div>}</div></div></div></div></div>;
}

function AgendaPage({ token }: { token: string }) {
  const [items, setItems] = useState<Obligation[]>([]); const [error, setError] = useState(''); const [formOpen, setFormOpen] = useState(false); const [editing, setEditing] = useState<Obligation | null>(null); const [title, setTitle] = useState(''); const [dueDate, setDueDate] = useState(''); const [priority, setPriority] = useState('media');
  async function load() { const r = await fetch(`${API_URL}/obligations`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error('Não foi possível carregar a agenda.'); setItems(await r.json()); }
  // load is intentionally recreated with the authenticated token.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch(e => setError(e.message)); }, [token]);
  function openCreate() { setEditing(null); setTitle(''); setDueDate(''); setPriority('media'); setFormOpen(true); }
  function openEdit(item: Obligation) { setEditing(item); setTitle(item.title); setDueDate(item.dueDate.slice(0, 10)); setPriority(item.priority); setFormOpen(true); }
  async function save(event: FormEvent) { event.preventDefault(); setError(''); const payload = { title, dueDate, priority }; const r = await fetch(`${API_URL}/obligations${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!r.ok) { setError('Não foi possível salvar a obrigação.'); return; } setFormOpen(false); await load(); }
  async function toggle(item: Obligation) { const r = await fetch(`${API_URL}/obligations/${item.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !item.completed }) }); if (r.ok) setItems(old => old.map(current => current.id === item.id ? { ...current, completed: !item.completed } : current)); }
  async function remove(item: Obligation) { if (!window.confirm(`Deseja excluir a obrigação "${item.title}"?`)) return; const r = await fetch(`${API_URL}/obligations/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setItems(old => old.filter(current => current.id !== item.id)); }
  return <div id="tab-agenda" className="tab-page active"><div className="agenda-layout"><div className="calendar-panel"><CalendarGrid items={items} /></div><div className="tasks-panel"><div className="tasks-header"><h3>Obrigações e Lembretes Fiscais</h3><button className="add-task-btn" onClick={openCreate}><Plus size={16} /> Nova Obrigação</button></div>{error && <div className="login-error">{error}</div>}{formOpen && <form className="add-task-form visible" onSubmit={save}><div className="form-row"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do imposto ou documento..." required /></div><div className="form-row"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required /><select value={priority} onChange={e => setPriority(e.target.value)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></div><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancelar</button><button className="btn btn-primary" type="submit">{editing ? 'Salvar Alterações' : 'Salvar Obrigação'}</button></div></form>}<div className="tasks-list">{items.map(item => <div className={`task-item ${item.completed ? 'completed' : ''}`} key={item.id}><button className={`task-checkbox ${item.completed ? 'checked' : ''}`} onClick={() => toggle(item)} aria-label="Concluir obrigação">{item.completed && <Check size={12} color="white" />}</button><div className="task-info"><div className="task-title">{item.title}</div><div className="task-meta">{formatDate(item.dueDate)}</div></div><span className={`task-priority ${item.priority}`}>{item.priority}</span><div className="task-actions"><button className="input-action-btn" onClick={() => openEdit(item)} aria-label="Editar obrigação">✎</button><button className="input-action-btn" onClick={() => remove(item)} aria-label="Excluir obrigação"><Trash2 size={14} /></button></div></div>)}</div></div></div></div>;
}

function CalendarGrid({ items }: { items: Obligation[] }) {
  const [month, setMonth] = useState(new Date());
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay(); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const previous = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); const next = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  function dayItems(day: number) { const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; return items.filter(item => item.dueDate.slice(0, 10) === key); }
  return <><div className="calendar-header"><h3>{monthNames[month.getMonth()]} {month.getFullYear()}</h3><div className="calendar-nav"><button onClick={previous} aria-label="Mês anterior"><ChevronLeft size={16} /></button><button onClick={next} aria-label="Próximo mês"><ChevronRight size={16} /></button></div></div><div className="calendar-grid">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div className="calendar-day-name" key={day}>{day}</div>)}{Array.from({ length: firstDay }).map((_, index) => <div className="calendar-day other-month" key={`empty-${index}`} />)}{Array.from({ length: days }).map((_, index) => { const day = index + 1; const dayItemsList = dayItems(day); return <div className={`calendar-day ${dayItemsList.length ? 'has-pending-payment' : ''}`} key={day} title={dayItemsList.map(item => item.title).join(' | ')}>{day}</div>; })}</div></>;
}

function FoldersPage({ token }: { token: string }) { return <FolderManager token={token} />; }

