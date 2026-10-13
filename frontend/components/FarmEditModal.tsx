'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Save, Upload, X } from 'lucide-react';
import FarmCoverImage from './FarmCoverImage';
import { checklistGroups, formatAreaHectares, parseAreaHectares, type ChecklistGroup } from './FarmWizard';

type ChecklistItem = { id: string; documentKey: string; label?: string; documentDate?: string | null; dueDate?: string | null; renewalComments?: string | null; renewalDate?: string | null; documentStatus?: string | null };
type Farm = { id: string; name: string; location: string; areaHectares: string | number; culture: string; status: string; coverImage?: string | null; checklist?: ChecklistItem[] };
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export default function FarmEditModal({ farm, token, onClose, onSaved }: { farm: Farm; token: string; onClose: () => void; onSaved: (farm: Farm) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(farm.name);
  const [location, setLocation] = useState(farm.location);
  const [area, setArea] = useState(formatAreaHectares(farm.areaHectares));
  const [culture, setCulture] = useState(farm.culture);
  const [status, setStatus] = useState(farm.status);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<ChecklistGroup, string[]>>({ propriedade: [], ambientais: [], pecuarios: [] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  const existingKeys = new Set((farm.checklist ?? []).map(item => item.documentKey));
  const group: ChecklistGroup = step === 2 ? 'propriedade' : step === 3 ? 'ambientais' : 'pecuarios';
  const groupTitles: Record<ChecklistGroup, string> = { propriedade: 'Documentos de Propriedade', ambientais: 'Documentos Ambientais', pecuarios: 'Documentos de Pecuária' };
  const availableItems = checklistGroups[group].filter(([key]) => !existingKeys.has(key));
  function chooseCover(file: File | null) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Selecione uma imagem JPG, PNG ou WebP.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('A imagem deve ter no máximo 10 MB.'); return; }
    setCoverFile(file);
    setError('');
  }

  function toggle(groupKey: ChecklistGroup, key: string) {
    setSelected(old => ({ ...old, [groupKey]: old[groupKey].includes(key) ? old[groupKey].filter(item => item !== key) : [...old[groupKey], key] }));
  }

  function next() {
    if (step === 1 && (!name || !location || parseAreaHectares(area) === null || !culture)) { setError('Preencha os dados básicos e informe uma área válida em hectares.'); return; }
    setError('');
    setStep(current => Math.min(4, current + 1));
  }

  async function saveFarm() {
    if (step !== 4 || savingRef.current) return;
    const areaHectares = parseAreaHectares(area);
    if (areaHectares === null) { setError('Informe uma área válida em hectares.'); return; }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const farmResponse = await fetch(`${API}/farms/${farm.id}`, { method: 'PATCH', headers, body: JSON.stringify({ name, location, areaHectares, culture, status }) });
      if (!farmResponse.ok) throw new Error('Não foi possível atualizar a fazenda.');
      if (coverFile) {
        const form = new FormData();
        form.append('file', coverFile);
        const coverResponse = await fetch(`${API}/farms/${farm.id}/cover`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
        if (!coverResponse.ok) {
          const data = await coverResponse.json().catch(() => ({}));
          throw new Error(data.message ?? 'Não foi possível salvar a imagem de capa.');
        }
      }
      const checklistResponse = await fetch(`${API}/farms/${farm.id}/checklist`, { method: 'PUT', headers, body: JSON.stringify({ property: [...(farm.checklist ?? []).filter(item => item.documentKey.startsWith('prop_')).map(item => item.documentKey), ...selected.propriedade], environmental: [...(farm.checklist ?? []).filter(item => item.documentKey.startsWith('amb_')).map(item => item.documentKey), ...selected.ambientais], livestock: [...(farm.checklist ?? []).filter(item => item.documentKey.startsWith('pec_')).map(item => item.documentKey), ...selected.pecuarios] }) });
      if (!checklistResponse.ok) throw new Error('A fazenda foi atualizada, mas não foi possível salvar os documentos.');
      onSaved(await checklistResponse.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar fazenda.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <div className="modal-overlay visible" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-card wizard-modal-card" style={{ maxWidth: 780 }}>
    <div className="modal-header"><h2>Editar Fazenda</h2><button type="button" className="modal-close-btn" onClick={onClose}><X /></button></div>
    <div className="wizard-stepper-container"><div className="wizard-stepper">{['Dados Básicos', 'Propriedade', 'Ambientais', 'ADAB Pecuária'].map((label, index) => <div className={`wizard-step-node ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'completed' : ''}`} key={label}><div className="step-num">{step > index + 1 ? <Check size={14} /> : index + 1}</div><div className="step-info"><span className="step-title">{label}</span></div></div>)}</div></div>
    <div className="modal-body"><form onSubmit={event => event.preventDefault()}>
      {step === 1 && <div className="wizard-pane active"><div className="wizard-pane-header"><div><h3>Dados Básicos e Localização</h3><p>Atualize os dados de identificação da propriedade rural.</p></div></div><div className="wizard-form-grid"><label>Nome da Fazenda<input value={name} onChange={e => setName(e.target.value)} required /></label><label>Localização<input value={location} onChange={e => setLocation(e.target.value)} required /></label><label>Área Total (Hectares)<input type="text" inputMode="decimal" value={area} onChange={e => setArea(e.target.value)} placeholder="Ex: 878,40" required /></label><label>Cultura Principal<input value={culture} onChange={e => setCulture(e.target.value)} required /></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option>Ativa</option><option>Colheita</option><option>Preparo</option><option>Plantio</option></select></label></div><label className="cover-upload-field">Imagem de Capa<div className="cover-upload-dropzone farm-edit-cover-dropzone"><FarmCoverImage farmId={farm.id} token={token} coverImage={farm.coverImage} previewSrc={coverPreviewUrl} alt={`Capa da fazenda ${farm.name}`} width={640} height={280} className="cover-upload-preview" /><Upload size={20} aria-hidden="true" /><span className="cover-upload-dropzone-title">{coverFile ? 'Nova imagem selecionada' : 'Clique para alterar a imagem'}</span><span className="cover-upload-dropzone-help">JPG, PNG ou WebP</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseCover(e.target.files?.[0] ?? null)} /></div></label></div>}
      {step > 1 && <div className="wizard-pane active"><div className="wizard-pane-header"><div><h3>{groupTitles[group]}</h3><p>Somente documentos ainda não vinculados estão disponíveis para seleção.</p></div></div><div className="wizard-checklist-table">{availableItems.length ? availableItems.map(([key, label], index) => <button type="button" className={`wizard-check-item ${selected[group].includes(key) ? 'selected' : ''}`} key={key} onClick={() => toggle(group, key)}><span className="check-item-main"><span className="doc-num-badge">{index + 1}</span><span className="doc-name-text">{label}</span></span><span className="check-item-toggle"><span className="doc-custom-checkbox">{selected[group].includes(key) && <Check size={12} />}</span></span></button>) : <p className="text-muted">Todos os documentos deste grupo já foram vinculados.</p>}</div></div>}
      {error && <div className="login-error">{error}</div>}
      <div className="wizard-footer"><button type="button" className="btn btn-ghost" disabled={saving} onClick={() => step === 1 ? onClose() : setStep(current => current - 1)}><ArrowLeft size={14} /> {step === 1 ? 'Cancelar' : 'Voltar'}</button>{step < 4 ? <button key="next-step" type="button" className="btn btn-primary" onClick={next}>Próxima etapa <ArrowRight size={14} /></button> : <button key="save-farm" type="button" className="btn btn-primary" onClick={saveFarm} disabled={saving}><Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}</button>}</div>
    </form></div>
  </div></div>;
}
