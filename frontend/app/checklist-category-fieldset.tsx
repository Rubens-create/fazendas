import { FileText } from 'lucide-react';

type ChecklistFarm = { id: string; checklist?: { documentKey: string; label?: string }[] };
type ChecklistCategoryProps = { title: string; prefix: string; farm: ChecklistFarm; folders: { id: string; name: string; parentFolderId?: string | null }[]; search: string };

export function ChecklistCategoryFieldset({ title, prefix, farm, folders, search }: ChecklistCategoryProps) {
  const items = (farm.checklist ?? []).filter(item => item.documentKey.startsWith(prefix) && (item.label ?? item.documentKey).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <fieldset className="documents-category-fieldset"><legend>{title}</legend><div className="farm-checklist-links">{items.length ? items.map(item => { const folder = folders.find(candidate => candidate.name === (item.label ?? item.documentKey) && candidate.parentFolderId); return <button className="farm-checklist-link" key={item.documentKey} disabled={!folder} onClick={() => { if (folder) window.location.href = `/pastas?farmId=${farm.id}&folderId=${folder.id}`; }}><FileText size={18} /><span>{item.label ?? item.documentKey}</span><span className="farm-checklist-arrow">{folder ? 'Abrir pasta →' : 'Pasta indisponível'}</span></button>; }) : <p className="text-muted">Nenhum documento encontrado.</p>}</div></fieldset>;
}
