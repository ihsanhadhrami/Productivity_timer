import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListChecks, ChevronDown, Pencil, X, Check } from 'lucide-react';
import { ChunkProject, ChunkItem } from '../types';

interface ChunkingPanelProps {
  projects: ChunkProject[];
  onProjectsChange: (projects: ChunkProject[]) => void;
  isDarkTheme: boolean;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const ChunkingPanel: React.FC<ChunkingPanelProps> = ({ projects, onProjectsChange, isDarkTheme }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    return new Set(projects.map(p => p.id));
  });
  const [newChunkTexts, setNewChunkTexts] = useState<Record<string, string>>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingChunkText, setEditingChunkText] = useState('');
  const newChunkInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand new projects
  useEffect(() => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      projects.forEach(p => {
        if (!prev.has(p.id) && p.chunks.length === 0) {
          next.add(p.id);
        }
      });
      return next;
    });
  }, [projects.length]);

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    const project: ChunkProject = {
      id: generateId(),
      name,
      chunks: [],
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };
    onProjectsChange([project, ...projects]);
    setNewProjectName('');
    setExpandedProjects(prev => new Set(prev).add(project.id));
  };

  const deleteProject = (projectId: string) => {
    onProjectsChange(projects.filter(p => p.id !== projectId));
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  const addChunk = (projectId: string) => {
    const text = (newChunkTexts[projectId] || '').trim();
    if (!text) return;
    const chunk: ChunkItem = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    onProjectsChange(
      projects.map(p =>
        p.id === projectId ? { ...p, chunks: [...p.chunks, chunk] } : p
      )
    );
    setNewChunkTexts(prev => ({ ...prev, [projectId]: '' }));
    // Re-focus the input
    setTimeout(() => newChunkInputRefs.current[projectId]?.focus(), 50);
  };

  const toggleChunk = (projectId: string, chunkId: string) => {
    onProjectsChange(
      projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              chunks: p.chunks.map(c =>
                c.id === chunkId
                  ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString() : undefined }
                  : c
              ),
            }
          : p
      )
    );
  };

  const deleteChunk = (projectId: string, chunkId: string) => {
    onProjectsChange(
      projects.map(p =>
        p.id === projectId
          ? { ...p, chunks: p.chunks.filter(c => c.id !== chunkId) }
          : p
      )
    );
  };

  const startEditProject = (project: ChunkProject) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const saveEditProject = () => {
    if (!editingProjectId || !editingProjectName.trim()) return;
    onProjectsChange(
      projects.map(p =>
        p.id === editingProjectId ? { ...p, name: editingProjectName.trim() } : p
      )
    );
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const startEditChunk = (chunk: ChunkItem) => {
    setEditingChunkId(chunk.id);
    setEditingChunkText(chunk.text);
  };

  const saveEditChunk = (projectId: string) => {
    if (!editingChunkId || !editingChunkText.trim()) return;
    onProjectsChange(
      projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              chunks: p.chunks.map(c =>
                c.id === editingChunkId ? { ...c, text: editingChunkText.trim() } : c
              ),
            }
          : p
      )
    );
    setEditingChunkId(null);
    setEditingChunkText('');
  };

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const getProgress = (chunks: ChunkItem[]) => {
    if (chunks.length === 0) return 0;
    return Math.round((chunks.filter(c => c.completed).length / chunks.length) * 100);
  };

  const isAllComplete = (chunks: ChunkItem[]) => chunks.length > 0 && chunks.every(c => c.completed);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
          <ListChecks className="inline-block mr-3 text-accent" size={32} />
          Task Chunking
        </h1>
        <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>
          Break your work into manageable chunks. Complete them one by one.
        </p>
      </div>

      {/* Add New Project */}
      <div className={`flex gap-2 mb-8 ${isDarkTheme ? '' : ''}`}>
        <input
          ref={newProjectInputRef}
          type="text"
          value={newProjectName}
          onChange={e => setNewProjectName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addProject()}
          placeholder="New project or task group..."
          className={`flex-1 px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
            isDarkTheme
              ? 'bg-surface/60 border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:ring-1 focus:ring-accent/20'
              : 'bg-white/80 border-stone-200/60 text-stone-800 placeholder:text-stone-400 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-200/40'
          }`}
        />
        <button
          onClick={addProject}
          disabled={!newProjectName.trim()}
          className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
            newProjectName.trim()
              ? 'bg-accent text-black hover:bg-accent/90 active:scale-95'
              : isDarkTheme
                ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border border-dashed ${
          isDarkTheme ? 'border-white/10 text-slate-500' : 'border-stone-200 text-stone-400'
        }`}>
          <ListChecks size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">No projects yet</p>
          <p className="text-sm">Create a project above and break it into chunks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(project => {
            const progress = getProgress(project.chunks);
            const allDone = isAllComplete(project.chunks);
            const isExpanded = expandedProjects.has(project.id);
            const completedCount = project.chunks.filter(c => c.completed).length;

            return (
              <div
                key={project.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  allDone
                    ? isDarkTheme
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-emerald-50/60 border-emerald-200/50'
                    : isDarkTheme
                      ? 'bg-surface/40 border-white/5 hover:border-white/10'
                      : 'bg-white/70 border-stone-200/60 hover:border-stone-300/60'
                } shadow-sm`}
              >
                {/* Project Header */}
                <div
                  className={`flex items-center gap-3 px-5 py-4 cursor-pointer select-none ${
                    isDarkTheme ? 'hover:bg-white/[0.02]' : 'hover:bg-stone-50/50'
                  }`}
                  onClick={() => toggleExpanded(project.id)}
                >
                  <button className={`transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={18} className={isDarkTheme ? 'text-slate-400' : 'text-stone-400'} />
                  </button>

                  {/* Project name / edit */}
                  <div className="flex-1 min-w-0">
                    {editingProjectId === project.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editingProjectName}
                          onChange={e => setEditingProjectName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditProject();
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          className={`flex-1 px-2 py-1 text-base font-semibold rounded-lg border outline-none ${
                            isDarkTheme
                              ? 'bg-white/5 border-white/10 text-white'
                              : 'bg-white border-stone-200 text-stone-800'
                          }`}
                        />
                        <button onClick={saveEditProject} className="text-accent hover:scale-110 transition-transform">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingProjectId(null)} className={`hover:scale-110 transition-transform ${isDarkTheme ? 'text-slate-400' : 'text-stone-400'}`}>
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-semibold truncate ${
                          allDone
                            ? isDarkTheme ? 'text-emerald-400 line-through' : 'text-emerald-600 line-through'
                            : isDarkTheme ? 'text-white' : 'text-stone-800'
                        }`}>
                          {project.name}
                        </h3>
                        <button
                          onClick={e => { e.stopPropagation(); startEditProject(project); }}
                          className={`opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ${isDarkTheme ? 'text-slate-500 hover:text-slate-300' : 'text-stone-400 hover:text-stone-600'}`}
                          style={{ opacity: undefined }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress badge */}
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    {project.chunks.length > 0 && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        allDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDarkTheme
                            ? 'bg-white/5 text-slate-400'
                            : 'bg-stone-100 text-stone-500'
                      }`}>
                        {completedCount}/{project.chunks.length}
                      </span>
                    )}
                    <button
                      onClick={() => deleteProject(project.id)}
                      className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                        isDarkTheme
                          ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-stone-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {project.chunks.length > 0 && (
                  <div className={`mx-5 h-1.5 rounded-full overflow-hidden ${isDarkTheme ? 'bg-white/5' : 'bg-stone-100'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        allDone ? 'bg-emerald-500' : 'bg-accent'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Expanded content: chunks */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-3">
                    {/* Chunk list */}
                    <div className="space-y-1.5">
                      {project.chunks.map(chunk => (
                        <div
                          key={chunk.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all ${
                            chunk.completed
                              ? isDarkTheme ? 'bg-white/[0.02]' : 'bg-stone-50/50'
                              : isDarkTheme ? 'hover:bg-white/[0.03]' : 'hover:bg-stone-50/80'
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleChunk(project.id, chunk.id)}
                            className={`flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-90 ${
                              chunk.completed ? 'text-emerald-500' : isDarkTheme ? 'text-slate-500 hover:text-accent' : 'text-stone-300 hover:text-emerald-500'
                            }`}
                          >
                            {chunk.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                          </button>

                          {/* Chunk text / edit */}
                          {editingChunkId === chunk.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                autoFocus
                                value={editingChunkText}
                                onChange={e => setEditingChunkText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEditChunk(project.id);
                                  if (e.key === 'Escape') setEditingChunkId(null);
                                }}
                                className={`flex-1 px-2 py-1 text-sm rounded-lg border outline-none ${
                                  isDarkTheme
                                    ? 'bg-white/5 border-white/10 text-white'
                                    : 'bg-white border-stone-200 text-stone-800'
                                }`}
                              />
                              <button onClick={() => saveEditChunk(project.id)} className="text-accent hover:scale-110 transition-transform">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingChunkId(null)} className={isDarkTheme ? 'text-slate-400' : 'text-stone-400'}>
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`flex-1 text-sm transition-all ${
                                chunk.completed
                                  ? isDarkTheme ? 'line-through text-slate-500' : 'line-through text-stone-400'
                                  : isDarkTheme ? 'text-slate-200' : 'text-stone-700'
                              }`}
                            >
                              {chunk.text}
                            </span>
                          )}

                          {/* Actions (visible on hover) */}
                          {editingChunkId !== chunk.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditChunk(chunk)}
                                className={`p-1 rounded-md transition-colors ${
                                  isDarkTheme ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-stone-100 text-stone-400 hover:text-stone-600'
                                }`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteChunk(project.id, chunk.id)}
                                className={`p-1 rounded-md transition-colors ${
                                  isDarkTheme ? 'hover:bg-red-500/10 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-stone-400 hover:text-red-500'
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new chunk input */}
                    <div className="flex gap-2 mt-3">
                      <input
                        ref={el => { newChunkInputRefs.current[project.id] = el; }}
                        type="text"
                        value={newChunkTexts[project.id] || ''}
                        onChange={e => setNewChunkTexts(prev => ({ ...prev, [project.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addChunk(project.id)}
                        placeholder="Add a chunk..."
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                          isDarkTheme
                            ? 'bg-white/[0.03] border-white/5 text-white placeholder:text-slate-600 focus:border-accent/30'
                            : 'bg-stone-50/50 border-stone-200/50 text-stone-800 placeholder:text-stone-400 focus:border-emerald-300/50'
                        }`}
                      />
                      <button
                        onClick={() => addChunk(project.id)}
                        disabled={!(newChunkTexts[project.id] || '').trim()}
                        className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-1 ${
                          (newChunkTexts[project.id] || '').trim()
                            ? isDarkTheme
                              ? 'bg-accent/10 text-accent hover:bg-accent/20 active:scale-95'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
                            : isDarkTheme
                              ? 'bg-white/[0.02] text-slate-600 cursor-not-allowed'
                              : 'bg-stone-50 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Completion celebratory message */}
                    {allDone && (
                      <div className={`mt-4 text-center py-3 rounded-xl ${
                        isDarkTheme ? 'bg-emerald-500/10' : 'bg-emerald-50'
                      }`}>
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          🎉 All chunks completed! Great work!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats at bottom */}
      {projects.length > 0 && (
        <div className={`mt-8 grid grid-cols-3 gap-4`}>
          <div className={`text-center p-4 rounded-2xl ${isDarkTheme ? 'bg-surface/40 border border-white/5' : 'bg-white/70 border border-stone-200/60'}`}>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
              {projects.length}
            </p>
            <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Projects</p>
          </div>
          <div className={`text-center p-4 rounded-2xl ${isDarkTheme ? 'bg-surface/40 border border-white/5' : 'bg-white/70 border border-stone-200/60'}`}>
            <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-stone-800'}`}>
              {projects.reduce((sum, p) => sum + p.chunks.filter(c => c.completed).length, 0)}
              <span className={`text-sm font-normal ${isDarkTheme ? 'text-slate-500' : 'text-stone-400'}`}>
                /{projects.reduce((sum, p) => sum + p.chunks.length, 0)}
              </span>
            </p>
            <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Chunks Done</p>
          </div>
          <div className={`text-center p-4 rounded-2xl ${isDarkTheme ? 'bg-surface/40 border border-white/5' : 'bg-white/70 border border-stone-200/60'}`}>
            <p className={`text-2xl font-bold ${
              projects.reduce((sum, p) => sum + p.chunks.length, 0) > 0
                ? isDarkTheme ? 'text-accent' : 'text-emerald-600'
                : isDarkTheme ? 'text-white' : 'text-stone-800'
            }`}>
              {projects.reduce((sum, p) => sum + p.chunks.length, 0) > 0
                ? Math.round(
                    (projects.reduce((sum, p) => sum + p.chunks.filter(c => c.completed).length, 0) /
                      projects.reduce((sum, p) => sum + p.chunks.length, 0)) *
                      100
                  )
                : 0}%
            </p>
            <p className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-stone-500'}`}>Progress</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkingPanel;
