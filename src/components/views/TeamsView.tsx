import React, { useState } from 'react';
import { 
  Users, Plus, ShieldCheck, UserCheck, Briefcase, Trash2, Edit3, 
  Search, Check, X, Building2, UserPlus, Info, Layers
} from 'lucide-react';
import { User, Team, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface TeamsViewProps {
  currentUser: User;
}

export const TeamsView: React.FC<TeamsViewProps> = ({ currentUser }) => {
  const [teams, setTeams] = useState<Team[]>(db.getTeams());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Build Team Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form Fields
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [managerId, setManagerId] = useState(currentUser.role === 'Manager' ? currentUser.id : '');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  const canManage = currentUser.role === 'Manager' || currentUser.role === 'HR';

  const refreshData = () => {
    setTeams([...db.getTeams()]);
    setUsers([...db.getUsers()]);
  };

  const departments = ['All', 'Engineering', 'Product & Design', 'People Operations', 'Marketing', 'Executive'];

  const filteredTeams = teams.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || t.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleOpenCreateModal = () => {
    if (!canManage) return;
    setEditingTeam(null);
    setTeamName('');
    setDepartment(currentUser.department || 'Engineering');
    setManagerId(currentUser.role === 'Manager' ? currentUser.id : (users.find(u => u.role === 'Manager')?.id || ''));
    setTeamLeadId(users.find(u => u.role === 'Team Lead')?.id || '');
    setSelectedMemberIds([]);
    setDescription('');
    setMemberSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team: Team) => {
    if (!canManage) return;
    setEditingTeam(team);
    setTeamName(team.name);
    setDepartment(team.department);
    setManagerId(team.managerId);
    setTeamLeadId(team.teamLeadId || '');
    setSelectedMemberIds(team.memberIds || []);
    setDescription(team.description || '');
    setMemberSearch('');
    setIsModalOpen(true);
  };

  const handleToggleMember = (userId: string) => {
    if (!canManage) return;
    setSelectedMemberIds((prev) => 
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmitTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !teamName.trim() || !department) return;

    db.saveTeam({
      id: editingTeam ? editingTeam.id : undefined,
      name: teamName.trim(),
      department,
      managerId: managerId || currentUser.id,
      teamLeadId: teamLeadId || undefined,
      memberIds: selectedMemberIds,
      description: description.trim()
    });

    refreshData();
    setIsModalOpen(false);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!canManage) return;
    db.deleteTeam(teamId);
    refreshData();
  };

  // Filter available candidates for members selection
  const eligibleMembers = users.filter((u) => {
    const searchMatch = u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        u.title.toLowerCase().includes(memberSearch.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" /> Teams & Organization Builder
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build squads, assign team leads, and organize team members into high-performing units.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Build New Team
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search teams by name, dept or lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500 shrink-0">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => {
          const managerUser = users.find((u) => u.id === team.managerId);
          const leadUser = users.find((u) => u.id === team.teamLeadId);
          const teamMembers = users.filter((u) => team.memberIds?.includes(u.id));

          return (
            <div key={team.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-4">
                {/* Team Top Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      {team.department}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(team)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Team & Members"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {team.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Structure Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  {/* Department Manager */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-700 shrink-0">Manager:</span>
                      <span className="font-medium text-slate-900 truncate">
                        {managerUser ? managerUser.name : (team.managerName || 'Unassigned')}
                      </span>
                    </div>
                    <Badge size="sm" variant="info">Manager</Badge>
                  </div>

                  {/* Team Lead */}
                  <div className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-700 shrink-0">Team Lead:</span>
                      <span className="font-medium text-slate-900 truncate">
                        {leadUser ? leadUser.name : (team.teamLeadName || 'Unassigned')}
                      </span>
                    </div>
                    <Badge size="sm" variant="warning">Team Lead</Badge>
                  </div>

                  {/* Team Members List */}
                  <div>
                    <div className="flex items-center justify-between text-slate-500 font-semibold mb-1.5 text-[11px]">
                      <span>Team Members ({teamMembers.length})</span>
                      {canManage && (
                        <button
                          onClick={() => handleOpenEditModal(team)}
                          className="text-indigo-600 hover:underline text-[10px]"
                        >
                          + Add/Remove
                        </button>
                      )}
                    </div>

                    {teamMembers.length > 0 ? (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg shrink-0" title={`${m.name} (${m.title})`}>
                            <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                            <span className="text-[11px] font-medium text-slate-800">{m.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-slate-400 bg-slate-50 p-2 rounded-lg text-center">
                        No team members added yet. Click edit to assign employees.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Meta */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created {team.createdAt || '2026'}</span>
                <span className="font-medium text-slate-600">{teamMembers.length + (leadUser ? 1 : 0)} Total Members</span>
              </div>
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No teams found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by creating your department's teams and assigning team leads and staff members.
            </p>
            {canManage && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Build First Team
              </button>
            )}
          </div>
        )}
      </div>

      {/* Build/Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeam ? 'Edit Team Structure' : 'Build New Team'}
        size="lg"
      >
        <form onSubmit={handleSubmitTeam} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Team Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Engineering Core"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="People Operations">People Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                {users.filter(u => u.role === 'Manager' || u.role === 'HR').map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Team Lead */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2">
            <label className="block font-bold text-amber-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-600" /> Select Team Lead
            </label>
            <p className="text-[11px] text-amber-700">
              The Team Lead manages sprint goals, approves peer shoutouts, and monitors team wellness.
              <strong className="block mt-0.5 text-amber-900 font-semibold">
                ⚠️ Policy: A Team Lead can only lead 1 team. Selecting a lead who currently manages another team will transfer their leadership to this team.
              </strong>
            </p>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(e.target.value)}
              className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-slate-800 font-medium"
            >
              <option value="">-- Choose Team Lead --</option>
              {users.map((u) => {
                const existingLedTeam = teams.find((t) => t.teamLeadId === u.id && t.id !== editingTeam?.id);
                return (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.title} ({u.role}) {existingLedTeam ? `[Currently Lead of: ${existingLedTeam.name}]` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Select Team Members */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Select Team Members ({selectedMemberIds.length} Selected)
              </label>
              <span className="text-[10px] text-slate-500">Click to add or remove members</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter members by name or title..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
              {eligibleMembers.map((u) => {
                const isSelected = selectedMemberIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => handleToggleMember(u.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="truncate">
                        <p className="text-xs truncate font-medium">{u.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.title} • {u.department}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Team Goals & Description</label>
            <textarea
              rows={3}
              placeholder="Brief overview of team mission, project responsibilities, or technical stack..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
            >
              {editingTeam ? 'Save Team Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
