import React, { useState, useEffect } from 'react';
import { Search, User, BarChart2, Calendar, Award, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { db } from '../../services/db';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView: (view: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToView
}) => {
  const [query, setQuery] = useState('');
  const users = db.getUsers();
  const surveys = db.getSurveys();
  const leaves = db.getLeaves();

  const filteredUsers = query.trim()
    ? users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredSurveys = query.trim()
    ? surveys.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredLeaves = query.trim()
    ? leaves.filter((l) => l.userName.toLowerCase().includes(query.toLowerCase()) || l.reason.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Platform Search" maxWidth="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Type employee name, survey title, leave reason..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {!query.trim() ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Start typing to search employees, surveys, and leave records...
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {/* Employee Results */}
            {filteredUsers.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Employees ({filteredUsers.length})</span>
                <div className="space-y-1.5">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onNavigateToView('directory');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.title} • {u.department}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Survey Results */}
            {filteredSurveys.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Surveys ({filteredSurveys.length})</span>
                <div className="space-y-1.5">
                  {filteredSurveys.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigateToView('surveys');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{s.title}</p>
                        <p className="text-[10px] text-slate-500">"{s.question}"</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredUsers.length === 0 && filteredSurveys.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching results found for "{query}".
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
