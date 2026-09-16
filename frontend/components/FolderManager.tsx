'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Folder, FolderInput, FolderPlus, Pencil, Search, Trash2, Upload, X } from 'lucide-react';

type Farm = { id: string; name: string; checklist?: { documentKey: string; label?: string }[] };
type FolderItem = { id: string; name: string; icon: string; colorClass: string; farmId?: string | null; parentFolderId?: string | null };
type DocumentItem = { id: string; originalName: string; fileSize: number; fileType: string; farmId?: string | null; folderId?: string | null };
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type MoveTarget = { type: 'folder' | 'document'; id: string } | null;

export default function FolderManager({ token }: { token: string }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [folderModal, setFolderModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MoveTarget>(null);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetFarm, setTargetFarm] = useState('');
  const [targetFolder, setTargetFolder] = useState(''); const [checklistKey, setChecklistKey] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  async function load() {
    const [farmResponse, folderResponse, documentResponse] = await Promise.all([
      fetch(`${API}/farms`, { headers }),
      fetch(`${API}/folders`, { headers }),
      fetch(`${API}/documents`, { headers }),
    ]);
    if (!farmResponse.ok || !folderResponse.ok || !documentResponse.ok) throw new Error('Não foi possível carregar os arquivos.');
    setFarms(await farmResponse.json()); setFolders(await folderResponse.json()); setDocuments(await documentResponse.json());
  }

  useEffect(() => { const params = new URLSearchParams(window.location.search); setFarmId(params.get('farmId')); setFolderId(params.get('folderId')); }, []);
  // load is intentionally tied to the authenticated token.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch(e => setError(e.message)); }, [token]);

  const activeFolder = folders.find(item => item.id === folderId);
  const activeFarm = farms.find(item => item.id === farmId);
  const visibleFolders = folders.filter(item => (item.farmId ?? null) === farmId && (item.parentFolderId ?? null) === folderId && item.name.toLowerCase().includes(query.toLowerCase()));
  const visibleDocuments = documents.filter(item => (item.farmId ?? null) === farmId && (item.folderId ?? null) === folderId && item.originalName.toLowerCase().includes(query.toLowerCase()));
  const breadcrumbs = useMemo(() => { const result: FolderItem[] = []; let current = activeFolder; while (current) { result.unshift(current); current = folders.find(item => item.id === current?.parentFolderId); } return result; }, [activeFolder, folders]);

  async function createFolder(event: FormEvent) { event.preventDefault(); const response = await fetch(`${API}/folders`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, icon: 'folder', colorClass: 'relatorios', farmId: farmId || undefined, parentFolderId: folderId || undefined }) }); if (!response.ok) { setError('Não foi possível criar a pasta.'); return; } setName(''); setFolderModal(false); await load(); }
  async function upload(event: FormEvent) { event.preventDefault(); if (!file) return; const form = new FormData(); form.append('file', file); const response = await fetch(`${API}/documents/upload?farmId=${farmId ?? ''}&folderId=${folderId ?? ''}&checklistDocumentKey=${encodeURIComponent(checklistKey)}`, { method: 'POST', headers, body: form }); if (!response.ok) { setError('Não foi possível enviar o documento.'); return; } setFile(null); setUploadModal(false); await load(); }
  async function remove(type: 'folder' | 'document', id: string) { if (!window.confirm('Deseja excluir este item?')) return; const response = await fetch(`${API}/${type === 'folder' ? 'folders' : 'documents'}/${id}`, { method: 'DELETE', headers }); if (response.ok) await load(); }
  async function rename(folder: FolderItem) { const next = window.prompt('Novo nome da pasta:', folder.name); if (!next?.trim()) return; const response = await fetch(`${API}/folders/${folder.id}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: next.trim() }) }); if (response.ok) await load(); }
  function openMove(type: 'folder' | 'document', id: string) { setMoveTarget({ type, id }); setTargetFarm(farmId ?? ''); setTargetFolder(''); }
  async function move(event: FormEvent) { event.preventDefault(); if (!moveTarget) return; const endpoint = moveTarget.type === 'folder' ? `${API}/folders/${moveTarget.id}/move` : `${API}/documents/${moveTarget.id}/move`; const body = moveTarget.type === 'folder' ? { farmId: targetFarm || null, parentFolderId: targetFolder || null } : { farmId: targetFarm || null, folderId: targetFolder || null }; const response = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (response.ok) { setMoveTarget(null); await load(); } }

  return <div id="tab-pastas" className="tab-page active">
    <div className="pastas-header"><h2>Arquivos e Documentos</h2><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{activeFolder && <><button className="btn btn-outline" onClick={() => rename(activeFolder)}><Pencil size={14} /> Editar</button><button className="btn btn-outline" onClick={() => openMove('folder', activeFolder.id)}><FolderInput size={14} /> Mover</button><button className="btn btn-outline" onClick={() => remove('folder', activeFolder.id)}><Trash2 size={14} /> Excluir</button></>}<button className="btn btn-outline" onClick={() => setFolderModal(true)}><FolderPlus size={14} /> Nova Pasta</button><button className="btn btn-primary" onClick={() => setUploadModal(true)}><Upload size={14} /> Upload de Documento</button></div></div>
    <div className="pastas-search-bar" style={{ marginBottom: 24 }}><div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-tertiary)' }} /><input value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', paddingLeft: 38 }} placeholder="Buscar arquivos ou pastas em toda a estrutura..." /></div></div>
    <div className="pastas-breadcrumb"><button className="breadcrumb-item" onClick={() => { setFarmId(null); setFolderId(null); }}><Folder size={14} /> Todos os Arquivos</button>{activeFarm && <><span className="breadcrumb-separator">›</span><button className="breadcrumb-item" onClick={() => setFolderId(null)}>{activeFarm.name}</button></>}{breadcrumbs.map(item => <span key={item.id}><span className="breadcrumb-separator">›</span><button className="breadcrumb-item active" onClick={() => setFolderId(item.id)}>{item.name}</button></span>)}</div>
    {error && <div className="login-error">{error}</div>}
    {!farmId && !folderId && <div className="pastas-grid">{farms.map(farm => <button className="pasta-card" key={farm.id} onClick={() => setFarmId(farm.id)}><div className="pasta-icon contratos"><Folder size={22} /></div><div className="pasta-name">{farm.name}</div><div className="pasta-count">Abrir fazenda</div></button>)}</div>}
    {(farmId || folderId) && <><div className="pastas-grid">{visibleFolders.map(folder => <div className="pasta-card" key={folder.id} onClick={() => setFolderId(folder.id)}><button onClick={event => { event.stopPropagation(); setFolderId(folder.id); }}><div className={`pasta-icon ${folder.colorClass || 'relatorios'}`}><Folder size={22} /></div><div className="pasta-name">{folder.name}</div></button></div>)}</div><div className="files-section visible"><h3 className="files-section-title">Arquivos</h3><div className="files-list">{visibleDocuments.map(doc => <div className="file-item" key={doc.id}><div className="file-icon doc"><FileText size={18} /></div><div className="file-info"><div className="file-name">{doc.originalName}</div><div className="file-meta">{doc.fileSize} bytes · {doc.fileType}</div></div><div className="file-actions"><a className="btn btn-ghost" href={`${API}/documents/${doc.id}/download`} download><Download size={14} /></a><button className="btn btn-ghost" onClick={() => openMove('document', doc.id)}><FolderInput size={14} /></button><button className="btn btn-ghost" onClick={() => remove('document', doc.id)}><Trash2 size={14} /></button></div></div>)}</div>{visibleDocuments.length === 0 && visibleFolders.length === 0 && <div className="empty-state"><div className="empty-icon"><Folder size={42} /></div><h3>Nenhum arquivo encontrado</h3><p>Não há documentos nesta localização.</p></div>}</div></>}
    {folderModal && <div className="modal-overlay visible"><div className="modal-card" style={{ maxWidth: 460 }}><div className="modal-header"><h2>Nova Pasta</h2><button className="modal-close-btn" onClick={() => setFolderModal(false)}><X /></button></div><div className="modal-body"><form className="login-form" onSubmit={createFolder}><label>Nome da Pasta<input value={name} onChange={e => setName(e.target.value)} required /></label><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setFolderModal(false)}>Cancelar</button><button className="btn btn-primary">Criar Pasta</button></div></form></div></div></div>}
    {uploadModal && <div className="modal-overlay visible"><div className="modal-card" style={{ maxWidth: 460 }}><div className="modal-header"><h2>Upload de Documento</h2><button className="modal-close-btn" onClick={() => setUploadModal(false)}><X /></button></div><div className="modal-body"><form className="login-form" onSubmit={upload}><label>Arquivo<input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} required /></label><label>Item do Checklist<select value={checklistKey} onChange={e => setChecklistKey(e.target.value)}><option value="">Nenhum vínculo</option>{farms.find(farm => farm.id === farmId)?.checklist?.map(item => <option key={item.label ?? item.documentKey} value={item.documentKey}>{item.label ?? item.documentKey}</option>)}</select></label><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setUploadModal(false)}>Cancelar</button><button className="btn btn-primary" disabled={!file}>Enviar</button></div></form></div></div></div>}
    {moveTarget && <div className="modal-overlay visible"><div className="modal-card" style={{ maxWidth: 460 }}><div className="modal-header"><h2>Mover Item</h2><button className="modal-close-btn" onClick={() => setMoveTarget(null)}><X /></button></div><div className="modal-body"><form className="login-form" onSubmit={move}><label>Fazenda<select value={targetFarm} onChange={e => setTargetFarm(e.target.value)}><option value="">Raiz global</option>{farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select></label><label>Pasta<select value={targetFolder} onChange={e => setTargetFolder(e.target.value)}><option value="">Raiz da fazenda</option>{folders.filter(item => item.farmId === targetFarm).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setMoveTarget(null)}>Cancelar</button><button className="btn btn-primary">Mover</button></div></form></div></div></div>}
  </div>;
}
