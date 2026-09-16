/* ============================================
   AGROCLAW - APP LOGIC (COM SUPABASE INTEGRADO)
   ============================================ */

// 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://segulnohcbvkkojbetjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZ3Vsbm9oY2J2a2tvamJldGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Nzg0ODgsImV4cCI6MjA3MDI1NDQ4OH0.jrsg5VM33RUw4M_LBkvN3t2G5Gmj1jTdQr1p-UGcD58';

let supabaseClient = null;
if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase Client conectado com sucesso no AgroClaw!');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializa os ícones do Lucide no HTML estático
  lucide.createIcons();

  // ========== NAVIGATION ==========
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const tabPages = document.querySelectorAll('.tab-page');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');

  const pageMeta = {
    'agente-ia': { title: 'Agente IA', subtitle: 'Converse com seu assistente agronômico' },
    'fazendas': { title: 'Fazendas', subtitle: 'Gerencie suas propriedades rurais' },
    'agenda': { title: 'Agenda', subtitle: 'Calendário e tarefas da fazenda' },
    'pastas': { title: 'Pastas', subtitle: 'Arquivos e documentos organizados' },
  };

  function switchTab(tabId) {
    navItems.forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    tabPages.forEach(page => page.classList.remove('active'));
    const activePage = document.getElementById(`tab-${tabId}`);
    if (activePage) activePage.classList.add('active');

    const meta = pageMeta[tabId];
    if (meta) {
      pageTitle.textContent = meta.title;
      pageSubtitle.textContent = meta.subtitle;
    }

    closeMobileSidebar();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchTab(item.dataset.tab);
    });
  });

  // ========== MOBILE SIDEBAR ==========
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  function openMobileSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // ========== 1. FAZENDAS (SUPABASE INTEGRATION) ==========
  let farmData = {
    'sol-nascente': { id: null, slug: 'sol-nascente', name: 'Fazenda Sol Nascente', location: 'Ribeirão Preto, SP', area: '800 hectares', culture: 'Soja', status: 'Ativa', cover: 'fazenda_sol_nascente.png' },
    'boa-vista': { id: null, slug: 'boa-vista', name: 'Fazenda Boa Vista', location: 'Uberaba, MG', area: '650 hectares', culture: 'Milho', status: 'Colheita', cover: 'fazenda_boa_vista.png' },
    'serra-alta': { id: null, slug: 'serra-alta', name: 'Fazenda Serra Alta', location: 'Patrocínio, MG', area: '500 hectares', culture: 'Café', status: 'Ativa', cover: 'fazenda_serra_alta.png' },
    'vale-verde': { id: null, slug: 'vale-verde', name: 'Fazenda Vale Verde', location: 'Rondonópolis, MT', area: '500 hectares', culture: 'Girassol', status: 'Preparo', cover: 'fazenda_vale_verde.png' },
  };

  let farms = [
    { id: 'sol-nascente', name: 'Fazenda Sol Nascente', icon: 'tractor' },
    { id: 'boa-vista', name: 'Fazenda Boa Vista', icon: 'tractor' },
    { id: 'serra-alta', name: 'Fazenda Serra Alta', icon: 'tractor' },
    { id: 'vale-verde', name: 'Fazenda Vale Verde', icon: 'tractor' },
  ];

  function loadCustomFarms() {
    try {
      const saved = localStorage.getItem('agroclaw_custom_farms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(f => {
            const slug = f.slug || f.id || f.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            if (!farms.some(existing => existing.id === slug)) {
              farms.push({ id: slug, name: f.name, icon: 'tractor' });
              farmData[slug] = f;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao carregar fazendas customizadas:', e);
    }
  }

  loadCustomFarms();

  function renderFazendasGrid() {
    const fazendasGrid = document.querySelector('.fazendas-grid');
    if (!fazendasGrid) return;
    fazendasGrid.innerHTML = '';

    const farmList = Object.entries(farmData);
    
    // Atualiza contadores nas estatisticas da aba Fazendas
    const statValues = document.querySelectorAll('.fazendas-stats .stat-value');
    if (statValues.length >= 3) {
      statValues[0].textContent = farmList.length;
      
      let totalHectares = 0;
      farmList.forEach(([_, data]) => {
        const areaNum = parseInt(String(data.area).replace(/\D/g, '')) || 0;
        totalHectares += areaNum;
      });
      statValues[1].textContent = totalHectares.toLocaleString('pt-BR');
    }

    farmList.forEach(([slug, data]) => {
      const card = document.createElement('div');
      card.className = 'fazenda-card';
      card.dataset.farmId = slug;

      const statusClass = (data.status || 'Ativa').toLowerCase();
      const coverImg = data.cover || 'fazenda_sol_nascente.png';

      card.innerHTML = `
        <div class="fazenda-cover">
          <img src="${coverImg}" alt="${data.name}">
          <span class="fazenda-status ${statusClass}">• ${data.status}</span>
        </div>
        <div class="fazenda-body">
          <h3 class="fazenda-name">${data.name}</h3>
          <div class="fazenda-location">
            <i data-lucide="map-pin" style="width: 14px; height: 14px; margin-right: 4px;"></i>
            ${data.location}
          </div>
          <div class="fazenda-metrics">
            <div class="metric">
              <span class="metric-label">Área Total</span>
              <span class="metric-value">${data.area}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Cultura</span>
              <span class="metric-value">${data.culture}</span>
            </div>
          </div>
          <div class="fazenda-actions">
            <button class="btn btn-primary" style="width: 100%;">Ver Detalhes</button>
          </div>
        </div>
      `;

      const btn = card.querySelector('.btn-primary');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openFarmDetails(slug);
        });
      }

      fazendasGrid.appendChild(card);
    });

    lucide.createIcons();
  }

  async function loadFazendasFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('fazendas').select('*').order('nome');
      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(f => {
          farmData[f.slug] = {
            id: f.id,
            slug: f.slug,
            name: f.nome,
            location: f.localizacao,
            area: `${f.area_hectares} hectares`,
            culture: f.cultura,
            status: f.status,
            cover: f.imagem_capa || 'fazenda_sol_nascente.png'
          };
          if (!farms.some(existing => existing.id === f.slug)) {
            farms.push({ id: f.slug, name: f.nome, icon: 'tractor' });
          }
        });
        renderFazendasGrid();
        renderPastasSection();
      }
    } catch (err) {
      console.warn('Usando fallback local para fazendas:', err.message);
    }
  }

  // ========== DEFINIÇÕES MESTRE DOS CHECKLISTS DE DOCUMENTOS ==========
  const CHECKLIST_DEFINITIONS = {
    propriedade: [
      { id: 'prop_contrato', num: '1', abbrev: 'CONTRATO', name: 'CONTRATO DE COMPRA E VENDA DO IMÓVEL', icon: 'file-text' },
      { id: 'prop_escritura', num: '2', abbrev: 'ESCRITURA', name: 'ESCRITURA DO IMÓVEL RURAL', icon: 'file-text' },
      { id: 'prop_matricula', num: '3', abbrev: 'MATRICULA', name: 'MATRICULA DO IMÓVEL RURAL', icon: 'book-open' },
      { id: 'prop_ccir', num: '4', abbrev: 'CCIR', name: 'CERTIFICADO DE CADASTRO DE IMÓVEL RURAL', icon: 'receipt' },
      { id: 'prop_ccir_comp', num: '4.1', abbrev: 'COMPROVANTE', name: 'COMPROVANTE DE PAGAMENTO (CCIR)', isSub: true, icon: 'dollar-sign' },
      { id: 'prop_itr', num: '5', abbrev: 'ITR', name: 'IMPOSTO TERRITORIAL RURAL - DECLARAÇÃO', icon: 'receipt' },
      { id: 'prop_itr_recibo', num: '5.1', abbrev: 'RECIBO', name: 'RECIBO DE DECLARAÇÃO (ITR)', isSub: true, icon: 'check-circle' },
      { id: 'prop_mapa', num: '6', abbrev: 'MAPA', name: 'MAPA DO IMÓVEL', icon: 'map' },
      { id: 'prop_kml', num: '7', abbrev: 'KML / KMZ', name: 'KML / KMZ LOCALIZACAO POR SATELITE', icon: 'satellite' },
      { id: 'prop_croqui', num: '8', abbrev: 'CROQUI', name: 'CROQUI DE ACESSO', icon: 'navigation' },
    ],
    ambientais: [
      { id: 'amb_car', num: '1', abbrev: 'CAR', name: '(CAR) CADASTRO AMBIENTAL RURAL', icon: 'shield' },
      { id: 'amb_ada', num: '2', abbrev: 'ADA', name: 'ATO DECLARATORIO AMBIENTAL', icon: 'file-check' },
      { id: 'amb_geo', num: '3', abbrev: 'GEO', name: 'GEORREFERENCIAMENTO', icon: 'map-pin' },
      { id: 'amb_cefir', num: '4', abbrev: 'CEFIR', name: 'CERTIFICADO DE INSCRIÇÃO NO CADASTRO ESTADUAL FLORESTAL DE IMOVEIS RURAIS', icon: 'trees' },
      { id: 'amb_seia', num: '4.1', abbrev: 'SEIA', name: 'SEIA - LOGIN E SENHA DE ACESSO', isSub: true, icon: 'key' },
      { id: 'amb_asv', num: '5', abbrev: 'ASV', name: 'AUTORIZAÇÃO DE SUPRESSÃO DE VEGETAÇÃO', icon: 'scissors' },
      { id: 'amb_certidao', num: '6', abbrev: 'CERTIDÃO', name: 'CERTIDÃO DE CONFORMIDADE AMBIENTAL', icon: 'award' },
      { id: 'amb_ape', num: '7', abbrev: 'APE', name: 'AUTORIZAÇÃO POR PROCEDIMENTO ESPECIAL DE LICENCIAMENTO', icon: 'file-check' },
      { id: 'amb_la', num: '8', abbrev: 'LA', name: 'LICENÇA AMBIENTAL', icon: 'shield-check' },
      { id: 'amb_lp', num: '9', abbrev: 'LP', name: 'LICENÇA PRÉVIA', icon: 'clock' },
      { id: 'amb_li', num: '10', abbrev: 'LI', name: 'LICENÇA DE INSTALAÇÃO', icon: 'hammer' },
      { id: 'amb_lo', num: '11', abbrev: 'LO', name: 'LICENÇA DE OPERAÇÃO', icon: 'check-square' },
      { id: 'amb_ls', num: '12', abbrev: 'LS', name: 'LICENÇA SIMPLIFICADA', icon: 'file' },
      { id: 'amb_appo', num: '13', abbrev: 'APPO', name: 'AUTORIZAÇÃO PARA PERFURAÇÃO DE POÇOS', icon: 'droplet' },
      { id: 'amb_appo_mapa', num: '13.1', abbrev: 'MAPA APPO', name: "MAPA DAS APPO'S", isSub: true, icon: 'map' },
      { id: 'amb_outorga', num: '14', abbrev: 'OUTORGA', name: 'OUTORGA (DIREITO DE USO DOS RECURSOS HIDRICOS)', icon: 'droplets' },
      { id: 'amb_outorga_mapa', num: '14.1', abbrev: 'MAPA OUTORGA', name: 'MAPA DA OUTORGA', isSub: true, icon: 'map' },
      { id: 'amb_dispensa', num: '15', abbrev: 'DISPENSA OUTORGA', name: 'DECLARAÇÃO DE DISPENSA DE OUTORGA', icon: 'file-text' },
      { id: 'amb_dispensa_req', num: '15.1', abbrev: 'REQ. DISPENSA', name: 'REQUERIMENTO DISPENSA DE OUTORGA', isSub: true, icon: 'file-text' },
      { id: 'amb_relatorio', num: '16', abbrev: 'RELATORIO', name: 'ANALISE DE ÁGUA', icon: 'activity' },
      { id: 'amb_visita', num: '16.1', abbrev: 'VISITA TECNICA', name: 'VISITA TECNICA', isSub: true, icon: 'user-check' },
      { id: 'amb_arl', num: '17', abbrev: 'ARL', name: 'ÁREA DE RESERVA LEGAL', icon: 'trees' },
      { id: 'amb_raf', num: '18', abbrev: 'RAF', name: 'REGISTRO DE ATIVIDADES FLORESTAIS', icon: 'file-text' },
      { id: 'amb_dof', num: '19', abbrev: 'DOF', name: 'DOCUMENTO DE ORIGEM FLORESTAL', icon: 'truck' },
      { id: 'amb_rcfp', num: '20', abbrev: 'RCFP', name: 'REGISTRO DE CORTE PARA FLORESTA PLANTADA', icon: 'scissors' },
      { id: 'amb_ctf', num: '21', abbrev: 'CTF', name: 'CADASTRO TÉCNICO FEDERAL', icon: 'badge-check' },
      { id: 'amb_rapp', num: '22', abbrev: 'RAPP', name: 'RELATORIO ANUAL DE ATIVIDADES POTENCIALMENTE POLUIDORES', icon: 'bar-chart-2' },
      { id: 'amb_dqc', num: '23', abbrev: 'DQC', name: 'DECLARAÇÃO DE QUEIMA CONTROLADA', icon: 'flame' },
      { id: 'amb_diap', num: '24', abbrev: 'DIAP', name: 'DIVISÃO DE ÁREAS PROTEGIDAS', icon: 'shield' },
      { id: 'amb_ceapd', num: '25', abbrev: 'CEAPD', name: 'CADASTRO ESTADUAL DE ATIVIDADES POTENCIALMENTE DEGRADANTES', icon: 'alert-triangle' },
    ],
    pecuarios: [
      { id: 'pec_cadastro', num: '1', abbrev: 'CADASTRO', name: 'FICHA ABERTURA DE CADASTRO', icon: 'user-plus' },
      { id: 'pec_sanitaria', num: '1.1', abbrev: 'FICHA SANITÁRIA', name: 'FICHA SANITÁRIA', isSub: true, icon: 'heart-pulse' },
      { id: 'pec_lista_docs', num: '1.2', abbrev: 'LISTA DOCS', name: 'LISTA DA DOCUMENTAÇÃO NECESSARIA PARA ABERTURA', isSub: true, icon: 'list-checks' },
      { id: 'pec_gta', num: '2', abbrev: 'GTA', name: 'GUIA DE TRÂNSITO ANIMAL', icon: 'truck' },
      { id: 'pec_dae', num: '2.1', abbrev: 'DAE / FUNDAP', name: 'DAE / FUNDAP', isSub: true, icon: 'receipt' },
      { id: 'pec_canc_gta', num: '2.2', abbrev: 'CANC. GTA', name: 'MODELO SOLICITAÇÃO CANCELAMENTO GTA', isSub: true, icon: 'x-circle' },
      { id: 'pec_nfe', num: '3', abbrev: 'NFE', name: 'NOTA FISCAL ELETRONICA DE VENDA', icon: 'receipt' },
      { id: 'pec_nfe_comp', num: '3.1', abbrev: 'COMPROVANTES', name: 'COMPROVANTES DE PAGAMENTO', isSub: true, icon: 'dollar-sign' },
      { id: 'pec_procuracao', num: '4', abbrev: 'PROCURAÇÃO', name: 'PROCURAÇÃO - OUTORGADO NILVA', icon: 'file-signature' },
    ]
  };

  // Inicializa fazendas padrão com checklists configurados
  Object.keys(farmData).forEach(slug => {
    if (!farmData[slug].checklists) {
      if (slug === 'sol-nascente') {
        farmData[slug].checklists = {
          propriedade: ['prop_contrato', 'prop_escritura', 'prop_matricula', 'prop_ccir', 'prop_ccir_comp', 'prop_itr', 'prop_itr_recibo', 'prop_mapa', 'prop_kml', 'prop_croqui'],
          ambientais: ['amb_car', 'amb_ada', 'amb_geo', 'amb_cefir', 'amb_certidao', 'amb_la', 'amb_lo', 'amb_outorga', 'amb_arl', 'amb_ctf'],
          pecuarios: ['pec_cadastro', 'pec_sanitaria', 'pec_gta', 'pec_dae', 'pec_nfe', 'pec_nfe_comp']
        };
      } else if (slug === 'boa-vista') {
        farmData[slug].checklists = {
          propriedade: ['prop_contrato', 'prop_escritura', 'prop_matricula', 'prop_ccir', 'prop_itr', 'prop_mapa'],
          ambientais: ['amb_car', 'amb_ada', 'amb_geo', 'amb_cefir', 'amb_la', 'amb_lp', 'amb_li', 'amb_lo', 'amb_appo', 'amb_outorga'],
          pecuarios: ['pec_cadastro', 'pec_sanitaria', 'pec_lista_docs', 'pec_gta', 'pec_nfe']
        };
      } else if (slug === 'serra-alta') {
        farmData[slug].checklists = {
          propriedade: ['prop_escritura', 'prop_matricula', 'prop_ccir', 'prop_itr', 'prop_itr_recibo', 'prop_mapa', 'prop_croqui'],
          ambientais: ['amb_car', 'amb_geo', 'amb_cefir', 'amb_certidao', 'amb_la', 'amb_lo', 'amb_relatorio', 'amb_arl'],
          pecuarios: ['pec_cadastro', 'pec_sanitaria', 'pec_gta', 'pec_dae']
        };
      } else {
        farmData[slug].checklists = {
          propriedade: ['prop_contrato', 'prop_matricula', 'prop_ccir', 'prop_itr', 'prop_mapa'],
          ambientais: ['amb_car', 'amb_geo', 'amb_cefir', 'amb_lp', 'amb_li'],
          pecuarios: ['pec_cadastro', 'pec_lista_docs']
        };
      }
    }
  });

  // ========== CONTROLADOR DO WIZARD DE CADASTRO (4 ETAPAS) ==========
  const newFarmBtn = document.getElementById('newFarmBtn');
  const newFarmModal = document.getElementById('newFarmModal');
  const newFarmModalCloseBtn = document.getElementById('newFarmModalCloseBtn');
  const newFarmCancelBtn = document.getElementById('newFarmCancelBtn');
  const newFarmForm = document.getElementById('newFarmForm');
  const wizardStepSubtitle = document.getElementById('wizardStepSubtitle');
  const newFarmStatusFeedback = document.getElementById('newFarmStatusFeedback');

  let currentWizardStep = 1;
  const wizardSelectedDocs = {
    propriedade: new Set(),
    ambientais: new Set(),
    pecuarios: new Set()
  };

  const wizardStepDescriptions = {
    1: 'Etapa 1 de 4: Informações e dados cadastrais básicos',
    2: 'Etapa 2 de 4: Checklist de Documentos da Propriedade (Fundiários)',
    3: 'Etapa 3 de 4: Checklist de Documentos Ambientais e Licenças',
    4: 'Etapa 4 de 4: Checklist de Documentos Pecuários (ADAB) & Finalização'
  };

  function renderWizardChecklistCategory(categoryKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const items = CHECKLIST_DEFINITIONS[categoryKey] || [];
    items.forEach(doc => {
      const isSelected = wizardSelectedDocs[categoryKey].has(doc.id);
      const row = document.createElement('div');
      row.className = `wizard-check-item ${isSelected ? 'selected' : ''} ${doc.isSub ? 'sub-item' : ''}`;
      row.dataset.docId = doc.id;
      row.dataset.category = categoryKey;

      row.innerHTML = `
        <div class="check-item-main">
          <span class="doc-num-badge">${doc.num}</span>
          <span class="doc-abbrev-tag">${doc.abbrev}</span>
          <span class="doc-name-text" title="${doc.name}">${doc.name}</span>
        </div>
        <div class="check-item-toggle">
          <span class="doc-status-pill ${isSelected ? 'presente' : 'pendente'}">
            ${isSelected ? '✓ Presente' : '○ Pendente'}
          </span>
          <div class="doc-custom-checkbox">
            <i data-lucide="check"></i>
          </div>
        </div>
      `;

      row.addEventListener('click', () => {
        if (wizardSelectedDocs[categoryKey].has(doc.id)) {
          wizardSelectedDocs[categoryKey].delete(doc.id);
          row.classList.remove('selected');
          const pill = row.querySelector('.doc-status-pill');
          if (pill) {
            pill.className = 'doc-status-pill pendente';
            pill.textContent = '○ Pendente';
          }
        } else {
          wizardSelectedDocs[categoryKey].add(doc.id);
          row.classList.add('selected');
          const pill = row.querySelector('.doc-status-pill');
          if (pill) {
            pill.className = 'doc-status-pill presente';
            pill.textContent = '✓ Presente';
          }
        }
        updateWizardCounters(categoryKey);
      });

      container.appendChild(row);
    });

    lucide.createIcons();
  }

  function updateWizardCounters(categoryKey) {
    const total = (CHECKLIST_DEFINITIONS[categoryKey] || []).length;
    const selected = wizardSelectedDocs[categoryKey].size;

    if (categoryKey === 'propriedade') {
      const el = document.getElementById('propriedadeCheckCount');
      if (el) el.textContent = `${selected} de ${total} selecionados`;
    } else if (categoryKey === 'ambientais') {
      const el = document.getElementById('ambientaisCheckCount');
      if (el) el.textContent = `${selected} de ${total} selecionados`;
    } else if (categoryKey === 'pecuarios') {
      const el = document.getElementById('pecuariosCheckCount');
      if (el) el.textContent = `${selected} de ${total} selecionados`;
    }
  }

  function setWizardCategorySelection(categoryKey, selectAll) {
    const items = CHECKLIST_DEFINITIONS[categoryKey] || [];
    if (selectAll) {
      items.forEach(doc => wizardSelectedDocs[categoryKey].add(doc.id));
    } else {
      wizardSelectedDocs[categoryKey].clear();
    }
    
    const containerId = categoryKey === 'propriedade' 
      ? 'propriedadeChecklistContainer' 
      : categoryKey === 'ambientais' 
        ? 'ambientaisChecklistContainer' 
        : 'pecuariosChecklistContainer';
        
    renderWizardChecklistCategory(categoryKey, containerId);
    updateWizardCounters(categoryKey);
  }

  function validateStep1() {
    const name = document.getElementById('newFarmNameInput').value.trim();
    const location = document.getElementById('newFarmLocationInput').value.trim();
    const area = document.getElementById('newFarmAreaInput').value.trim();
    const culture = document.getElementById('newFarmCultureInput').value.trim();

    if (!name) {
      alert('Por favor, preencha o Nome da Fazenda.');
      document.getElementById('newFarmNameInput').focus();
      return false;
    }
    if (!location) {
      alert('Por favor, preencha a Localização (Cidade, UF).');
      document.getElementById('newFarmLocationInput').focus();
      return false;
    }
    if (!area) {
      alert('Por favor, informe a Área Total em Hectares.');
      document.getElementById('newFarmAreaInput').focus();
      return false;
    }
    if (!culture) {
      alert('Por favor, informe a Cultura Principal.');
      document.getElementById('newFarmCultureInput').focus();
      return false;
    }
    return true;
  }

  function goToWizardStep(stepNum) {
    if (stepNum > currentWizardStep && currentWizardStep === 1) {
      if (!validateStep1()) return;
    }

    currentWizardStep = stepNum;

    // Atualiza panes
    for (let i = 1; i <= 4; i++) {
      const pane = document.getElementById(`wizardPane${i}`);
      if (pane) {
        if (i === stepNum) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      }
    }

    // Atualiza visual do Stepper
    const stepNodes = document.querySelectorAll('.wizard-step-node');
    stepNodes.forEach(node => {
      const nodeStep = parseInt(node.dataset.step);
      node.classList.remove('active', 'completed');
      if (nodeStep === stepNum) {
        node.classList.add('active');
      } else if (nodeStep < stepNum) {
        node.classList.add('completed');
      }
    });

    const connectors = document.querySelectorAll('.step-connector');
    connectors.forEach((conn, index) => {
      if (index < stepNum - 1) {
        conn.classList.add('completed');
      } else {
        conn.classList.remove('completed');
      }
    });

    if (wizardStepSubtitle && wizardStepDescriptions[stepNum]) {
      wizardStepSubtitle.textContent = wizardStepDescriptions[stepNum];
    }

    lucide.createIcons();
  }

  // Inicializa os checklists do modal
  function initWizardChecklists() {
    // Por padrão, já marca alguns documentos essenciais recomendados
    wizardSelectedDocs.propriedade.clear();
    ['prop_contrato', 'prop_escritura', 'prop_matricula', 'prop_ccir', 'prop_itr', 'prop_mapa'].forEach(id => wizardSelectedDocs.propriedade.add(id));

    wizardSelectedDocs.ambientais.clear();
    ['amb_car', 'amb_ada', 'amb_geo', 'amb_cefir', 'amb_la', 'amb_lo'].forEach(id => wizardSelectedDocs.ambientais.add(id));

    wizardSelectedDocs.pecuarios.clear();
    ['pec_cadastro', 'pec_sanitaria', 'pec_gta', 'pec_nfe'].forEach(id => wizardSelectedDocs.pecuarios.add(id));

    renderWizardChecklistCategory('propriedade', 'propriedadeChecklistContainer');
    renderWizardChecklistCategory('ambientais', 'ambientaisChecklistContainer');
    renderWizardChecklistCategory('pecuarios', 'pecuariosChecklistContainer');

    updateWizardCounters('propriedade');
    updateWizardCounters('ambientais');
    updateWizardCounters('pecuarios');
  }

  // Seletor visual de foto de capa
  const coverOptions = document.querySelectorAll('.cover-option');
  coverOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      coverOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Botões de navegação do Wizard
  const wizardNextBtn1 = document.getElementById('wizardNextBtn1');
  if (wizardNextBtn1) wizardNextBtn1.addEventListener('click', () => goToWizardStep(2));

  const wizardBackBtn2 = document.getElementById('wizardBackBtn2');
  if (wizardBackBtn2) wizardBackBtn2.addEventListener('click', () => goToWizardStep(1));

  const wizardNextBtn2 = document.getElementById('wizardNextBtn2');
  if (wizardNextBtn2) wizardNextBtn2.addEventListener('click', () => goToWizardStep(3));

  const wizardBackBtn3 = document.getElementById('wizardBackBtn3');
  if (wizardBackBtn3) wizardBackBtn3.addEventListener('click', () => goToWizardStep(2));

  const wizardNextBtn3 = document.getElementById('wizardNextBtn3');
  if (wizardNextBtn3) wizardNextBtn3.addEventListener('click', () => goToWizardStep(4));

  const wizardBackBtn4 = document.getElementById('wizardBackBtn4');
  if (wizardBackBtn4) wizardBackBtn4.addEventListener('click', () => goToWizardStep(3));

  // Ações de selecionar todos / desmarcar
  const propSelectAllBtn = document.getElementById('propSelectAllBtn');
  if (propSelectAllBtn) propSelectAllBtn.addEventListener('click', () => setWizardCategorySelection('propriedade', true));
  const propClearAllBtn = document.getElementById('propClearAllBtn');
  if (propClearAllBtn) propClearAllBtn.addEventListener('click', () => setWizardCategorySelection('propriedade', false));

  const ambSelectAllBtn = document.getElementById('ambSelectAllBtn');
  if (ambSelectAllBtn) ambSelectAllBtn.addEventListener('click', () => setWizardCategorySelection('ambientais', true));
  const ambClearAllBtn = document.getElementById('ambClearAllBtn');
  if (ambClearAllBtn) ambClearAllBtn.addEventListener('click', () => setWizardCategorySelection('ambientais', false));

  const pecSelectAllBtn = document.getElementById('pecSelectAllBtn');
  if (pecSelectAllBtn) pecSelectAllBtn.addEventListener('click', () => setWizardCategorySelection('pecuarios', true));
  const pecClearAllBtn = document.getElementById('pecClearAllBtn');
  if (pecClearAllBtn) pecClearAllBtn.addEventListener('click', () => setWizardCategorySelection('pecuarios', false));

  // Clique direto no stepper para etapas anteriores ou atuais
  const stepNodes = document.querySelectorAll('.wizard-step-node');
  stepNodes.forEach(node => {
    node.addEventListener('click', () => {
      const step = parseInt(node.dataset.step);
      if (step < currentWizardStep || (currentWizardStep === 1 && validateStep1())) {
        goToWizardStep(step);
      }
    });
  });

  function openNewFarmModal() {
    if (!newFarmModal) return;
    initWizardChecklists();
    goToWizardStep(1);
    newFarmModal.classList.add('visible');
    const nameInput = document.getElementById('newFarmNameInput');
    if (nameInput) nameInput.focus();
    lucide.createIcons();
  }

  function closeNewFarmModal() {
    if (newFarmModal) newFarmModal.classList.remove('visible');
    if (newFarmForm) newFarmForm.reset();
    if (newFarmStatusFeedback) newFarmStatusFeedback.textContent = '';
    goToWizardStep(1);
  }

  if (newFarmBtn) newFarmBtn.addEventListener('click', openNewFarmModal);
  if (newFarmModalCloseBtn) newFarmModalCloseBtn.addEventListener('click', closeNewFarmModal);
  if (newFarmCancelBtn) newFarmCancelBtn.addEventListener('click', closeNewFarmModal);
  if (newFarmModal) {
    newFarmModal.addEventListener('click', (e) => {
      if (e.target === newFarmModal) closeNewFarmModal();
    });
  }

  if (newFarmForm) {
    newFarmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newFarmNameInput').value.trim();
      const location = document.getElementById('newFarmLocationInput').value.trim();
      const areaStr = document.getElementById('newFarmAreaInput').value.trim();
      const culture = document.getElementById('newFarmCultureInput').value.trim();
      const status = document.getElementById('newFarmStatusInput').value;

      const checkedCover = document.querySelector('input[name="farmCoverChoice"]:checked');
      const coverImg = checkedCover ? checkedCover.value : 'fazenda_sol_nascente.png';

      if (!name || !location || !areaStr || !culture) {
        goToWizardStep(1);
        validateStep1();
        return;
      }

      const submitBtn = document.getElementById('wizardSubmitFarmBtn');
      if (submitBtn) submitBtn.disabled = true;
      if (newFarmStatusFeedback) {
        newFarmStatusFeedback.style.color = 'var(--text-secondary)';
        newFarmStatusFeedback.textContent = '⏳ Salvando fazenda e auditoria de documentos...';
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const newFarmObj = {
        id: null,
        slug: slug,
        name: name,
        location: location,
        area: areaStr.includes('hectares') ? areaStr : `${areaStr} hectares`,
        culture: culture,
        status: status,
        cover: coverImg,
        checklists: {
          propriedade: Array.from(wizardSelectedDocs.propriedade),
          ambientais: Array.from(wizardSelectedDocs.ambientais),
          pecuarios: Array.from(wizardSelectedDocs.pecuarios)
        }
      };

      if (!farms.some(f => f.id === slug)) {
        farms.push({ id: slug, name: name, icon: 'tractor' });
        farmData[slug] = newFarmObj;
      } else {
        farmData[slug] = newFarmObj;
      }

      if (supabaseClient) {
        try {
          const areaNum = parseFloat(areaStr.replace(/\D/g, '')) || 0;
          await supabaseClient.from('fazendas').insert([{
            slug: slug,
            nome: name,
            localizacao: location,
            area_hectares: areaNum,
            cultura: culture,
            status: status,
            imagem_capa: coverImg
          }]);
        } catch (err) {
          console.warn('Aviso ao salvar fazenda no Supabase:', err.message);
        }
      }

      try {
        const customFarms = Object.values(farmData).filter(f => !['sol-nascente', 'boa-vista', 'serra-alta', 'vale-verde'].includes(f.slug || f.id));
        localStorage.setItem('agroclaw_custom_farms', JSON.stringify(customFarms));
      } catch (err) {}

      if (newFarmStatusFeedback) {
        newFarmStatusFeedback.style.color = '#047857';
        newFarmStatusFeedback.textContent = '✅ Fazenda e checklists cadastrados com sucesso!';
      }

      renderFazendasGrid();
      renderPastasSection();

      setTimeout(() => {
        closeNewFarmModal();
        if (submitBtn) submitBtn.disabled = false;
      }, 600);
    });
  }

  // ========== 2. CHAT FUNCTIONALITY (SUPABASE INTEGRATION) ==========
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');

  // Chat Attachment DOM Elements
  const chatAttachBtn = document.getElementById('chatAttachBtn');
  const chatAttachInput = document.getElementById('chatAttachInput');
  const chatAttachmentPreview = document.getElementById('chatAttachmentPreview');
  const chatAttachmentName = document.getElementById('chatAttachmentName');
  const chatAttachmentRemove = document.getElementById('chatAttachmentRemove');
  let currentChatAttachment = null;
  let currentChatAttachmentText = null;

  function updateChatSendButton() {
    if(sendBtn) sendBtn.disabled = chatInput.value.trim() === '' && !currentChatAttachment;
  }

  if (chatAttachBtn && chatAttachInput) {
    chatAttachBtn.addEventListener('click', () => chatAttachInput.click());
    chatAttachInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        currentChatAttachment = file;
        chatAttachmentName.textContent = file.name;
        chatAttachmentPreview.style.display = 'flex';
        updateChatSendButton();
        if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
          const reader = new FileReader();
          reader.onload = (ev) => currentChatAttachmentText = ev.target.result;
          reader.readAsText(file);
        } else {
          currentChatAttachmentText = null;
        }
      }
    });
  }

  if (chatAttachmentRemove) {
    chatAttachmentRemove.addEventListener('click', () => {
      currentChatAttachment = null;
      currentChatAttachmentText = null;
      chatAttachInput.value = '';
      chatAttachmentPreview.style.display = 'none';
      updateChatSendButton();
    });
  }

  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      updateChatSendButton();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
      }
    });
  }

  async function saveChatMessageToSupabase(remetente, conteudo) {
    if (!supabaseClient) return;
    try {
      await supabaseClient.from('mensagens_chat').insert([{ remetente, conteudo }]);
    } catch (e) {
      console.warn('Aviso ao salvar chat no Supabase:', e.message);
    }
  }

  // Configurações da API da Groq com Seletor Dinâmico
  const GROQ_API_KEY = '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';
  const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
  const aiModelSelect = document.getElementById('aiModelSelect');

  // Carrega preferência de modelo salva no localStorage
  if (aiModelSelect) {
    const savedModel = localStorage.getItem('agroclaw_selected_ai_model');
    if (savedModel) aiModelSelect.value = savedModel;
    aiModelSelect.addEventListener('change', () => {
      localStorage.setItem('agroclaw_selected_ai_model', aiModelSelect.value);
    });
  }

  function getSelectedModel() {
    return (aiModelSelect ? aiModelSelect.value : 'qwen/qwen3.6-27b') || 'qwen/qwen3.6-27b';
  }

  function getSaoPauloDate() {
    const now = new Date();
    const spTimeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(spTimeString);
  }

  function getSaoPauloISO() {
    const spDate = getSaoPauloDate();
    const year = spDate.getFullYear();
    const month = String(spDate.getMonth() + 1).padStart(2, '0');
    const day = String(spDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  function buildSystemPrompt() {
    const todayStr = getSaoPauloDate().toLocaleDateString('pt-BR');
    return `[REGRA ABSOLUTA E INVIOLÁVEL: VOCÊ DEVE RESPONDER SEMPRE E EXCLUSIVAMENTE EM PORTUGUÊS DO BRASIL (PT-BR). NUNCA RESPONDA EM INGLÊS OU QUALQUER OUTRO IDIOMA. NUNCA EXIBA SEU PROCESSO DE PENSAMENTO OU FRASES COMO "Here's a thinking process". RESPONDA DIRETO A RESPOSTA FINAL EM PORTUGUÊS.]

[REGRA OBRIGATÓRIA DE DATA: FORMATAR TODAS AS DATAS SEMPRE NO PADRÃO BRASILEIRO DD/MM/YYYY. NUNCA FORMATAR DATAS COMO YYYY-MM-DD.]

[REGRA INTELIGENTE DE PRÓXIMOS VENCIMENTOS: A DATA DE HOJE É ${todayStr} (HORÁRIO DE SÃO PAULO/BRASIL). QUANDO O USUÁRIO PERGUNTAR QUAL O "PRÓXIMO A PAGAR" OU QUAIS SÃO OS PRÓXIMOS VENCIMENTOS, APONTE O PRÓXIMO VENCIMENTO FUTURO (A PARTIR DE HOJE ${todayStr}) E, SE HOUVER IMPOSTOS ATRASADOS QUE VENCERAM ANTES DE HOJE, ALERTE QUE JÁ ESTÃO VENCIDOS/ATRASADOS! CONTEXTUALIZE A DIFERENÇA ENTRE O QUE JÁ VENCEU E O QUE VENCERÁ A SEGUIR.]

Você é o AgroClaw IA, assistente virtual especialista e CONECTADO EM TEMPO REAL ao banco de dados do AgroClaw.
Sempre consulte e use os dados reais do sistema fornecidos para responder com precisão cirúrgica sobre fazendas, safras, impostos, obrigações e prazos de pagamento.`;
  }

  // Função para injetar o contexto dos dados do sistema em tempo real na IA
  function buildSystemContext() {
    const today = getSaoPauloDate();
    const todayStr = today.toLocaleDateString('pt-BR');
    const todayISO = getSaoPauloISO();

    let contextStr = `\n--- DADOS EM TEMPO REAL DO SISTEMA AGROCLAW ---\n`;
    contextStr += `DATA ATUAL DE HOJE NO SISTEMA (HORÁRIO DE SÃO PAULO/BRASIL): ${todayStr}\n\n`;

    // 1. FAZENDAS
    contextStr += `FAZENDAS CADASTRADAS:\n`;
    if (typeof farmData !== 'undefined') {
      Object.values(farmData).forEach(f => {
        const checklists = f.checklists || {};
        const pCount = (checklists.propriedade || []).length;
        const aCount = (checklists.ambientais || []).length;
        const pecCount = (checklists.pecuarios || []).length;
        contextStr += `• ${f.name}: Localização (${f.location}), Área (${f.area}), Cultura (${f.culture}), Status (${f.status}) | Documentação: Propriedade (${pCount}/10), Ambientais (${aCount}/28), ADAB Pecuária (${pecCount}/8)\n`;
      });
    }
    contextStr += `\n`;

    // 2. AGENDA / IMPOSTOS / OBRIGAÇÕES
    contextStr += `AGENDA DE OBRIGAÇÕES, IMPOSTOS E VENCIMENTOS:\n`;
    if (typeof tasks !== 'undefined' && Array.isArray(tasks)) {
      const pendingTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed);

      // Separa tarefas pendentes entre ATRASADAS/VENCIDAS (data < hoje) e FUTURAS A VENCER (data >= hoje)
      const overduePending = pendingTasks.filter(t => t.date < todayISO);
      const futurePending = pendingTasks.filter(t => t.date >= todayISO).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (overduePending.length > 0) {
        contextStr += `-> IMPOSTOS E OBRIGAÇÕES JÁ VENCIDOS / ATRASADOS (Venceram antes de hoje ${todayStr}):\n`;
        overduePending.forEach(t => {
          contextStr += `  - 🚨 [ATRASADO/VENCIDO] ${t.title} | Data de Vencimento: ${formatDateBR(t.date)} (ATENÇÃO: Já passou do prazo!)\n`;
        });
        contextStr += `\n`;
      }

      if (futurePending.length > 0) {
        contextStr += `-> PRÓXIMOS VENCIMENTOS FUTUROS (Vencem a partir de hoje ${todayStr}):\n`;
        futurePending.forEach(t => {
          contextStr += `  - ⏳ [FUTURO A VENCER] ${t.title} | Data de Vencimento: ${formatDateBR(t.date)} | Prioridade: ${t.priority.toUpperCase()}\n`;
        });
      } else {
        contextStr += `-> Não há vencimentos futuros pendentes cadastrados.\n`;
      }

      if (completedTasks.length > 0) {
        contextStr += `\n-> OBRIGAÇÕES JÁ CONCLUÍDAS / PAGAS NO PASSADO:\n`;
        completedTasks.forEach(t => {
          contextStr += `  - ✅ [CONCLUÍDO/PAGO] ${t.title} | Data: ${formatDateBR(t.date)}\n`;
        });
      }
    }
    contextStr += `\n--- FIM DOS DADOS DO SISTEMA ---\n`;

    return contextStr;
  }

  let chatHistory = [
    {
      role: 'system',
      content: buildSystemPrompt()
    }
  ];

  function cleanAIThinkingProcess(text) {
    if (!text) return '';

    // 1. Remove tags <think>...</think>
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // 2. Se a resposta contiver rascunho de pensamento em inglês (ex: "Here's a thinking process:")
    if (/Here'?s a thinking process/i.test(cleaned) || /Thinking process:/i.test(cleaned)) {
      // Procura o início real da resposta em português
      const matchPtBr = cleaned.match(/(?:Com base|Segue|Olá|Identifiquei|Aqui estão|Temos|Atualmente|Para|Verifiquei|Resumo|Com relação|Em relação|🔴|🟡|🟢|📋|🌾|🌍|📊|🌤️)/i);

      if (matchPtBr && matchPtBr.index > 0) {
        cleaned = cleaned.substring(matchPtBr.index);
      } else {
        // Tenta achar após 'Draft Response' ou 'Response'
        const matchDraft = cleaned.match(/(?:Draft Response|Final Response|Response|Resposta):?\s*([\s\S]*)/i);
        if (matchDraft && matchDraft[1]) {
          cleaned = matchDraft[1];
        } else {
          // Se não encontrou o separador, remove a primeira seção em inglês
          cleaned = cleaned.replace(/^Here'?s a thinking process:[\s\S]*?\n\n/gi, '');
        }
      }
    }

    return cleaned.trim();
  }

  async function fetchGroqAIResponse(userText) {
    const systemContext = buildSystemContext();
    const systemPromptBase = buildSystemPrompt();

    const fullMessages = [
      {
        role: 'system',
        content: `${systemPromptBase}

${systemContext}

Forneça sempre respostas claras, bem estruturadas em Português do Brasil, com formatação limpa em markdown (tópicos e negritos).`
      },
      ...chatHistory.filter(m => m.role !== 'system'),
      { role: 'user', content: userText }
    ];

    chatHistory.push({ role: 'user', content: userText });
    const modelToUse = getSelectedModel();

    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: fullMessages,
          temperature: 0.5,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Status HTTP ${response.status}`);
      }

      const data = await response.json();
      let aiReply = (data.choices && data.choices[0] && data.choices[0].message)
        ? data.choices[0].message.content
        : 'Desculpe, não consegui obter a resposta no momento.';

      // Sanitiza e remove qualquer rascunho de pensamento em inglês gerado pelo modelo
      aiReply = cleanAIThinkingProcess(aiReply);

      if (!aiReply) {
        aiReply = getAIResponse(userText);
      }

      chatHistory.push({ role: 'assistant', content: aiReply });
      return aiReply;

    } catch (err) {
      console.warn('Erro ao conectar à API do Groq (usando resposta contingencial):', err);
      return getAIResponse(userText);
    }
  }

  async function sendMessage(text) {
    if (!text.trim() && !currentChatAttachment) return;

    let displayMsg = text;
    let aiPromptMsg = text;

    if (currentChatAttachment) {
      const attachInfo = `[Anexo enviado pelo usuário: ${currentChatAttachment.name}]`;
      displayMsg = text ? `${text}\n\n📎 ${currentChatAttachment.name}` : `📎 ${currentChatAttachment.name}`;
      
      if (currentChatAttachmentText) {
        aiPromptMsg = text ? `${text}\n\n${attachInfo}\nConteúdo do arquivo anexado:\n${currentChatAttachmentText}` : `${attachInfo}\nConteúdo do arquivo anexado:\n${currentChatAttachmentText}`;
      } else {
        aiPromptMsg = text ? `${text}\n\n${attachInfo}` : `${attachInfo}`;
      }
    }

    const userMsg = createChatMessage('user', displayMsg, 'Você');
    chatMessages.appendChild(userMsg);
    saveChatMessageToSupabase('user', displayMsg);

    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    if (chatAttachmentRemove) chatAttachmentRemove.click();
    updateChatSendButton();

    chatMessages.scrollTop = chatMessages.scrollHeight;

    lucide.createIcons();

    const typingEl = createTypingIndicator();
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    lucide.createIcons();

    const selectedOptionText = aiModelSelect ? aiModelSelect.options[aiModelSelect.selectedIndex].text.split(' ')[0] : 'Groq';

    try {
      const aiResponse = await fetchGroqAIResponse(aiPromptMsg);
      typingEl.remove();

      const aiMsg = createChatMessage('ai', aiResponse, `AgroClaw IA (${selectedOptionText})`);
      chatMessages.appendChild(aiMsg);
      saveChatMessageToSupabase('ai', aiResponse);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      lucide.createIcons();
    } catch (err) {
      typingEl.remove();
      const fallbackResponse = getAIResponse(text);
      const aiMsg = createChatMessage('ai', fallbackResponse, 'AgroClaw IA');
      chatMessages.appendChild(aiMsg);
      saveChatMessageToSupabase('ai', fallbackResponse);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      lucide.createIcons();
    }
  }

  function createChatMessage(role, text, sender) {
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;

    const avatarContent = role === 'ai'
      ? `<i data-lucide="sprout" style="width: 16px; height: 16px; stroke: white;"></i>`
      : 'V';

    const now = getSaoPauloDate();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const formattedText = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• (.*?)(<br>|$)/g, '<li>$1</li>');

    div.innerHTML = `
      <div class="message-avatar">${avatarContent}</div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${sender}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-body"><p>${formattedText}</p></div>
      </div>
    `;
    return div;
  }

  function createTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'chat-message ai';
    div.innerHTML = `
      <div class="message-avatar">
        <i data-lucide="sprout" style="width: 16px; height: 16px; stroke: white;"></i>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">AgroClaw IA</span>
          <span class="message-time">digitando...</span>
        </div>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    return div;
  }

  const aiResponses = {
    'solo': '🌍 **Análise do Solo — Fazenda Sol Nascente:**\n\nO solo apresenta nível de umidade em **68%**, considerado ideal para a fase de crescimento da soja. O pH está em **6.2**, dentro da faixa recomendada. A última análise de nutrientes indicou:\n\n• Nitrogênio: Adequado\n• Fósforo: Levemente abaixo — recomendo suplementação com superfosfato\n• Potássio: Adequado\n\nRecomendo agendar uma nova análise de solo para a segunda quinzena de agosto.',
    'relatório': '📊 **Relatório de Colheita — Fazenda Boa Vista:**\n\nA safra de milho está em estágio avançado de maturação. Estimativa de colheita: **~12 dias**.\n\n• Produtividade estimada: **185 sacas/hectare**\n• Área total: 650 hectares\n• Produção total estimada: **120.250 sacas**\n• Qualidade dos grãos: Excelente (umidade 13.5%)\n\nRecomendo preparar a logística de transporte e negociar contratos de venda antecipados para aproveitar o preço atual do milho no mercado.',
    'previsão': '🌤️ **Previsão do Tempo — Próximas 48h:**\n\n• Hoje: Parcialmente nublado, máx 28°C, mín 16°C. Sem chuva.\n• Amanhã: Sol com nuvens, máx 30°C, mín 17°C. 10% chance de chuva.\n• Sexta-feira: Chuva moderada prevista (15-25mm), máx 24°C. Atenção para a Fazenda Serra Alta — a floração do café pode ser afetada.\n\nRecomendo antecipar a aplicação de fungicida na Serra Alta antes da chuva de sexta.',
    'impostos': '📋 **Obrigações e Lembretes Fiscais Ativos:**\n\nIdentifiquei as seguintes obrigações governamentais e prazos de pagamento pendentes para as suas fazendas:\n\n• 🌾 **Funrural (Junho):** Vence em **20/07/2026** (Em 5 dias) — Crucial para emitir Notas Fiscais sem bloqueios.\n• 🗺️ **Guia CCIR 2026 (Incra):** Taxa anual obrigatória para transacionar ou financiar o imóvel, vence em **10/08/2026**.\n• 🌳 **Retificação do CAR:** Notificação estadual pendente. Prazo final de 90 dias expira em **15/09/2026**.\n• 📊 **Declaração do ITR 2026:** Prazo nacional definitivo de entrega e pagamento até **30/09/2026**.\n\nDeseja que eu te auxilie a baixar alguma guia ou preparar os dados territoriais para o ITR?',
    'default': '✅ Entendi sua solicitação! Estou analisando os dados das suas fazendas para fornecer a melhor resposta.\n\nEnquanto isso, posso ajudar com:\n• Lembretes de obrigações e impostos (ITR, CCIR, Funrural, CAR)\n• Análise de solo e nutrientes\n• Previsões meteorológicas\n• Relatórios de safra e colheita\n\nQual aspecto você gostaria de explorar?'
  };

  function getAIResponse(userText) {
    const lower = userText.toLowerCase();
    if (lower.includes('solo') || lower.includes('umidade') || lower.includes('nutriente')) return aiResponses['solo'];
    if (lower.includes('relatório') || lower.includes('colheita') || lower.includes('safra') || lower.includes('produção')) return aiResponses['relatório'];
    if (lower.includes('tempo') || lower.includes('clima') || lower.includes('chuva') || lower.includes('previsão')) return aiResponses['previsão'];
    if (lower.includes('imposto') || lower.includes('pagamento') || lower.includes('tributo') || lower.includes('documento') || lower.includes('itr') || lower.includes('ccir') || lower.includes('car') || lower.includes('prazo') || lower.includes('vencimento') || lower.includes('guia') || lower.includes('governo')) return aiResponses['impostos'];
    return aiResponses['default'];
  }

  if (sendBtn) sendBtn.addEventListener('click', () => sendMessage(chatInput.value));

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const suggestion = chip.dataset.suggestion;
      if (suggestion) sendMessage(suggestion);
    });
  });

  const clearChatBtn = document.getElementById('clearChatBtn');
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      const isConfirmed = confirm('Deseja realmente limpar todo o histórico de conversa com o Agente IA?');
      if (!isConfirmed) return;

      // Reseta o histórico enviado para o modelo da Groq
      chatHistory = [
        {
          role: 'system',
          content: `[REGRA ABSOLUTA E INVIOLÁVEL: VOCÊ DEVE RESPONDER SEMPRE E EXCLUSIVAMENTE EM PORTUGUÊS DO BRASIL (PT-BR). NUNCA RESPONDA EM INGLÊS OU QUALQUER OUTRO IDIOMA.]

Você é o AgroClaw IA, assistente virtual especialista em gestão de fazendas, agronegócio, tributos rurais brasileiros (ITR, CCIR, Funrural, CAR, Outorgas de água, GTA, NF-e Produtor Rural) e monitoramento de safra/clima no Brasil.
Forneça sempre respostas claras, bem estruturadas em Português do Brasil, com formatação limpa em markdown (tópicos e negritos).`
        }
      ];

      // Limpa as mensagens do DOM e exibe a mensagem de boas vindas limpa
      if (chatMessages) {
        chatMessages.innerHTML = `
          <div class="chat-message ai">
            <div class="message-avatar">
              <i data-lucide="sprout" style="width: 16px; height: 16px; stroke: white;"></i>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">AgroClaw IA</span>
                <span class="message-time">agora</span>
              </div>
              <div class="message-body">
                <p>Olá! Sou seu assistente de inteligência artificial para gerenciamento de Fazendas.</p>
                <p>Como posso ajudar você hoje?</p>
              </div>
              <div class="chat-suggestions">
                <button class="suggestion-chip" data-suggestion="Como está o solo da Fazenda Sol Nascente?">
                  <i data-lucide="info" style="width: 14px; height: 14px;"></i>
                  Solo da Fazenda Sol Nascente
                </button>
                <button class="suggestion-chip" data-suggestion="Gerar relatório de colheita da Fazenda Boa Vista">
                  <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
                  Relatório de colheita
                </button>
                <button class="suggestion-chip" data-suggestion="Quais impostos ou obrigações vencem em breve?">
                  <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                  Impostos e obrigações a vencer
                </button>
              </div>
            </div>
          </div>
        `;

        chatMessages.querySelectorAll('.suggestion-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const suggestion = chip.dataset.suggestion;
            if (suggestion) sendMessage(suggestion);
          });
        });
      }

      lucide.createIcons();
    });
  }

  // ========== 3. CALENDAR & POPUP DE PAGAMENTOS ==========
  let currentDate = getSaoPauloDate();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();

  const calendarGrid = document.getElementById('calendarGrid');
  const calendarMonthYear = document.getElementById('calendarMonthYear');
  const calendarPrev = document.getElementById('calendarPrev');
  const calendarNext = document.getElementById('calendarNext');
  const calendarTooltip = document.getElementById('calendarTooltip');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  let tasks = [
    { id: 1, title: 'Pagamento Funrural — Competência Junho', date: '2026-07-20', priority: 'alta', completed: false },
    { id: 2, title: 'Emissão e Pagamento da Guia CCIR 2026 (Incra)', date: '2026-08-10', priority: 'alta', completed: false },
    { id: 3, title: 'Protocolar Ato de Declaração Ambiental (ADA - IBAMA)', date: '2026-09-30', priority: 'media', completed: false },
    { id: 4, title: 'Retificação do CAR: Enviar documentos (Notificação - Prazo 90 dias)', date: '2026-09-15', priority: 'alta', completed: false },
    { id: 5, title: 'Declaração e Apuração Anual do ITR 2026', date: '2026-09-30', priority: 'alta', completed: false },
    { id: 6, title: 'Taxa Estadual de Outorga de Água — Sol Nascente', date: '2026-08-25', priority: 'media', completed: false },
    { id: 7, title: 'Pagamento de Taxa de Emissão de GTA (Lote Bovino #491)', date: '2026-07-10', priority: 'baixa', completed: true },
    { id: 8, title: 'Livro Caixa Digital do Produtor Rural (LCDPR)', date: '2026-06-30', priority: 'alta', completed: true },
  ];

  function saveTasksToLocalStorage() {
    try {
      localStorage.setItem('agroclaw_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Erro ao salvar tarefas no localStorage:', e);
    }
  }

  function loadTasksFromLocalStorage() {
    try {
      const saved = localStorage.getItem('agroclaw_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          tasks = parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar tarefas do localStorage:', e);
    }
  }

  loadTasksFromLocalStorage();

  function showCalendarTooltip(e, dateFormatted, pendingTasks, completedTasks) {
    if (!calendarTooltip) return;

    let html = `
      <div class="calendar-tooltip-header">
        <i data-lucide="calendar-clock" style="width: 14px; height: 14px; color: var(--accent-danger);"></i>
        Prazos & Pagamentos (${dateFormatted})
      </div>
    `;

    if (pendingTasks.length > 0) {
      pendingTasks.forEach(t => {
        html += `
          <div class="calendar-tooltip-item">
            <span class="calendar-tooltip-title">${t.title}</span>
            <div class="calendar-tooltip-meta">
              <span class="task-priority ${t.priority}">${capitalize(t.priority)}</span>
              <span style="color: var(--accent-danger); font-weight: 700;">⏳ Pendente de Pagamento</span>
            </div>
          </div>
        `;
      });
    }

    if (completedTasks.length > 0) {
      completedTasks.forEach(t => {
        html += `
          <div class="calendar-tooltip-item" style="opacity: 0.7;">
            <span class="calendar-tooltip-title" style="text-decoration: line-through;">${t.title}</span>
            <div class="calendar-tooltip-meta">
              <span class="task-priority baixa">Concluído</span>
              <span style="color: #047857; font-weight: 700;">✓ Pago</span>
            </div>
          </div>
        `;
      });
    }

    calendarTooltip.innerHTML = html;
    calendarTooltip.classList.add('visible');
    positionCalendarTooltip(e);
    lucide.createIcons();
  }

  function positionCalendarTooltip(e) {
    if (!calendarTooltip) return;
    const tooltipWidth = 280;
    const tooltipHeight = calendarTooltip.offsetHeight || 120;

    let left = e.clientX + 15;
    let top = e.clientY + 15;

    if (left + tooltipWidth > window.innerWidth - 20) {
      left = e.clientX - tooltipWidth - 15;
    }
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = e.clientY - tooltipHeight - 15;
    }

    calendarTooltip.style.left = `${left}px`;
    calendarTooltip.style.top = `${top}px`;
  }

  function hideCalendarTooltip() {
    if (calendarTooltip) {
      calendarTooltip.classList.remove('visible');
    }
  }

  function renderCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = '';
    calendarMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    dayNames.forEach(name => {
      const el = document.createElement('div');
      el.className = 'calendar-day-name';
      el.textContent = name;
      calendarGrid.appendChild(el);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    const today = getSaoPauloDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const el = document.createElement('div');
      el.className = 'calendar-day other-month';
      el.textContent = daysInPrevMonth - i;
      calendarGrid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';

      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const dateDisplayStr = `${dayStr}/${monthStr}/${currentYear}`;

      const pendingOnDay = tasks.filter(t => t.date === fullDateStr && !t.completed);
      const completedOnDay = tasks.filter(t => t.date === fullDateStr && t.completed);

      if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
        el.classList.add('today');
      }

      if (pendingOnDay.length > 0) {
        el.classList.add('has-pending-payment');
      } else if (completedOnDay.length > 0) {
        el.classList.add('has-completed-payment');
      }

      el.textContent = d;

      if (pendingOnDay.length > 0 || completedOnDay.length > 0) {
        el.addEventListener('mouseenter', (e) => {
          showCalendarTooltip(e, dateDisplayStr, pendingOnDay, completedOnDay);
        });
        el.addEventListener('mousemove', (e) => {
          positionCalendarTooltip(e);
        });
        el.addEventListener('mouseleave', () => {
          hideCalendarTooltip();
        });
      }

      calendarGrid.appendChild(el);
    }

    const totalCells = calendarGrid.children.length;
    const remaining = 49 - totalCells;
    for (let i = 1; i <= remaining; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day other-month';
      el.textContent = i;
      calendarGrid.appendChild(el);
    }
  }

  if (calendarPrev) {
    calendarPrev.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
  }

  if (calendarNext) {
    calendarNext.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }

  renderCalendar();

  // ========== 4. TASKS / OBRIGAÇÕES (SUPABASE INTEGRATION) ==========
  const tasksList = document.getElementById('tasksList');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const addTaskForm = document.getElementById('addTaskForm');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskDateInput = document.getElementById('taskDateInput');
  const taskPriorityInput = document.getElementById('taskPriorityInput');



  async function loadObrigacoesFromSupabase() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('obrigacoes').select('*').order('data_vencimento', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        tasks = data.map(item => ({
          id: item.id,
          title: item.titulo,
          date: item.data_vencimento,
          priority: item.prioridade,
          completed: item.concluida,
          categoria: item.categoria
        }));
        renderTasks();
      }
    } catch (err) {
      console.warn('Usando obrigações locais fallback:', err.message);
    }
  }

  function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';

    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.date) - new Date(b.date);
    });

    sorted.forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item ${task.completed ? 'completed' : ''}`;
      el.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}">
          <i data-lucide="check" style="width: 12px; height: 12px; stroke: white;"></i>
        </div>
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            <span>${formatDate(task.date)}</span>
          </div>
        </div>
        <span class="task-priority ${task.priority}">${capitalize(task.priority)}</span>
        <div class="task-actions" style="display: flex; gap: 4px; margin-left: 8px; align-items: center;">
          <button class="task-action-btn edit-task-btn" data-task-id="${task.id}" title="Editar Obrigação" style="background: transparent; border: none; padding: 4px; color: var(--text-tertiary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
            <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="task-action-btn delete-task-btn" data-task-id="${task.id}" title="Excluir Obrigação" style="background: transparent; border: none; padding: 4px; color: var(--text-tertiary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;
      tasksList.appendChild(el);
    });

    document.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('click', async () => {
        const id = cb.dataset.taskId;
        const task = tasks.find(t => String(t.id) === String(id));
        if (task) {
          task.completed = !task.completed;
          saveTasksToLocalStorage();
          renderTasks();
          renderCalendar();

          if (supabaseClient) {
            try {
              // 1. Tenta atualizar pelo ID na tabela 'obrigacoes'
              const { error: err1 } = await supabaseClient
                .from('obrigacoes')
                .update({ concluida: task.completed })
                .eq('id', task.id);

              if (err1) {
                // 2. Fallback: atualiza pelo título da obrigação caso o ID seja numérico local
                await supabaseClient
                  .from('obrigacoes')
                  .update({ concluida: task.completed })
                  .eq('titulo', task.title);
              }
            } catch (err) {
              console.warn('Aviso: Atualização de obrigação salva localmente:', err.message);
            }
          }
        }
      });
    });

    document.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.taskId;
        const task = tasks.find(t => String(t.id) === String(id));
        if (!task) return;

        const editTaskIdInput = document.getElementById('editTaskIdInput');
        const editTaskTitleInput = document.getElementById('editTaskTitleInput');
        const editTaskDateInput = document.getElementById('editTaskDateInput');
        const editTaskPriorityInput = document.getElementById('editTaskPriorityInput');

        if (editTaskIdInput) editTaskIdInput.value = task.id;
        if (editTaskTitleInput) editTaskTitleInput.value = task.title;
        if (editTaskDateInput) editTaskDateInput.value = task.date;
        if (editTaskPriorityInput) editTaskPriorityInput.value = task.priority;

        const editTaskModal = document.getElementById('editTaskModal');
        if (editTaskModal) editTaskModal.classList.add('visible');
        lucide.createIcons();
      });
    });

    document.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.taskId;
        const task = tasks.find(t => String(t.id) === String(id));
        if (!task) return;

        const isConfirmed = confirm(`Deseja realmente excluir a obrigação "${task.title}"?`);
        if (!isConfirmed) return;

        tasks = tasks.filter(t => String(t.id) !== String(id));
        saveTasksToLocalStorage();
        renderTasks();
        renderCalendar();

        if (supabaseClient) {
          try {
            const { error: err1 } = await supabaseClient.from('obrigacoes').delete().eq('id', task.id);
            if (err1) {
              await supabaseClient.from('obrigacoes').delete().eq('titulo', task.title);
            }
          } catch (err) {
            console.warn('Aviso: Exclusão no Supabase mantida localmente:', err.message);
          }
        }
      });
    });

    lucide.createIcons();
    renderCalendar();
  }

  const editTaskForm = document.getElementById('editTaskForm');
  const editTaskModal = document.getElementById('editTaskModal');
  const editTaskModalCloseBtn = document.getElementById('editTaskModalCloseBtn');
  const editTaskCancelBtn = document.getElementById('editTaskCancelBtn');

  function closeEditTaskModal() {
    if (editTaskModal) editTaskModal.classList.remove('visible');
  }

  if (editTaskModalCloseBtn) editTaskModalCloseBtn.addEventListener('click', closeEditTaskModal);
  if (editTaskCancelBtn) editTaskCancelBtn.addEventListener('click', closeEditTaskModal);

  if (editTaskForm) {
    editTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editTaskIdInput').value;
      const newTitle = document.getElementById('editTaskTitleInput').value.trim();
      const newDate = document.getElementById('editTaskDateInput').value;
      const newPriority = document.getElementById('editTaskPriorityInput').value;

      const task = tasks.find(t => String(t.id) === String(id));
      if (!task || !newTitle) return;

      const oldTitle = task.title;
      task.title = newTitle;
      task.date = newDate || task.date;
      task.priority = newPriority;

      saveTasksToLocalStorage();
      renderTasks();
      renderCalendar();
      closeEditTaskModal();

      if (supabaseClient) {
        try {
          const { error: err1 } = await supabaseClient
            .from('obrigacoes')
            .update({
              titulo: task.title,
              data_vencimento: task.date,
              prioridade: task.priority
            })
            .eq('id', task.id);

          if (err1) {
            await supabaseClient
              .from('obrigacoes')
              .update({
                titulo: task.title,
                data_vencimento: task.date,
                prioridade: task.priority
              })
              .eq('titulo', oldTitle);
          }
        } catch (err) {
          console.warn('Aviso: Edição no Supabase mantida localmente:', err.message);
        }
      }
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      addTaskForm.classList.toggle('visible');
      if (addTaskForm.classList.contains('visible')) {
        taskTitleInput.focus();
      }
    });
  }

  if (cancelTaskBtn) {
    cancelTaskBtn.addEventListener('click', () => {
      addTaskForm.classList.remove('visible');
      taskTitleInput.value = '';
    });
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener('click', async () => {
      const title = taskTitleInput.value.trim();
      if (!title) return;

      const dateVal = taskDateInput.value || new Date().toISOString().slice(0, 10);
      const priorityVal = taskPriorityInput.value;

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('obrigacoes').insert([{
            titulo: title,
            data_vencimento: dateVal,
            prioridade: priorityVal,
            concluida: false
          }]).select();

          if (error) throw error;
          await loadObrigacoesFromSupabase();
        } catch (err) {
          console.error('Erro ao salvar no Supabase:', err);
          tasks.unshift({ id: Date.now(), title, date: dateVal, priority: priorityVal, completed: false });
          renderTasks();
        }
      } else {
        tasks.unshift({ id: Date.now(), title, date: dateVal, priority: priorityVal, completed: false });
        renderTasks();
      }

      addTaskForm.classList.remove('visible');
      taskTitleInput.value = '';
      taskDateInput.value = '';
      taskPriorityInput.value = 'media';
    });
  }

  renderTasks();

  // ========== 5. PASTAS & FILE MANAGER (SUPABASE INTEGRATION) ==========
  const pastasGrid = document.getElementById('pastasGrid');
  const filesSection = document.getElementById('filesSection');
  const filesList = document.getElementById('filesList');
  const filesSectionTitle = document.getElementById('filesSectionTitle');
  const pastasBreadcrumb = document.getElementById('pastasBreadcrumb');

  let folders = [];

  function loadCustomFolders() {
    try {
      const saved = localStorage.getItem('agroclaw_custom_folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(f => {
            if (!folders.some(existing => existing.id === f.id)) {
              folders.push(f);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao carregar pastas locais:', e);
    }
  }

  function saveCustomFolder(newFolder) {
    if (!folders.some(f => f.id === newFolder.id)) {
      folders.push(newFolder);
    }
    try {
      localStorage.setItem('agroclaw_custom_folders', JSON.stringify(folders));
    } catch (e) {
      console.warn('Aviso ao salvar pasta localmente:', e);
    }
  }

  loadCustomFolders();

  let folderFiles = {};

  function saveFolderFilesToLocalStorage() {
    try {
      localStorage.setItem('agroclaw_folder_files', JSON.stringify(folderFiles));
    } catch (e) {
      console.warn('Aviso ao salvar arquivos no localStorage:', e);
    }
  }

  function loadFolderFilesFromLocalStorage() {
    try {
      const saved = localStorage.getItem('agroclaw_folder_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(cat => {
          if (!folderFiles[cat]) folderFiles[cat] = {};
          Object.keys(parsed[cat]).forEach(farm => {
            if (!folderFiles[cat][farm]) folderFiles[cat][farm] = [];
            parsed[cat][farm].forEach(f => {
              if (!folderFiles[cat][farm].some(existing => existing.name === f.name)) {
                folderFiles[cat][farm].push(f);
              }
            });
          });
        });
      }
    } catch (e) {
      console.warn('Aviso ao carregar arquivos do localStorage:', e);
    }
  }

  async function loadDocumentosFromSupabase() {
    loadFolderFilesFromLocalStorage();
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('documentos').select('*, fazendas(slug, nome)');
      if (error) throw error;
      if (data && data.length > 0) {
        data.forEach(doc => {
          const cat = doc.categoria_id;
          const farmSlug = doc.fazendas ? doc.fazendas.slug : 'geral';
          if (!folderFiles[cat]) folderFiles[cat] = {};
          if (!folderFiles[cat][farmSlug]) folderFiles[cat][farmSlug] = [];
          
          const fileObj = {
            name: doc.nome_arquivo,
            type: doc.tipo_arquivo,
            size: doc.tamanho_arquivo,
            date: doc.data_upload || new Date(doc.created_at).toLocaleDateString('pt-BR'),
            url: doc.url_arquivo
          };

          if (!folderFiles[cat][farmSlug].some(existing => existing.name === fileObj.name)) {
            folderFiles[cat][farmSlug].push(fileObj);
          }
        });
        saveFolderFilesToLocalStorage();
      }
    } catch (e) {
      console.warn('Usando documentos locais fallback:', e.message);
    }
  }

  let currentCategory = null;
  let currentFarm = null;

  const folderBackBtn = document.getElementById('folderBackBtn');

  if (folderBackBtn) {
    folderBackBtn.addEventListener('click', () => {
      let activeCat = folders.find(f => f.id === currentCategory);

      // 1. Se estiver dentro de uma Subpasta (ex: Fazenda -> Subpasta)
      if (currentCategory !== null && activeCat) {
        currentCategory = activeCat.parentCategoryId || null;
      }
      // 2. Se estiver dentro de uma Fazenda na raiz
      else if (currentFarm !== null) {
        currentFarm = null;
        currentCategory = null;
      }

      renderPastasSection();
    });
  }

  function updateBackButton() {
    if (!folderBackBtn) return;

    if (currentCategory === null && currentFarm === null) {
      folderBackBtn.style.display = 'none';
      return;
    }

    folderBackBtn.style.display = 'inline-flex';

    let activeCat = folders.find(f => f.id === currentCategory);
    let activeFarm = farms.find(f => f.id === currentFarm);

    if (currentCategory !== null && activeCat) {
      if (activeCat.parentCategoryId) {
        const parentCat = folders.find(f => f.id === activeCat.parentCategoryId);
        folderBackBtn.innerHTML = `
          <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          Voltar para ${parentCat ? parentCat.name : (activeFarm ? activeFarm.name : 'Pasta Anterior')}
        `;
      } else if (activeFarm) {
        folderBackBtn.innerHTML = `
          <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          Voltar para ${activeFarm.name}
        `;
      } else {
        folderBackBtn.innerHTML = `
          <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          Voltar para Todos os Arquivos
        `;
      }
    } else if (currentFarm !== null) {
      folderBackBtn.innerHTML = `
        <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i>
        Voltar para Todos os Arquivos
      `;
    }
  }

  function updateBreadcrumb() {
    updateBackButton();
    if (!pastasBreadcrumb) return;
    let html = `
      <span class="breadcrumb-item" data-path="root">
        <i data-lucide="folder" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
        Todos os Arquivos
      </span>
    `;

    if (currentFarm) {
      const farm = farms.find(f => f.id === currentFarm);
      html += `
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item ${!currentCategory ? 'active' : ''}" data-path="farm">
          <i data-lucide="${farm ? farm.icon : 'tractor'}" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
          ${farm ? farm.name : currentFarm}
        </span>
      `;
    }

    let activeCat = folders.find(f => f.id === currentCategory);

    // Se for uma subpasta com pai
    if (activeCat && activeCat.parentCategoryId) {
      const parentCat = folders.find(f => f.id === activeCat.parentCategoryId);
      if (parentCat) {
        html += `
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item" data-path="parentCategory">
            <i data-lucide="${parentCat.icon || 'folder'}" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
            ${parentCat.name}
          </span>
        `;
      }
    }

    if (activeCat) {
      html += `
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item active" data-path="category">
          <i data-lucide="${activeCat.icon || 'folder'}" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i>
          ${activeCat.name}
        </span>
      `;
    }

    pastasBreadcrumb.innerHTML = html;

    const rootItem = pastasBreadcrumb.querySelector('[data-path="root"]');
    if (rootItem) {
      rootItem.addEventListener('click', () => {
        currentCategory = null;
        currentFarm = null;
        renderPastasSection();
      });
    }

    const farmItem = pastasBreadcrumb.querySelector('[data-path="farm"]');
    if (farmItem) {
      farmItem.addEventListener('click', () => {
        currentCategory = null;
        renderPastasSection();
      });
    }

    const parentCatItem = pastasBreadcrumb.querySelector('[data-path="parentCategory"]');
    if (parentCatItem) {
      parentCatItem.addEventListener('click', () => {
        if (activeCat && activeCat.parentCategoryId) {
          currentCategory = activeCat.parentCategoryId;
          renderPastasSection();
        }
      });
    }

    lucide.createIcons();
  }

  async function deleteFolder(folderObj) {
    const isConfirmed = confirm(`Deseja realmente excluir a pasta "${folderObj.name}"?`);
    if (!isConfirmed) return;

    folders = folders.filter(f => f.id !== folderObj.id);

    try {
      localStorage.setItem('agroclaw_custom_folders', JSON.stringify(folders));
    } catch (e) {
      console.warn('Erro ao atualizar localStorage:', e);
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from('documentos').delete().eq('categoria_id', folderObj.id);
        await supabaseClient.from('categorias_pastas').delete().eq('slug', folderObj.id);
      } catch (e) {}
    }

    if (currentCategory === folderObj.id) {
      currentCategory = folderObj.parentCategoryId || null;
    }

    renderPastasSection();
  }

  // MODAL RENOMEAR PASTA
  const renameFolderModal = document.getElementById('renameFolderModal');
  const renameFolderCloseBtn = document.getElementById('renameFolderCloseBtn');
  const renameFolderCancelBtn = document.getElementById('renameFolderCancelBtn');
  const renameFolderForm = document.getElementById('renameFolderForm');

  function openRenameModal(folderObj) {
    if (!renameFolderModal) return;
    document.getElementById('renameFolderId').value = folderObj.id;
    document.getElementById('renameFolderNameInput').value = folderObj.name;
    renameFolderModal.classList.add('visible');
  }

  function closeRenameModal() {
    if (renameFolderModal) renameFolderModal.classList.remove('visible');
  }

  if (renameFolderCloseBtn) renameFolderCloseBtn.addEventListener('click', closeRenameModal);
  if (renameFolderCancelBtn) renameFolderCancelBtn.addEventListener('click', closeRenameModal);
  if (renameFolderForm) {
    renameFolderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const folderId = document.getElementById('renameFolderId').value;
      const newName = document.getElementById('renameFolderNameInput').value.trim();
      if (!newName) return;

      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        folder.name = newName;
        saveCustomFolder(folder);
        renderPastasSection();
      }
      closeRenameModal();
    });
  }

  // MODAL MOVER ITEM (ARQUIVO OU PASTA)
  const moveItemModal = document.getElementById('moveItemModal');
  const moveItemCloseBtn = document.getElementById('moveItemCloseBtn');
  const moveItemCancelBtn = document.getElementById('moveItemCancelBtn');
  const moveItemForm = document.getElementById('moveItemForm');
  const moveTargetFarmSelect = document.getElementById('moveTargetFarmSelect');
  const moveTargetFolderSelect = document.getElementById('moveTargetFolderSelect');

  let currentMoveTarget = null;

  function populateMoveFolders(farmId, currentFolderId) {
    if (!moveTargetFolderSelect) return;
    moveTargetFolderSelect.innerHTML = '<option value="root">📁 Raiz da Fazenda (Sem subpasta)</option>';
    
    const farmFolders = folders.filter(f => (f.parentFarmId === farmId || (!f.parentFarmId && !f.parentCategoryId)) && f.id !== currentFolderId);
    farmFolders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `📁 ${f.name}`;
      moveTargetFolderSelect.appendChild(opt);
    });
  }

  function openMoveModal(type, obj, catKey, farmKey) {
    if (!moveItemModal) return;
    currentMoveTarget = { type, obj, catKey, farmKey };
    document.getElementById('moveItemType').value = type;
    document.getElementById('moveItemId').value = obj.id || obj.name;
    document.getElementById('moveItemNameText').textContent = `Mover ${type === 'folder' ? 'Pasta' : 'Arquivo'}: "${obj.name}"`;

    if (moveTargetFarmSelect) {
      moveTargetFarmSelect.innerHTML = '';
      farms.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        moveTargetFarmSelect.appendChild(opt);
      });

      const initialFarmId = farmKey || currentFarm || farms[0].id;
      moveTargetFarmSelect.value = initialFarmId;
      populateMoveFolders(initialFarmId, obj.id);

      moveTargetFarmSelect.onchange = () => {
        populateMoveFolders(moveTargetFarmSelect.value, obj.id);
      };
    }

    moveItemModal.classList.add('visible');
  }

  function closeMoveModal() {
    if (moveItemModal) moveItemModal.classList.remove('visible');
    currentMoveTarget = null;
  }

  if (moveItemCloseBtn) moveItemCloseBtn.addEventListener('click', closeMoveModal);
  if (moveItemCancelBtn) moveItemCancelBtn.addEventListener('click', closeMoveModal);
  if (moveItemForm) {
    moveItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentMoveTarget) return;

      const targetFarmId = moveTargetFarmSelect.value;
      const targetFolderVal = moveTargetFolderSelect.value;
      const targetFolderId = targetFolderVal === 'root' ? null : targetFolderVal;

      if (currentMoveTarget.type === 'folder') {
        const folder = currentMoveTarget.obj;
        folder.parentFarmId = targetFarmId;
        folder.parentCategoryId = targetFolderId;
        saveCustomFolder(folder);
      } else if (currentMoveTarget.type === 'file') {
        const file = currentMoveTarget.obj;
        const oldCat = currentMoveTarget.catKey || 'geral';
        const oldFarm = currentMoveTarget.farmKey || 'geral';

        const newCat = targetFolderId || 'geral';
        const newFarm = targetFarmId || 'geral';

        if (folderFiles[oldCat] && folderFiles[oldCat][oldFarm]) {
          folderFiles[oldCat][oldFarm] = folderFiles[oldCat][oldFarm].filter(f => f.name !== file.name);
        }

        if (!folderFiles[newCat]) folderFiles[newCat] = {};
        if (!folderFiles[newCat][newFarm]) folderFiles[newCat][newFarm] = [];

        if (!folderFiles[newCat][newFarm].some(f => f.name === file.name)) {
          folderFiles[newCat][newFarm].push(file);
        }

        saveFolderFilesToLocalStorage();
      }

      renderPastasSection();
      closeMoveModal();
    });
  }

  // BUSCA COM NESTED NAVIGATION PATH
  const pastasSearchInput = document.getElementById('pastasSearchInput');
  const pastasSearchClearBtn = document.getElementById('pastasSearchClearBtn');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchResultsTitle = document.getElementById('searchResultsTitle');
  const searchResultsCount = document.getElementById('searchResultsCount');

  function getFolderAncestors(folderId) {
    const ancestors = [];
    let curr = folders.find(f => f.id === folderId);
    while (curr) {
      ancestors.unshift(curr);
      if (curr.parentCategoryId) {
        curr = folders.find(f => f.id === curr.parentCategoryId);
      } else {
        break;
      }
    }
    return ancestors;
  }

  function performPastasSearch(query) {
    if (!searchResultsSection || !searchResultsList) return;
    const lowerQuery = query.toLowerCase().trim();

    searchResultsList.innerHTML = '';
    let matchCount = 0;

    // 1. Busca por Arquivos em folderFiles
    Object.keys(folderFiles).forEach(catKey => {
      Object.keys(folderFiles[catKey]).forEach(farmKey => {
        const fileList = folderFiles[catKey][farmKey];
        fileList.forEach(file => {
          if (file.name.toLowerCase().includes(lowerQuery) || (file.type && file.type.toLowerCase().includes(lowerQuery))) {
            matchCount++;
            const farmObj = farms.find(f => f.id === farmKey);
            const farmName = farmObj ? farmObj.name : farmKey;

            let pathSegments = [];
            pathSegments.push({ type: 'farm', id: farmKey, name: farmName });

            if (catKey && catKey !== 'geral') {
              const ancestors = getFolderAncestors(catKey);
              ancestors.forEach(anc => {
                pathSegments.push({ type: 'folder', id: anc.id, name: anc.name });
              });
            }

            pathSegments.push({ type: 'file', name: file.name });

            const item = document.createElement('div');
            item.className = 'search-result-card';
            
            let pathHtml = `<div class="search-nested-path"><span style="font-weight: 600; color: var(--text-secondary); margin-right: 4px;">📍 Localização:</span>`;
            pathSegments.forEach((seg, idx) => {
              if (idx > 0) pathHtml += `<span class="path-sep">›</span>`;
              if (seg.type === 'farm') {
                pathHtml += `<span class="path-chip" data-type="farm" data-farm-id="${seg.id}"><i data-lucide="tractor" style="width: 12px; height: 12px;"></i> ${seg.name}</span>`;
              } else if (seg.type === 'folder') {
                pathHtml += `<span class="path-chip" data-type="folder" data-farm-id="${farmKey}" data-folder-id="${seg.id}"><i data-lucide="folder" style="width: 12px; height: 12px;"></i> ${seg.name}</span>`;
              } else {
                pathHtml += `<span class="path-chip active-target"><i data-lucide="file-text" style="width: 12px; height: 12px;"></i> ${seg.name}</span>`;
              }
            });
            pathHtml += `</div>`;

            item.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-sm);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="file-icon ${file.type}">${file.type.toUpperCase()}</div>
                  <div>
                    <div style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm);">${file.name}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${file.size} · ${file.date}</div>
                  </div>
                </div>
                <a href="${file.url || '#'}" download="${file.name}" class="btn btn-outline" style="padding: 4px 10px; font-size: 12px;">
                  <i data-lucide="download" style="width: 14px; height: 14px; margin-right: 4px;"></i> Baixar
                </a>
              </div>
              ${pathHtml}
            `;

            // Event Listener no Nested Navigation Path
            item.querySelectorAll('.path-chip').forEach(chip => {
              chip.addEventListener('click', () => {
                const targetType = chip.dataset.type;
                if (!targetType) return;
                const targetFarm = chip.dataset.farmId;
                const targetFolder = chip.dataset.folderId || null;

                if (targetFarm) {
                  currentFarm = targetFarm;
                  currentCategory = targetFolder;
                  if (pastasSearchInput) pastasSearchInput.value = '';
                  if (searchResultsSection) searchResultsSection.style.display = 'none';
                  if (pastasSearchClearBtn) pastasSearchClearBtn.style.display = 'none';
                  renderPastasSection();
                }
              });
            });

            searchResultsList.appendChild(item);
          }
        });
      });
    });

    // 2. Busca por Pastas em folders
    folders.forEach(folder => {
      if (folder.name.toLowerCase().includes(lowerQuery)) {
        matchCount++;
        const farmObj = farms.find(f => f.id === folder.parentFarmId);
        const farmName = farmObj ? farmObj.name : (folder.parentFarmId || 'Raiz Geral');

        const ancestors = getFolderAncestors(folder.id);
        let pathSegments = [];
        if (folder.parentFarmId) {
          pathSegments.push({ type: 'farm', id: folder.parentFarmId, name: farmName });
        }
        ancestors.forEach(anc => {
          pathSegments.push({ type: 'folder', id: anc.id, name: anc.name });
        });

        const item = document.createElement('div');
        item.className = 'search-result-card';

        let pathHtml = `<div class="search-nested-path"><span style="font-weight: 600; color: var(--text-secondary); margin-right: 4px;">📍 Localização:</span>`;
        pathSegments.forEach((seg, idx) => {
          if (idx > 0) pathHtml += `<span class="path-sep">›</span>`;
          if (seg.type === 'farm') {
            pathHtml += `<span class="path-chip" data-type="farm" data-farm-id="${seg.id}"><i data-lucide="tractor" style="width: 12px; height: 12px;"></i> ${seg.name}</span>`;
          } else {
            const isLast = (idx === pathSegments.length - 1);
            pathHtml += `<span class="path-chip ${isLast ? 'active-target' : ''}" data-type="folder" data-farm-id="${folder.parentFarmId}" data-folder-id="${seg.id}"><i data-lucide="folder" style="width: 12px; height: 12px;"></i> ${seg.name}</span>`;
          }
        });
        pathHtml += `</div>`;

        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-sm);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="pasta-icon ${folder.colorClass || 'relatorios'}" style="width: 36px; height: 36px;">
                <i data-lucide="${folder.icon || 'folder'}"></i>
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-sm);">${folder.name}</div>
                <div style="font-size: var(--font-size-xs); color: var(--text-tertiary);">Pasta de Arquivos</div>
              </div>
            </div>
          </div>
          ${pathHtml}
        `;

        item.querySelectorAll('.path-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const targetFarm = chip.dataset.farmId || folder.parentFarmId;
            const targetFolder = chip.dataset.folderId || folder.id;

            currentFarm = targetFarm || null;
            currentCategory = targetFolder || null;
            if (pastasSearchInput) pastasSearchInput.value = '';
            if (searchResultsSection) searchResultsSection.style.display = 'none';
            if (pastasSearchClearBtn) pastasSearchClearBtn.style.display = 'none';
            renderPastasSection();
          });
        });

        searchResultsList.appendChild(item);
      }
    });

    if (searchResultsCount) searchResultsCount.textContent = `${matchCount} resultado(s) encontrado(s)`;
    if (searchResultsSection) searchResultsSection.style.display = matchCount > 0 ? 'block' : 'none';

    if (matchCount === 0) {
      searchResultsList.innerHTML = `
        <div class="empty-state" style="padding: 20px;">
          <h3>Nenhum resultado encontrado para "${query}"</h3>
          <p>Verifique o termo digitado ou navegue manualmente pelas pastas.</p>
        </div>
      `;
      searchResultsSection.style.display = 'block';
    }

    lucide.createIcons();
  }

  if (pastasSearchInput) {
    pastasSearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (!q.trim()) {
        if (searchResultsSection) searchResultsSection.style.display = 'none';
        if (pastasSearchClearBtn) pastasSearchClearBtn.style.display = 'none';
        return;
      }
      if (pastasSearchClearBtn) pastasSearchClearBtn.style.display = 'block';
      performPastasSearch(q);
    });
  }

  if (pastasSearchClearBtn) {
    pastasSearchClearBtn.addEventListener('click', () => {
      if (pastasSearchInput) pastasSearchInput.value = '';
      if (searchResultsSection) searchResultsSection.style.display = 'none';
      pastasSearchClearBtn.style.display = 'none';
    });
  }

  function renderPastasSection() {
    if (!pastasGrid || !filesSection) return;
    updateBreadcrumb();

    if (currentCategory === null && currentFarm === null) {
      // 1. Nível Raiz: Mostrar todas as Fazendas como Pastas Principais!
      pastasGrid.style.display = '';
      filesSection.classList.remove('visible');
      pastasGrid.innerHTML = '';

      // A) Renderiza cada Fazenda como uma Pasta na Raiz
      farms.forEach(farm => {
        const subCount = folders.filter(f => f.parentFarmId === farm.id && !f.parentCategoryId).length;
        let fileCount = 0;
        Object.keys(folderFiles).forEach(catKey => {
          if (folderFiles[catKey] && folderFiles[catKey][farm.id]) {
            fileCount += folderFiles[catKey][farm.id].length;
          }
        });

        const el = document.createElement('div');
        el.className = 'pasta-card';
        el.innerHTML = `
          <div class="pasta-icon contratos">
            <i data-lucide="${farm.icon || 'tractor'}"></i>
          </div>
          <div class="pasta-name">${farm.name}</div>
          <div class="pasta-count">${fileCount} arquivo(s) ${subCount > 0 ? `· ${subCount} subpasta(s)` : ''}</div>
        `;
        el.addEventListener('click', () => {
          currentFarm = farm.id;
          currentCategory = null;
          renderPastasSection();
        });

        pastasGrid.appendChild(el);
      });

      // B) Renderiza Pastas Customizadas na Raiz (sem fazenda nem pai)
      const rootCustomFolders = folders.filter(f => !f.parentFarmId && !f.parentCategoryId);
      rootCustomFolders.forEach(folder => {
        const el = document.createElement('div');
        el.className = 'pasta-card';
        el.innerHTML = `
          <div class="pasta-action-bar">
            <button class="pasta-action-btn rename-btn" title="Renomear Pasta"><i data-lucide="edit-2"></i></button>
            <button class="pasta-action-btn move-btn" title="Mover Pasta"><i data-lucide="folder-input"></i></button>
            <button class="pasta-action-btn danger delete-btn" title="Excluir Pasta"><i data-lucide="trash-2"></i></button>
          </div>
          <div class="pasta-icon ${folder.colorClass || 'relatorios'}">
            <i data-lucide="${folder.icon || 'folder'}"></i>
          </div>
          <div class="pasta-name">${folder.name}</div>
          <div class="pasta-count">Pasta Raiz</div>
        `;
        el.addEventListener('click', () => {
          currentCategory = folder.id;
          currentFarm = null;
          renderPastasSection();
        });

        const renameBtn = el.querySelector('.rename-btn');
        if (renameBtn) {
          renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openRenameModal(folder);
          });
        }

        const moveBtn = el.querySelector('.move-btn');
        if (moveBtn) {
          moveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openMoveModal('folder', folder, null, null);
          });
        }

        const delBtn = el.querySelector('.delete-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFolder(folder);
          });
        }

        pastasGrid.appendChild(el);
      });

      lucide.createIcons();
    } else {
      // 2. Nível Dentro de uma Fazenda ou Subpasta
      const activeCat = folders.find(f => f.id === currentCategory);
      const activeFarm = farms.find(f => f.id === currentFarm);

      // Subpastas pertencentes a este contexto
      const subFolders = folders.filter(f => {
        if (currentCategory) {
          return f.parentCategoryId === currentCategory;
        } else if (currentFarm) {
          return f.parentFarmId === currentFarm && !f.parentCategoryId;
        }
        return false;
      });

      pastasGrid.innerHTML = '';

      if (subFolders.length > 0) {
        pastasGrid.style.display = '';

        subFolders.forEach(sub => {
          const el = document.createElement('div');
          el.className = 'pasta-card';
          el.innerHTML = `
            <div class="pasta-action-bar">
              <button class="pasta-action-btn rename-btn" title="Renomear Pasta"><i data-lucide="edit-2"></i></button>
              <button class="pasta-action-btn move-btn" title="Mover Pasta"><i data-lucide="folder-input"></i></button>
              <button class="pasta-action-btn danger delete-btn" title="Excluir Pasta"><i data-lucide="trash-2"></i></button>
            </div>
            <div class="pasta-icon ${sub.colorClass || 'relatorios'}">
              <i data-lucide="${sub.icon || 'folder'}"></i>
            </div>
            <div class="pasta-name">${sub.name}</div>
            <div class="pasta-count">Subpasta</div>
          `;
          el.addEventListener('click', () => {
            currentCategory = sub.id;
            renderPastasSection();
          });

          const renameBtn = el.querySelector('.rename-btn');
          if (renameBtn) {
            renameBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              openRenameModal(sub);
            });
          }

          const moveBtn = el.querySelector('.move-btn');
          if (moveBtn) {
            moveBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              openMoveModal('folder', sub, sub.parentCategoryId, sub.parentFarmId);
            });
          }

          const delBtn = el.querySelector('.delete-btn');
          if (delBtn) {
            delBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteFolder(sub);
            });
          }

          pastasGrid.appendChild(el);
        });
      } else {
        pastasGrid.style.display = 'none';
      }

      // Seção de Arquivos
      filesSection.classList.add('visible');

      const catName = activeCat ? activeCat.name : null;
      const farmName = activeFarm ? activeFarm.name : null;

      if (catName && farmName) {
        filesSectionTitle.textContent = `${farmName} ➔ ${catName}`;
      } else if (farmName) {
        filesSectionTitle.textContent = `Arquivos de ${farmName}`;
      } else if (catName) {
        filesSectionTitle.textContent = `Arquivos em ${catName}`;
      } else {
        filesSectionTitle.textContent = `Arquivos`;
      }

      const targetCatKey = currentCategory || 'geral';
      const targetFarmKey = currentFarm || 'geral';

      const files = (folderFiles[targetCatKey] && folderFiles[targetCatKey][targetFarmKey])
        ? folderFiles[targetCatKey][targetFarmKey]
        : [];

      filesList.innerHTML = '';

      if (files.length === 0 && subFolders.length === 0) {
        filesList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">
              <i data-lucide="folder-open" style="width: 42px; height: 42px; color: var(--text-tertiary);"></i>
            </div>
            <h3>Nenhum arquivo encontrado</h3>
            <p>Não há documentos salvos nesta pasta.</p>
          </div>
        `;
      } else {
        files.forEach(file => {
          const el = document.createElement('div');
          el.className = 'file-item';
          el.innerHTML = `
            <div class="file-icon ${file.type}">${file.type.toUpperCase()}</div>
            <div class="file-info">
              <div class="file-name">${file.name}</div>
              <div class="file-meta">${file.size} · ${file.date}</div>
            </div>
            <div class="file-actions">
              <a href="${file.url || '#'}" download="${file.name}" class="file-action-btn download-btn" title="Baixar Arquivo" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border-primary); color: var(--text-secondary); text-decoration: none;">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i>
              </a>
              <button class="file-action-btn move-file-btn" title="Mover Arquivo" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border-primary); background: transparent; color: var(--text-secondary); cursor: pointer;">
                <i data-lucide="folder-input" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="file-action-btn delete-btn" title="Excluir Arquivo" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--border-primary); background: transparent; color: var(--accent-danger); cursor: pointer;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          `;

          const downloadLink = el.querySelector('.download-btn');
          if (downloadLink) {
            downloadLink.addEventListener('click', (e) => {
              if (file.url && file.url.startsWith('data:')) {
                e.preventDefault();
                const a = document.createElement('a');
                a.href = file.url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            });
          }

          const moveFileBtn = el.querySelector('.move-file-btn');
          if (moveFileBtn) {
            moveFileBtn.addEventListener('click', () => {
              openMoveModal('file', file, targetCatKey, targetFarmKey);
            });
          }

          const deleteBtn = el.querySelector('.delete-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              if (confirm(`Deseja excluir o arquivo "${file.name}"?`)) {
                folderFiles[targetCatKey][targetFarmKey] = folderFiles[targetCatKey][targetFarmKey].filter(f => f.name !== file.name);
                saveFolderFilesToLocalStorage();
                renderPastasSection();
              }
            });
          }

          filesList.appendChild(el);
        });
      }

      lucide.createIcons();
    }
  }


  // ========== 6. MODAL DETALHES DA FAZENDA & AUDITORIA COMPLETA ==========
  const farmDetailsModal = document.getElementById('farmDetailsModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  let currentActiveAuditCategory = 'propriedade';
  let currentAuditedFarmId = null;

  function renderFarmAuditCategory(farmId, categoryKey) {
    const data = farmData[farmId];
    const checklistContainer = document.getElementById('modalDocsChecklist');
    if (!data || !checklistContainer) return;

    currentActiveAuditCategory = categoryKey;
    checklistContainer.innerHTML = '';

    const farmChecklists = data.checklists || { propriedade: [], ambientais: [], pecuarios: [] };
    const checkedList = farmChecklists[categoryKey] || [];
    const items = CHECKLIST_DEFINITIONS[categoryKey] || [];

    // Atualiza classes ativas das abas
    const auditTabBtns = document.querySelectorAll('.audit-tab-btn');
    auditTabBtns.forEach(btn => {
      if (btn.dataset.auditCat === categoryKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    items.forEach(doc => {
      // Verifica se está marcado no checklist OU se existe arquivo físico na pasta
      const isMarkedInChecklist = checkedList.includes(doc.id);
      const files = folderFiles[doc.id] && folderFiles[doc.id][farmId];
      const hasPhysicalFiles = files && files.length > 0;
      const isPresent = isMarkedInChecklist || hasPhysicalFiles;

      const item = document.createElement('div');
      item.className = `doc-status-item ${doc.isSub ? 'sub-item' : ''}`;
      if (doc.isSub) {
        item.style.paddingLeft = '36px';
        item.style.borderLeft = '3px solid var(--accent-primary)';
        item.style.background = 'rgba(243, 244, 246, 0.4)';
      }

      if (isPresent) {
        const fileNameNote = hasPhysicalFiles ? files[0].name : 'Documento registrado no checklist';
        item.innerHTML = `
          <div class="doc-info-block" style="flex: 1; min-width: 0;">
            <div class="doc-icon-box" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-primary);">
              <i data-lucide="${doc.icon || 'file-check'}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="doc-num-badge" style="font-size: 9px; height: 18px; min-width: 22px;">${doc.num}</span>
                <span class="doc-abbrev-tag" style="font-size: 10px; padding: 1px 6px;">${doc.abbrev}</span>
                <span class="doc-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${doc.name}">${doc.name}</span>
              </div>
              <span class="doc-file-name" style="color: #047857;" title="${fileNameNote}">✓ ${fileNameNote}</span>
            </div>
          </div>
          <span class="doc-status-badge presente">
            <i data-lucide="check" style="stroke: #047857;"></i> Presente
          </span>
        `;
      } else {
        item.innerHTML = `
          <div class="doc-info-block" style="flex: 1; min-width: 0;">
            <div class="doc-icon-box" style="background: rgba(239, 68, 68, 0.1); color: var(--accent-danger);">
              <i data-lucide="${doc.icon || 'alert-triangle'}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                <span class="doc-num-badge" style="font-size: 9px; height: 18px; min-width: 22px;">${doc.num}</span>
                <span class="doc-abbrev-tag" style="font-size: 10px; padding: 1px 6px; background: rgba(239, 68, 68, 0.08); color: var(--accent-danger); border-color: rgba(239, 68, 68, 0.2);">${doc.abbrev}</span>
                <span class="doc-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${doc.name}">${doc.name}</span>
              </div>
              <span class="doc-file-name" style="color: var(--accent-danger); font-weight: 600;">Ausente / Pendente</span>
            </div>
          </div>
          <span class="doc-status-badge ausente">
            <i data-lucide="alert-triangle"></i> Ausente
          </span>
        `;
      }

      checklistContainer.appendChild(item);
    });

    lucide.createIcons();
  }

  function openFarmDetails(farmId) {
    const data = farmData[farmId];
    if (!data) return;
    currentAuditedFarmId = farmId;

    document.getElementById('modalFarmName').textContent = data.name;
    document.getElementById('modalFarmLocation').textContent = data.location;
    document.getElementById('modalFarmArea').textContent = data.area;
    document.getElementById('modalFarmCulture').textContent = data.culture;
    document.getElementById('modalFarmStatus').textContent = data.status;
    document.getElementById('modalFarmCover').innerHTML = `<img src="${data.cover || 'fazenda_sol_nascente.png'}" alt="${data.name}">`;

    const farmChecklists = data.checklists || { propriedade: [], ambientais: [], pecuarios: [] };

    // Calcula contagens de cada categoria
    const propCount = (farmChecklists.propriedade || []).length;
    const propTotal = (CHECKLIST_DEFINITIONS.propriedade || []).length;

    const ambCount = (farmChecklists.ambientais || []).length;
    const ambTotal = (CHECKLIST_DEFINITIONS.ambientais || []).length;

    const pecCount = (farmChecklists.pecuarios || []).length;
    const pecTotal = (CHECKLIST_DEFINITIONS.pecuarios || []).length;

    const totalPresent = propCount + ambCount + pecCount;
    const totalPossible = propTotal + ambTotal + pecTotal;

    const auditOverallBadge = document.getElementById('auditOverallBadge');
    if (auditOverallBadge) {
      auditOverallBadge.textContent = `${totalPresent}/${totalPossible} Conformes (${Math.round((totalPresent / totalPossible) * 100)}%)`;
      if (totalPresent / totalPossible >= 0.7) {
        auditOverallBadge.className = 'doc-status-badge presente';
      } else {
        auditOverallBadge.className = 'doc-status-badge ausente';
      }
    }

    const auditPropCount = document.getElementById('auditPropCount');
    if (auditPropCount) auditPropCount.textContent = `${propCount}/${propTotal}`;

    const auditAmbCount = document.getElementById('auditAmbCount');
    if (auditAmbCount) auditAmbCount.textContent = `${ambCount}/${ambTotal}`;

    const auditPecCount = document.getElementById('auditPecCount');
    if (auditPecCount) auditPecCount.textContent = `${pecCount}/${pecTotal}`;

    // Renderiza a categoria ativa (inicia por 'propriedade')
    renderFarmAuditCategory(farmId, 'propriedade');

    if (farmDetailsModal) farmDetailsModal.classList.add('visible');
    lucide.createIcons();
  }

  // Event listeners para as abas de categoria da auditoria
  const auditCategoryTabBtns = document.querySelectorAll('.audit-tab-btn');
  auditCategoryTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.auditCat;
      if (currentAuditedFarmId && category) {
        renderFarmAuditCategory(currentAuditedFarmId, category);
      }
    });
  });

  const detailButtons = document.querySelectorAll('.fazenda-card .btn-primary');
  detailButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.fazenda-card');
      const farmId = card.dataset.farmId;
      openFarmDetails(farmId);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (farmDetailsModal) farmDetailsModal.classList.remove('visible');
    });
  }

  if (farmDetailsModal) {
    farmDetailsModal.addEventListener('click', (e) => {
      if (e.target === farmDetailsModal) {
        farmDetailsModal.classList.remove('visible');
      }
    });
  }

  // ========== 7. GERENCIAMENTO DE PASTAS PERSISTENTES & UPLOAD CONTEXTUAL ==========

  // ========== MODAL DE UPLOAD DE ARQUIVOS (DETECÇÃO DE PASTA) ==========
  const BUCKET_NAME = 'projeto-bruno';
  const uploadDocumentModal = document.getElementById('uploadDocumentModal');
  const uploadFileBtn = document.getElementById('uploadFileBtn');
  const uploadModalCloseBtn = document.getElementById('uploadModalCloseBtn');
  const uploadCancelBtn = document.getElementById('uploadCancelBtn');
  const uploadDocForm = document.getElementById('uploadDocForm');
  const uploadFarmSelect = document.getElementById('uploadFarmSelect');
  const uploadCategorySelect = document.getElementById('uploadCategorySelect');
  const uploadStatusMessage = document.getElementById('uploadStatusMessage');

  const uploadFileInput = document.getElementById('uploadFileInput');
  const dropzoneTitle = document.getElementById('dropzoneTitle');
  const selectedFileName = document.getElementById('selectedFileName');

  function openUploadModal() {
    if (!uploadDocumentModal) return;

    // 1. Preenche a seleção de fazendas
    if (uploadFarmSelect) {
      uploadFarmSelect.innerHTML = '';
      farms.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        uploadFarmSelect.appendChild(option);
      });
      // Auto-seleciona a fazenda em que o usuário está navegando
      if (currentFarm) {
        uploadFarmSelect.value = currentFarm;
      }
    }

    // 2. Preenche a seleção de categorias/pastas (Padrão + Personalizadas)
    if (uploadCategorySelect) {
      uploadCategorySelect.innerHTML = '';
      folders.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        uploadCategorySelect.appendChild(option);
      });
      // Auto-seleciona a pasta em que o usuário está navegando
      if (currentCategory) {
        uploadCategorySelect.value = currentCategory;
      }
    }

    // 3. Atualiza o badge informando a pasta e fazenda detectadas
    const detectedLocationText = document.getElementById('detectedLocationText');
    if (detectedLocationText) {
      const activeCat = folders.find(f => f.id === (currentCategory || uploadCategorySelect.value));
      const activeFarm = farms.find(f => f.id === (currentFarm || uploadFarmSelect.value));

      if (currentCategory && currentFarm) {
        detectedLocationText.textContent = `📍 Local detectado: ${activeCat ? activeCat.name : currentCategory} ➔ ${activeFarm ? activeFarm.name : currentFarm}`;
      } else if (currentCategory) {
        detectedLocationText.textContent = `📍 Local detectado: Pasta ${activeCat ? activeCat.name : currentCategory}`;
      } else {
        detectedLocationText.textContent = `📍 Local detectado: Todos os Arquivos (Selecione a pasta e fazenda abaixo)`;
      }
    }

    resetDropzoneUI();
    if (uploadStatusMessage) uploadStatusMessage.textContent = '';
    uploadDocumentModal.classList.add('visible');
    lucide.createIcons();
  }

  function resetDropzoneUI() {
    if (dropzoneTitle) dropzoneTitle.textContent = 'Clique ou arraste o arquivo aqui';
    if (selectedFileName) {
      selectedFileName.style.color = 'var(--text-tertiary)';
      selectedFileName.style.fontWeight = '400';
      selectedFileName.textContent = 'Suporta PDF, JPG, PNG, XLSX e DOC';
    }
  }

  function closeUploadModal() {
    if (uploadDocumentModal) uploadDocumentModal.classList.remove('visible');
    const form = document.getElementById('uploadDocForm');
    if (form) form.reset();
    resetDropzoneUI();
    if (uploadStatusMessage) uploadStatusMessage.textContent = '';
  }

  if (uploadFileInput) {
    uploadFileInput.addEventListener('change', () => {
      if (uploadFileInput.files && uploadFileInput.files.length > 0) {
        const file = uploadFileInput.files[0];
        if (dropzoneTitle) dropzoneTitle.textContent = file.name;
        if (selectedFileName) {
          selectedFileName.style.color = 'var(--accent-primary)';
          selectedFileName.style.fontWeight = '600';
          const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
          selectedFileName.textContent = `✓ Arquivo selecionado (${sizeMb} MB)`;
        }
      } else {
        resetDropzoneUI();
      }
    });
  }

  if (uploadFileBtn) uploadFileBtn.addEventListener('click', openUploadModal);
  if (uploadModalCloseBtn) uploadModalCloseBtn.addEventListener('click', closeUploadModal);
  if (uploadCancelBtn) uploadCancelBtn.addEventListener('click', closeUploadModal);

  if (uploadDocumentModal) {
    uploadDocumentModal.addEventListener('click', (e) => {
      if (e.target === uploadDocumentModal) closeUploadModal();
    });
  }

  if (uploadDocForm) {
    uploadDocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const farmSlug = uploadFarmSelect.value;
      const categoryId = uploadCategorySelect.value;
      const fileInput = document.getElementById('uploadFileInput');
      const submitBtn = document.getElementById('uploadSubmitBtn');

      if (!fileInput.files || fileInput.files.length === 0) {
        uploadStatusMessage.style.color = 'var(--accent-danger)';
        uploadStatusMessage.textContent = 'Por favor, selecione um arquivo.';
        return;
      }

      const file = fileInput.files[0];
      const rawExt = file.name.split('.').pop().toLowerCase();
      const validExts = ['pdf', 'xlsx', 'jpg', 'doc', 'png'];
      const fileExt = validExts.includes(rawExt) ? rawExt : 'pdf';

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `${categoryId}/${farmSlug}/${Date.now()}_${cleanFileName}`;

      uploadStatusMessage.style.color = 'var(--text-secondary)';
      uploadStatusMessage.textContent = '⏳ Enviando arquivo para o Supabase Storage...';
      submitBtn.disabled = true;

      try {
        let publicUrl = '';

        function formatBytes(bytes) {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        if (supabaseClient) {
          try {
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from(BUCKET_NAME)
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: true
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabaseClient.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);
              publicUrl = publicUrlData ? publicUrlData.publicUrl : '';
            } else {
              console.warn('Aviso no Supabase Storage (RLS):', uploadError.message);
            }

            let farmUuid = farmData[farmSlug] ? farmData[farmSlug].id : null;
            if (!farmUuid) {
              const { data: farmDb } = await supabaseClient.from('fazendas').select('id').eq('slug', farmSlug).maybeSingle();
              if (farmDb) farmUuid = farmDb.id;
            }

            if (farmUuid) {
              const { error: dbError } = await supabaseClient.from('documentos').insert([{
                fazenda_id: farmUuid,
                categoria_id: categoryId,
                nome_arquivo: file.name,
                tipo_arquivo: fileExt,
                tamanho_arquivo: formatBytes(file.size),
                url_arquivo: publicUrl
              }]);

              if (dbError) {
                console.warn('Aviso ao registrar documento no banco Supabase (RLS):', dbError.message);
              }
            }
          } catch (supaErr) {
            console.warn('Aviso na integracao com Supabase:', supaErr.message);
          }
        }

        function readFileAsDataURL(fileToRead) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(fileToRead);
          });
        }

        const base64DataUrl = await readFileAsDataURL(file);
        const now = getSaoPauloDate();
        const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        const newFileObj = {
          name: file.name,
          size: formatBytes(file.size),
          date: dateFormatted,
          type: fileExt,
          url: publicUrl || base64DataUrl || ''
        };

        if (!folderFiles[categoryId]) folderFiles[categoryId] = {};
        const farmKey = farmSlug || 'geral';
        if (!folderFiles[categoryId][farmKey]) folderFiles[categoryId][farmKey] = [];

        if (!folderFiles[categoryId][farmKey].some(f => f.name === newFileObj.name)) {
          folderFiles[categoryId][farmKey].push(newFileObj);
        }

        saveFolderFilesToLocalStorage();

        uploadStatusMessage.style.color = '#047857';
        uploadStatusMessage.textContent = '✅ Arquivo enviado e adicionado à pasta com sucesso!';

        renderPastasSection();

        setTimeout(() => {
          closeUploadModal();
          submitBtn.disabled = false;
        }, 1000);

      } catch (err) {
        console.error('Erro no upload de arquivo:', err);
        uploadStatusMessage.style.color = 'var(--accent-danger)';
        uploadStatusMessage.textContent = '❌ Erro: ' + err.message;
        submitBtn.disabled = false;
      }
    });
  }

  // ========== MODAL: CRIAR NOVA PASTA PERSISTENTE ==========
  const newFolderModal = document.getElementById('newFolderModal');
  const newFolderBtn = document.getElementById('newFolderBtn');
  const newFolderModalCloseBtn = document.getElementById('newFolderModalCloseBtn');
  const newFolderCancelBtn = document.getElementById('newFolderCancelBtn');
  const newFolderForm = document.getElementById('newFolderForm');
  const newFolderStatusMessage = document.getElementById('newFolderStatusMessage');
  const newFolderIconInput = document.getElementById('newFolderIconInput');
  const iconPickerTiles = document.querySelectorAll('.icon-picker-tile');

  // Configura a seleção visual dos ícones na grade
  iconPickerTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      iconPickerTiles.forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      if (newFolderIconInput) {
        newFolderIconInput.value = tile.dataset.icon;
      }
    });
  });

  function openNewFolderModal() {
    if (!newFolderModal) return;

    const newFolderLocationText = document.getElementById('newFolderLocationText');
    if (newFolderLocationText) {
      const activeCat = folders.find(f => f.id === currentCategory);
      const activeFarm = farms.find(f => f.id === currentFarm);

      if (currentCategory && activeCat) {
        let path = [];
        if (activeFarm) path.push(activeFarm.name);
        const ancestors = getFolderAncestors(currentCategory);
        ancestors.forEach(a => path.push(a.name));
        newFolderLocationText.textContent = `📍 Local de destino: ${path.join(' › ')}`;
      } else if (currentFarm && activeFarm) {
        newFolderLocationText.textContent = `📍 Local de destino: ${activeFarm.name}`;
      } else {
        newFolderLocationText.textContent = `📍 Local de destino: Todos os Arquivos (Raiz Global)`;
      }
    }

    newFolderModal.classList.add('visible');
    const input = document.getElementById('newFolderNameInput');
    if (input) input.focus();
    lucide.createIcons();
  }

  function closeNewFolderModal() {
    if (newFolderModal) newFolderModal.classList.remove('visible');
    if (newFolderForm) newFolderForm.reset();
    // Reseta seleção visual do ícone para o primeiro (folder)
    iconPickerTiles.forEach(t => t.classList.remove('active'));
    if (iconPickerTiles[0]) iconPickerTiles[0].classList.add('active');
    if (newFolderIconInput) newFolderIconInput.value = 'folder';
    if (newFolderStatusMessage) newFolderStatusMessage.textContent = '';
  }

  if (newFolderBtn) newFolderBtn.addEventListener('click', openNewFolderModal);
  if (newFolderModalCloseBtn) newFolderModalCloseBtn.addEventListener('click', closeNewFolderModal);
  if (newFolderCancelBtn) newFolderCancelBtn.addEventListener('click', closeNewFolderModal);

  if (newFolderModal) {
    newFolderModal.addEventListener('click', (e) => {
      if (e.target === newFolderModal) closeNewFolderModal();
    });
  }

  if (newFolderForm) {
    newFolderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const folderName = document.getElementById('newFolderNameInput').value.trim();
      const icon = (newFolderIconInput ? newFolderIconInput.value : 'folder') || 'folder';
      const colorClass = document.getElementById('newFolderColorSelect').value;
      const submitBtn = document.getElementById('newFolderSubmitBtn');

      if (!folderName) return;

      const slugId = 'pasta_' + folderName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
      const newFolderObj = {
        id: slugId,
        name: folderName,
        icon: icon,
        colorClass: colorClass,
        parentCategoryId: currentCategory || null,
        parentFarmId: currentFarm || null
      };

      submitBtn.disabled = true;
      newFolderStatusMessage.style.color = 'var(--text-secondary)';
      newFolderStatusMessage.textContent = '⏳ Criando pasta...';

      // 1. Salva localmente
      saveCustomFolder(newFolderObj);

      // 2. Se a tabela 'categorias_pastas' existir no Supabase, insere nela também
      if (supabaseClient) {
        try {
          await supabaseClient.from('categorias_pastas').insert([{
            slug: slugId,
            nome: folderName,
            icone: icon,
            cor_classe: colorClass
          }]);
        } catch (err) {
          // Ignora silenciosamente erros de schema opcional no Supabase
        }
      }

      newFolderStatusMessage.style.color = '#047857';
      newFolderStatusMessage.textContent = '✅ Pasta criada com sucesso!';

      renderPastasSection();

      setTimeout(() => {
        closeNewFolderModal();
        submitBtn.disabled = false;
      }, 600);
    });
  }

  // KEYBOARD SHORTCUTS
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const gs = document.getElementById('globalSearch');
      if (gs) gs.focus();
    }
  });

  const globalSearchInput = document.getElementById('globalSearch');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (q.trim().length > 0) {
        const pastasNavLink = document.querySelector('.nav-item[data-tab="pastas"]');
        if (pastasNavLink) pastasNavLink.click();
        
        if (pastasSearchInput) {
          pastasSearchInput.value = q;
          if (pastasSearchClearBtn) pastasSearchClearBtn.style.display = 'block';
          performPastasSearch(q);
        }
      }
    });
  }

  // CARREGAR DADOS DO SUPABASE AO INICIAR
  await loadFazendasFromSupabase();
  await loadObrigacoesFromSupabase();
  await loadDocumentosFromSupabase();
  renderPastasSection();
});
