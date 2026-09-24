import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { mockNotices } from '../data/mockData';
import type { Notice, NoticePriority } from '../types';
import { AlertCircle, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRIORITY_ICON: Record<NoticePriority, React.ReactNode> = { urgent: <AlertCircle size={16} style={{display:'inline', marginBottom:'-3px'}} />, important: <AlertTriangle size={16} style={{display:'inline', marginBottom:'-3px'}} />, general: <Info size={16} style={{display:'inline', marginBottom:'-3px'}} /> };

const Notices: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [activeFilter, setActiveFilter] = useState<'all'|NoticePriority>('all');
  const [showNew, setShowNew] = useState(false);
  const [viewNotice, setViewNotice] = useState<Notice|null>(null);
  const [form, setForm] = useState({ title:'', content:'', priority:'general' as NoticePriority, expiryDate:'', target:'All Residents', pinned:false });

  const [dismissedAlert, setDismissedAlert] = useState(false);

  const filtered = notices.filter(n => activeFilter==='all' || n.priority===activeFilter);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const nn: Notice = {
      id: `n${Date.now()}`, ...form,
      publishedBy: 'Warden Kamath', publishedDate: new Date().toISOString().slice(0,10),
    };
    setNotices(prev=>[nn,...prev]);
    setShowNew(false);
    setForm({title:'',content:'',priority:'general',expiryDate:'',target:'All Residents',pinned:false});
  };

  const deleteNotice = (id: string) => {
    if (!confirm('Delete this notice?')) return;
    setNotices(prev=>prev.filter(n=>n.id!==id));
    setViewNotice(null);
  };

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Notice Board</h1>
          <p className="page-subtitle">Circulars, alerts and official announcements for all residents</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ Publish Notice</button>
        )}
      </div>

      {/* URGENT BANNER */}
      {!dismissedAlert && notices.some(n=>n.pinned) && (() => {
        const pinned = notices.find(n=>n.pinned);
        if (!pinned) return null;
        return (
          <div style={{ background:'linear-gradient(135deg, var(--clr-danger), #dc2626)', color:'#fff', borderRadius:'var(--radius-md)', padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
            <span style={{fontSize:'1.5rem'}}><BellRing size={24} /></span>
            <div>
              <div style={{fontWeight:800,fontSize:'1rem',marginBottom:4}}>URGENT: {pinned.title}</div>
              <div style={{fontSize:'.85rem',opacity:.85}}>{pinned.content}</div>
            </div>
            <button onClick={()=>setDismissedAlert(true)} style={{marginLeft:'auto',color:'#fff',fontSize:'1.2rem',background:'none',border:'none',cursor:'pointer',opacity:.7}}>✕</button>
          </div>
        );
      })()}

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {(['all','urgent','important','general'] as const).map(tab=>(
          <button key={tab} className={`filter-tab${activeFilter===tab?' active':''}`} onClick={()=>setActiveFilter(tab)}>
            {tab==='all'?`All Notices`:tab==='urgent'?'Urgent':tab==='important'?'Important':'General'}
          </button>
        ))}
      </div>

      {/* NOTICES GRID */}
      <div className="notices-grid">
        {filtered.map(n=>(
          <div key={n.id} className={`notice-card ${n.priority}`} onClick={()=>setViewNotice(n)}>
            <div className="notice-meta">
              <span className="notice-category">{PRIORITY_ICON[n.priority]} {n.priority.charAt(0).toUpperCase()+n.priority.slice(1)}</span>
              {n.pinned && <Badge variant="full">Pinned</Badge>}
            </div>
            <h3>{n.title}</h3>
            <p>{n.content}</p>
            <div className="notice-expiry">Expires: {n.expiryDate} · By: {n.publishedBy}</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{color:'var(--clr-text-muted)',textAlign:'center',padding:'40px 0',gridColumn:'1/-1'}}>No notices found.</div>}
      </div>

      {/* PUBLISH MODAL */}
      <Modal isOpen={showNew} onClose={()=>setShowNew(false)} title="Publish New Notice">
        <form onSubmit={handlePublish}>
          <div className="form-group"><label>Notice Title</label><input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Enter notice title…" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Priority</label>
              <select className="form-select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as NoticePriority}))}>
                <option value="general">General</option><option value="important">Important</option><option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group"><label>Expiry Date</label><input className="form-input" type="date" value={form.expiryDate} onChange={e=>setForm(f=>({...f,expiryDate:e.target.value}))} required /></div>
          </div>
          <div className="form-group"><label>Notice Content</label><textarea className="form-textarea" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Write the full notice content…" required /></div>
          <div className="form-group"><label>Target Audience</label>
            <select className="form-select" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}>
              <option>All Residents</option><option>Block A</option><option>Block B</option><option>Block C (Girls)</option><option>Block D (Girls)</option>
            </select>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <input type="checkbox" id="pin-notice" checked={form.pinned} onChange={e=>setForm(f=>({...f,pinned:e.target.checked}))} style={{width:16,height:16}} />
            <label htmlFor="pin-notice" style={{fontSize:'.85rem',fontWeight:500,cursor:'pointer'}}>Pin this notice</label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-dark" onClick={()=>setShowNew(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Notice</button>
          </div>
        </form>
      </Modal>

      {/* VIEW NOTICE MODAL */}
      {viewNotice && (
        <Modal isOpen={!!viewNotice} onClose={()=>setViewNotice(null)} title="Notice Details">
          <div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <Badge variant={viewNotice.priority==='urgent'?'danger':viewNotice.priority==='important'?'pending':'active'}>
                {PRIORITY_ICON[viewNotice.priority]} {viewNotice.priority}
              </Badge>
              {viewNotice.pinned&&<Badge variant="full">Pinned</Badge>}
            </div>
            <h2 style={{fontSize:'1.1rem',fontWeight:800,marginBottom:12}}>{viewNotice.title}</h2>
            <p style={{fontSize:'.9rem',color:'var(--clr-text-secondary)',lineHeight:1.7,marginBottom:16}}>{viewNotice.content}</p>
            <div style={{background:'var(--clr-bg)',borderRadius:'var(--radius-sm)',padding:12,fontSize:'.82rem',color:'var(--clr-text-muted)'}}>
              <div><strong>Published by:</strong> {viewNotice.publishedBy}</div>
              <div><strong>Date:</strong> {viewNotice.publishedDate}</div>
              <div><strong>Expires:</strong> {viewNotice.expiryDate}</div>
              <div><strong>Audience:</strong> {viewNotice.target}</div>
            </div>
            <div className="modal-footer">
              {isAdmin && (
                <button className="btn btn-danger btn-sm" onClick={()=>deleteNotice(viewNotice.id)}>Delete</button>
              )}
              <button className="btn btn-primary btn-sm" onClick={()=>setViewNotice(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};

export default Notices;
