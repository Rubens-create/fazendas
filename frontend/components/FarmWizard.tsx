'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Tractor, Upload, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const checklistGroups = {
  propriedade: [
    ['prop_contrato', 'CONTRATO DE COMPRA E VENDA DO IMÓVEL E/OU ARRENDAMENTO'],
    ['prop_aditivos', 'ADITIVOS / ALTERAÇÃO E CONSOLIDAÇÃO CONTRATUAL'],
    ['prop_certidao_simplificada', 'CERTIDÃO SIMPLIFICADA DA CONSOLIDAÇÃO CONTRATUAL'],
    ['prop_comodato', 'CONTRATO DE COMODATO'],
    ['prop_escritura', 'ESCRITURA DO IMÓVEL RURAL'],
    ['prop_matricula', 'MATRÍCULA DO IMÓVEL RURAL'],
    ['prop_ccir', 'CERTIFICADO DE CADASTRO DE IMÓVEL RURAL'],
    ['prop_pagamento', 'BOLETO E/OU COMPROVANTE DE PAGAMENTO'],
    ['prop_itr', 'IMPOSTO TERRITORIAL RURAL - DECLARAÇÃO'],
    ['prop_itr_recibo', 'RECIBO DE DECLARAÇÃO'],
    ['prop_mapa', 'MAPA DO IMÓVEL'],
    ['prop_kml', 'KML / KMZ'],
    ['prop_croqui', 'CROQUI DE ACESSO'],
  ],
  ambientais: [
    ['amb_car', '(CAR) CADASTRO AMBIENTAL RURAL'], ['amb_ada', 'ATO DECLARATÓRIO AMBIENTAL'], ['amb_geo', 'GEORREFERENCIAMENTO'],
    ['amb_cefir', 'CERTIFICADO DE INSCRIÇÃO NO CADASTRO ESTADUAL FLORESTAL DE IMÓVEIS RURAIS'], ['amb_seia', 'SEIA - LOGIN E SENHA DE ACESSO'],
    ['amb_asv', 'AUTORIZAÇÃO DE SUPRESSÃO DE VEGETAÇÃO'], ['amb_certidao', 'CERTIDÃO DE CONFORMIDADE AMBIENTAL'],
    ['amb_ape', 'AUTORIZAÇÃO POR PROCEDIMENTO ESPECIAL DE LICENCIAMENTO'], ['amb_la', 'LICENÇA AMBIENTAL'], ['amb_lp', 'LICENÇA PRÉVIA'],
    ['amb_li', 'LICENÇA DE INSTALAÇÃO'], ['amb_lo', 'LICENÇA DE OPERAÇÃO'], ['amb_ls', 'LICENÇA SIMPLIFICADA'],
    ['amb_appo', 'AUTORIZAÇÃO PARA PERFURAÇÃO DE POÇOS'], ['amb_appo_mapa', "MAPA DAS APPO'S"],
    ['amb_outorga', 'OUTORGA (DIREITO DE USO DOS RECURSOS HÍDRICOS)'], ['amb_outorga_mapa', 'MAPA DA OUTORGA'],
    ['amb_dispensa', 'DECLARAÇÃO DE DISPENSA DE OUTORGA'], ['amb_dispensa_req', 'REQUERIMENTO DISPENSA DE OUTORGA'],
    ['amb_analise_agua', 'ANÁLISE DE ÁGUA'], ['amb_visita', 'VISITA TÉCNICA'], ['amb_laudo', 'LAUDO DE AVALIAÇÃO'],
    ['amb_reflorestamento', 'PROJETO DE REFLORESTAMENTO'], ['amb_arl', 'ÁREA DE RESERVA LEGAL'],
    ['amb_memorial_arl', 'MEMORIAL DESCRITIVO DA RESERVA LEGAL'], ['amb_raf', 'REGISTRO DE ATIVIDADES FLORESTAIS'],
    ['amb_dof', 'DOCUMENTO DE ORIGEM FLORESTAL'], ['amb_rcfp', 'REGISTRO DE CORTE PARA FLORESTA PLANTADA'],
    ['amb_rcfp_comprovante', 'COMPROVANTE DE REGISTRO DE CORTE PARA FLORESTA PLANTADA'], ['amb_ctf', 'CADASTRO TÉCNICO FEDERAL'],
    ['amb_rapp', 'RELATÓRIO ANUAL DE ATIVIDADES POTENCIALMENTE POLUIDORES'], ['amb_dqc', 'DECLARAÇÃO DE QUEIMA CONTROLADA'],
    ['amb_diap', 'DIVISÃO DE ÁREAS PROTEGIDAS'], ['amb_ceapd', 'CADASTRO ESTADUAL DE ATIVIDADES POTENCIALMENTE DEGRADANTES'],
  ],
  pecuarios: [
    ['pec_cadastro', 'FICHA ABERTURA DE CADASTRO'], ['pec_sanitaria', 'FICHA SANITÁRIA'],
    ['pec_lista_docs', 'LISTA DA DOCUMENTAÇÃO NECESSÁRIA PARA ABERTURA'], ['pec_gta', 'GUIA DE TRÂNSITO ANIMAL'],
    ['pec_dae', 'DAE / FUNDAP'], ['pec_canc_gta', 'MODELO SOLICITAÇÃO CANCELAMENTO GTA'],
    ['pec_nfe', 'NOTA FISCAL ELETRÔNICA DE VENDA'], ['pec_nfe_comp', 'COMPROVANTES DE PAGAMENTO'],
    ['pec_procuracao', 'PROCURAÇÃO - OUTORGADO NILVA'],
  ],
} as const;

type Group = keyof typeof checklistGroups;
type Props = { token: string; open: boolean; onClose: () => void; onCreated: () => void };

export default function FarmWizard({ token, open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [culture, setCulture] = useState('');
  const [status, setStatus] = useState('Ativa');
  const [cover, setCover] = useState('fazenda_sol_nascente.png');
  const [selected, setSelected] = useState<Record<Group, string[]>>({
    propriedade: checklistGroups.propriedade.map(([key]) => key),
    ambientais: checklistGroups.ambientais.map(([key]) => key),
    pecuarios: checklistGroups.pecuarios.map(([key]) => key),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  if (!open) return null;

  function toggle(group: Group, key: string) {
    setSelected(old => ({ ...old, [group]: old[group].includes(key) ? old[group].filter(item => item !== key) : [...old[group], key] }));
  }

  function chooseCover(file: File | null) {
    if (!file || !file.type.startsWith('image/')) { setError('Selecione um arquivo de imagem válido.'); return; }
    const reader = new FileReader();
    reader.onload = event => setCover(String(event.target?.result ?? ''));
    reader.readAsDataURL(file);
  }

  function next() {
    if (step === 1 && (!name || !location || !area || !culture)) { setError('Preencha todos os dados básicos da fazenda.'); return; }
    setError('');
    setStep(current => Math.min(4, current + 1));
  }

  async function saveFarm() {
    if (step !== 4 || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/farms`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, location, areaHectares: Number(area), culture, status, coverImage: cover, propertyChecklist: selected.propriedade, environmentalChecklist: selected.ambientais, livestockChecklist: selected.pecuarios }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Não foi possível cadastrar a fazenda.'); }
      onClose();
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar fazenda.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const group: Group = step === 2 ? 'propriedade' : step === 3 ? 'ambientais' : 'pecuarios';
  const groupTitles: Record<Group, string> = { propriedade: 'Documentos de Propriedade', ambientais: 'Documentos Ambientais', pecuarios: 'Documentos de Pecuária' };

  return <div className="modal-overlay visible"><div className="modal-card wizard-modal-card" style={{ maxWidth: 780 }}>
    <div className="modal-header"><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="brand-icon" style={{ width: 32, height: 32, padding: 7 }}><Tractor size={18} color="white" /></div><div><h2>Cadastrar Nova Fazenda</h2><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Etapa {step} de 4</span></div></div><button type="button" className="modal-close-btn" onClick={onClose}><X /></button></div>
    <div className="wizard-stepper-container"><div className="wizard-stepper">{['Dados Básicos', 'Propriedade', 'Ambientais', 'ADAB Pecuária'].map((label, index) => <div className={`wizard-step-node ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'completed' : ''}`} key={label}><div className="step-num">{step > index + 1 ? <Check size={14} /> : index + 1}</div><div className="step-info"><span className="step-title">{label}</span></div></div>)}</div></div>
    <div className="modal-body"><form onSubmit={event => event.preventDefault()}>
      {step === 1 && <div className="wizard-pane active"><div className="wizard-pane-header"><div><h3>Dados Básicos e Localização</h3><p>Preencha os dados primários de identificação da propriedade rural.</p></div></div><div className="wizard-form-grid"><label>Nome da Fazenda *<input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fazenda Santa Luíza" /></label><label>Localização (Cidade, UF) *<input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Franca, SP" /></label><label>Área Total (Hectares) *<input type="number" min="0" value={area} onChange={e => setArea(e.target.value)} /></label><label>Cultura Principal *<input value={culture} onChange={e => setCulture(e.target.value)} placeholder="Ex: Café, Soja, Gado de Corte" /></label><label>Status Inicial *<select value={status} onChange={e => setStatus(e.target.value)}><option>Ativa</option><option>Colheita</option><option>Preparo</option><option>Plantio</option></select></label></div><label className="cover-upload-field">Imagem de Capa<div className="cover-upload-dropzone"><Upload size={20} /><span className="cover-upload-dropzone-title">Escolher imagem</span><span className="cover-upload-dropzone-help">JPG ou PNG</span><input type="file" accept="image/*" onChange={e => chooseCover(e.target.files?.[0] ?? null)} /></div></label></div>}
      {step > 1 && <div className="wizard-pane active"><div className="wizard-pane-header"><div><h3>{groupTitles[group]}</h3><p>Selecione os documentos que farão parte do checklist desta fazenda.</p></div></div><div className="wizard-checklist-table">{checklistGroups[group].map(([key, label], index) => <button type="button" className={`wizard-check-item ${selected[group].includes(key) ? 'selected' : ''}`} key={key} onClick={() => toggle(group, key)}><span className="check-item-main"><span className="doc-num-badge">{index + 1}</span><span className="doc-name-text">{label}</span></span><span className="check-item-toggle"><span className="doc-custom-checkbox">{selected[group].includes(key) && <Check size={12} />}</span></span></button>)}</div></div>}
      {error && <div className="login-error">{error}</div>}
      <div className="wizard-footer">
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => step === 1 ? onClose() : setStep(current => current - 1)}><ArrowLeft size={14} /> {step === 1 ? 'Cancelar' : 'Voltar'}</button>
        {step < 4 ? (
          <button key="next-step" type="button" className="btn btn-primary" onClick={next}>Próxima etapa <ArrowRight size={14} /></button>
        ) : (
          <button key="save-farm" type="button" className="btn btn-primary" onClick={saveFarm} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Fazenda'} <Check size={14} /></button>
        )}
      </div>
    </form></div>
  </div></div>;
}
